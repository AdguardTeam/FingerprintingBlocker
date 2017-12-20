const gulp = require('gulp');
const uglify = require('gulp-uglify');
const insert = require('gulp-insert');

module.exports = () => {
    return gulp.src(options["USERSCRIPT_FILE_PATH"])
        .pipe(uglify(options["UGLIFY_OPTIONS"]))
        .pipe(insert.transform((content) => {
            return '(function() {\n' + content + '\n})();'
        }))
        .pipe(gulp.dest(options["OUTPUT_PATH"]));
};
