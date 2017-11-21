const exec = require('child_process').exec;
const fs = require('fs');
const gulp = require('gulp');
const insert = require('gulp-insert');

module.exports = (done) => {
    exec(`emcc -O3 -s ONLY_MY_CODE=1 -s EXPORTED_FUNCTIONS="['_apply_noise']"  -g0 --separate-asm src/asm/noiseApplyerModule2D.c -o src/asm/noiseApplyerModule2D.js`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            done();
            return;
        }
        console.log(stdout);

        const reAsmModule = /^\s*Module\[["']asm["']\]\s*=\s*\(\s*(function\s*\([\s\S]*\})\s*\)\s*;\s*$/;

        fs.unlink('src/asm/noiseApplyerModule2D.js', function(err) {
            if(err && err.code == 'ENOENT') {

            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error("Error occurred while trying to remove file");
            } else {
                
            }

            gulp.src('src/asm/*.asm.js')    
                .pipe(insert.transform((content) => {
                    return content.replace(reAsmModule, (_, c1) => {
                        return `var noiseApplyerModule2D = ${c1}`;
                    })
                }))
                .pipe(gulp.dest('src/asm'))
                .on('end', () => {
                    done();
                });
        });

    });
}

