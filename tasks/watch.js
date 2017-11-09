const gulp = require('gulp');

module.exports = () => {
    function onerror (error) {
        console.log(error.toString());
        this.emit('end');
    };
    function onchange (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', building...');
    };
    gulp.watch('src/**/*', ['dev'])
        .on('change', onchange)
        .on('error', onerror);
    gulp.watch('tests/**/*.ts', ['build-test'])
        .on('change', onchange)
        .on('error', onerror);
};
