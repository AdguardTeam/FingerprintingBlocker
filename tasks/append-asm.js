const gulp = require('gulp');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

module.exports = () => {
    return gulp.src([options["USERSCRIPT_FILE_PATH"], 'src/asm/**/*.js'])
    	.pipe(concat(options["USERSCRIPT_FILE_NAME"]))
        .pipe(gulp.dest(options["OUTPUT_PATH"]));
};
