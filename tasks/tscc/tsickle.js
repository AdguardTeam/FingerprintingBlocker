const tsickleMain = require('./third-party/tsickle/main').main;

module.exports = (done) => {
    console.log(tsickleMain(`--externs=${options["TSCC_PATH"]}/generated-externs.js --typed -- -p tasks/tscc`.split(' ')));
    done();
};
