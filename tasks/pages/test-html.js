const gulp = require('gulp')
const inline = require('gulp-inline')
const rename = require('gulp-rename')

module.exports = () => {
    return gulp.src('test/index.html')
        .pipe(inline({
            base: 'test/'
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('build/test/'));
};
