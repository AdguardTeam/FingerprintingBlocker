/**
 * @fileoverview Bundles typescript source files into a single userscript code.
 */
const gulp = require('gulp');
const insert = require('gulp-insert');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');

const insertResource = require('./insert-resource');

const removeGoogDeclareLegacyNamespace = require('./utill/transform-text').removeGoogDeclareLegacyNamespace;

module.exports = (done) => {
    return gulp.src(['src/**/*.ts', 'src/**/*.tsx'])
        .pipe(insert.transform(insertResource))
        .pipe(insert.transform(removeGoogDeclareLegacyNamespace))
        .pipe(rollup(options["ROLLUP_OPTIONS"]))
        .pipe(rename(options["USERSCRIPT_FILE_NAME"]))
        .pipe(gulp.dest(options["OUTPUT_PATH"]));
};
