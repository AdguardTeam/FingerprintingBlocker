const gulp = require('gulp');
const clean = require('gulp-clean');

module.exports = () => {
    return gulp.src([options["TSCC_PATH"]], {read: false})
        .pipe(clean());
};
