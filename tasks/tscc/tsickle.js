const exec = require('child_process').exec;

module.exports = (done) => {
    exec(`tsickle --externs=${options["TSCC_PATH"]}/generated-externs.js --typed -- -p tasks/tscc`, (err, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);
        done(err);
    });
};
