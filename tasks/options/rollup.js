const typescript = require('@alexlur/rollup-plugin-typescript'); // Faster, but does not throw on type-checking errors
const typescript2 = require('rollup-plugin-typescript2'); // Slower, but throws on type-checking errors

const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

const rollup_options = {
    entry: 'src/main.ts',
    plugins: [
        typescript2(),
    ],
    format: 'es'
};

const rollup_options_test = {
    entry: 'test/index.ts',
    plugins: [typescript()],
    format: 'iife'
};

const rollup_options_settings = {
    entry: 'src/ui/settings/main.tsx',
    plugins: [
        typescript2()
    ],
    format: 'iife'
}

module.exports = {
    dev: rollup_options,
    test: rollup_options_test,
    settings: rollup_options_settings
};
