const gulp = require('gulp');
const uglify = require('gulp-uglify');

module.exports = () => {
    return gulp.src(options["USERSCRIPT_FILE_PATH"])
        .pipe(uglify(options["UGLIFY_OPTIONS"]))
        .pipe(gulp.dest(options["OUTPUT_PATH"]));
};
