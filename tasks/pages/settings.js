const gulp = require('gulp');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');
const insert = require('gulp-insert');
const insertResource = require('../insert-resource');

module.exports = () => {
    return gulp.src(['src/**/*.ts', 'src/**/*.tsx'])
        .pipe(insert.transform(insertResource))
        .pipe(rollup(require('../options/rollup').settings))
        .pipe(rename('index.js'))
        .pipe(gulp.dest('./src/ui/settings/build'));
};
