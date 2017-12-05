const gulp = require('gulp');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');
const insert = require('gulp-insert');
const insertResource = require('../insert-resource');

module.exports = () => {
    return gulp.src(['test/**/*.ts', 'src/**/*.ts'])
        .pipe(insert.transform(insertResource))
        .pipe(rollup(require('../options/rollup').test))
        .pipe(rename('index.js'))
        .pipe(gulp.dest('./test/build'));
};
