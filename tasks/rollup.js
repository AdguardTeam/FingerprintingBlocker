/**
 * @fileoverview Bundles typescript source files into a single userscript code.
 */
const gulp = require('gulp');
const insert = require('gulp-insert');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');

const insertResource = require('./insert-resource');

module.exports = (done) => {
    return gulp.src(['src/**/*.ts', 'src/**/*.tsx', 'node_modules/preact/dist/preact.esm.js'])
        .pipe(insert.transform(insertResource))
        .pipe(rollup(options["ROLLUP_OPTIONS"]))
        .pipe(rename(options["USERSCRIPT_FILE_NAME"]))
        .pipe(gulp.dest(options["OUTPUT_PATH"]));
};
