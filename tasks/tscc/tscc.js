const gulp = require('gulp');
const insert = require('gulp-insert');
const closureCompiler = require('google-closure-compiler').gulp();
const rename = require('gulp-rename');
const fs = require('fs');

const path = require('path');

const minifyHtml = require('html-minifier').minify;
const insertResource = require('../insert-resource');

const textHelper = require('../utill/transform-text');

/**
 * https://github.com/angular/tsickle/issues/481
 * tsickle uses module's relative path as a module name, 
 * and it occasionally breaks source code on Windows by using an absolute path
 * instead of a relative path, especially when using --typed option.
 * We fix it by applying regexes to replace `goog.forwardDeclare(C_.absolute.path.to.module.PopupBlocker.build.tsickle.index)`
 * into `goog.forwardDeclare('build.tsc.index').
 */

const reWorkaroundTsickleBug = new RegExp(`(goog.[A-Za-z]*\\(")(?:.*?\\.)?${options["SOURCE_PATH"]}\\.`, 'g');
const tsickleWorkaround = (content) => {
    return content.replace(reWorkaroundTsickleBug, (_, c1, c2) => {
        return `${c1}${options["OUTPUT_PATH"]}.${options["TSICKLE_DIR"]}.`;
    });
};

module.exports = () => {
    return gulp.src(options["TSCC_PATH"] + '/**/*.js')
        .pipe(insert.transform(tsickleWorkaround))
        .pipe(insert.transform(insertResource))
        .pipe(closureCompiler(options["CC_OPTIONS"]))
        .pipe(insert.transform(textHelper.removeCcExport))
        .pipe(rename(options["USERSCRIPT_FILE_NAME"]))
        .pipe(gulp.dest(options["OUTPUT_PATH"]));
};
