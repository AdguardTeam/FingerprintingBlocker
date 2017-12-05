const gulp = require('gulp')
const inline = require('gulp-inline')
const rename = require('gulp-rename')


module.exports = () => {
    return gulp.src('src/ui/settings/index.html')
        .pipe(inline({
            base: 'src/ui/settings/'
        }))
        .pipe(rename('settings.html'))
        .pipe(gulp.dest('build/'));
};
