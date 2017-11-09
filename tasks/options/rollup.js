const typescript = require('@alexlur/rollup-plugin-typescript'); // Faster, but does not throw on type-checking errors
const typescript2 = require('rollup-plugin-typescript2'); // Slower, but throws on type-checking errors

const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

const rollup_options = {
    entry: 'src/main.ts',
    plugins: [
        typescript2(),
        nodeResolve({ jsnext:true }),
        commonjs()
    ],
    format: 'es'
};

const rollup_options_test = {
    entry: 'tests/index.ts',
    plugins: [typescript()],
    format: 'iife'
};

module.exports = {
    dev: rollup_options,
    test: rollup_options_test
};