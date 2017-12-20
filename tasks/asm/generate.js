const exec = require('child_process').exec;
const fs = require('fs');
const replace = require('replace-in-file');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const reAsmModule = /^\s*Module\[["']asm["']\]\s*=\s*\(\s*(function\s*\([\s\S]*\})\s*\)\s*;\s*$/;
const ASM_ROOT_PATH = 'src/asm/';

const data = [
    {
        fileName: "BitmapNoiseApplier",
        export: ['_apply_noise'],
        module_name: 'bitmapNoiseApplier'
    },
    {
        fileName: "AudioNoiseApplier",
        export: [
            '_noise_to_time_domain',
            '_noise_to_frequency',
            '_noise_to_byte_frequency',
            '_noise_to_byte_time_domain'
        ],
        module_name: 'audioNoiseApplier'
    }
]

module.exports = async (done) => {
    return await data.forEach(async (info) => {
        try {
            const C = ASM_ROOT_PATH + info.fileName + '.c';
            const ASM = ASM_ROOT_PATH + info.fileName + '.asm.js';
            const PLAIN_JS = ASM_ROOT_PATH + info.fileName + '.js';

            const buf = await readFile(C);

            const file = buf.toString();

            await new Promise((resolve, reject) => {
                const command = `emcc ` +
                    `-O3 ` +
                    `-s ONLY_MY_CODE=1 ` +
                    `-s EXPORTED_FUNCTIONS="[${info.export.map(name => `'${name}'`).join(',')}]" ` +
                    `-g0 ` +
                    `--separate-asm ${C} ` +
                    `-o ${PLAIN_JS}`;

                exec(command, (err, stdout, stderr) => {
                    if (err) { reject(err); }
                    console.log(stdout);
                    console.error(stderr);
                    resolve();
                });
            });

            await Promise.all([
                unlink(PLAIN_JS),
                replace({
                    files: ASM,
                    from: reAsmModule,
                    to: (_, c1) => {
                        return `var ${info.module_name} = ${c1}`;
                    }
                })
            ]);
        } catch (err) {
            console.error(err);
        }
    });
}
