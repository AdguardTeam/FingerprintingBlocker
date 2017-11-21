const gulp        = require('gulp');
const runSequence = require('run-sequence');
const path        = require('path');
const fs          = require('fs');

/**********************************************************************************************/
/********************************** Global settings object ************************************/
/**********************************************************************************************/

global.options = {

/**********************************************************************************************/
// Userscript information

"SCRIPT_NAME": "fingerprintingblocker",
"VERSION": "1.0",
"CHANNELS": ["Dev", "Beta", "Release"],
"DOWNLOAD_UPDATE_URL": {
    "Dev": "https://AdguardTeam.github.io/FingerprintingBlocker/",
    get "Beta"() {
        return "https://cdn.adguard.com/public/Userscripts/Beta/AdguardFingerpringingBlocker/"
            + options["VERSION"];
    },
    get "Release"() {
        return "https://cdn.adguard.com/public/Userscripts/AdguardFingerpringingBlocker/"
            + options["VERSION"];
    }
},

get "USERSCRIPT_FILE_NAME"() {
    return options["SCRIPT_NAME"] + '.user.js';
},
get "META_FILE_NAME"() {
    return options["SCRIPT_NAME"] + '.meta.js';
},

/**********************************************************************************************/
// Userscript Meta Configuration

get "CHANNEL"() {
    return this._channel;
},
set "CHANNEL"(channel) {
    if (this["CHANNELS"].indexOf(channel) === -1) { throw new Error("Unsupported channel"); }
    this._channel = channel;
},
get "META_CONFIG"() {
    let url = options["DOWNLOAD_UPDATE_URL"][options["CHANNEL"]];
    return {
        'DOWNLOAD_URL': url ? url + options["SCRIPT_NAME"] : '',
        'UPDATE_URL': url ? url + options["META_FILE_NAME"] : '',
        'NAME_SUFFIX': options["CHANNEL"].startsWith('Release') ? '' : options["CHANNEL"]
    };
},

/**********************************************************************************************/
// Build Configuration

"SOURCE_PATH": "src",
"OUTPUT_PATH": "build",
"TSCC_PREP_DIR": "prep",
"TSICKLE_DIR": "tscc",

get "USERSCRIPT_FILE_PATH"() {
    return path.join(options["OUTPUT_PATH"], options["USERSCRIPT_FILE_NAME"]);
},
get "META_FILE_PATH"() {
    return path.join(options["OUPUT_PATH"], options["META_FILE_NAME"]);
},
get "TSCC_PREP_PATH"() {
    return path.join(options["OUTPUT_PATH"], options["TSCC_PREP_DIR"]);
},
get "TSCC_PATH"() {
    return path.join(options["OUTPUT_PATH"], options["TSICKLE_DIR"]);
},

/**********************************************************************************************/
// Locale Settings

"LOCALES": ["en", "ru", "de", "tr", "uk", "pl", "pt_BR", "ko", "zh_CN", "sr-Latn", "fr",
            "sk", "hy", "es_419", "it", "id", "nl", "bg", "vi", "hr", "hu", "ca", "zh_TW"],
"LOCALES_DIR": 'src/locales',
"LOCALES_SOURCE_FILE": 'en.json'

/**********************************************************************************************/

};


/**********************************************************************************************/
/********************************** JS Transformer Settings ***********************************/
/**********************************************************************************************/

const opts_cc         = require('./tasks/options/cc');
const opts_rollup     = require('./tasks/options/rollup');
const opts_uglify     = require('./tasks/options/uglify');


/**********************************************************************************************/
/********************************** Atomic Tasks **********************************************/
/**********************************************************************************************/

gulp.task('clean',      require('./tasks/clean'));
gulp.task('meta',       require('./tasks/meta'));
gulp.task('rollup',     require('./tasks/rollup'));

gulp.task('validate-asm', require('./tasks/asm/validate'));
gulp.task('generate-asm', require('./tasks/asm/generate'));
gulp.task('append-asm', require('./tasks/asm/append'));

gulp.task('tsickle',    require('./tasks/tscc/tsickle'));
gulp.task('tscc',       require('./tasks/tscc/tscc'));
gulp.task('tscc-clean', require('./tasks/tscc/clean'));

gulp.task('uglify',     require('./tasks/uglify'));

gulp.task('build-test', require('./tasks/test'));

gulp.task('watch',      require('./tasks/watch'));


/**********************************************************************************************/
/********************************** Main Tasks ************************************************/
/**********************************************************************************************/

gulp.task("dev",
    (done) => {
        options["CHANNEL"] = "Dev";
        options["ROLLUP_OPTIONS"] = opts_rollup.dev
        runSequence('clean', 'rollup', 'append-asm', 'meta', done);
    }
);

gulp.task('beta',
    (done) => {
        options["CHANNEL"] = 'Beta';
        options["CC_OPTIONS"] = opts_cc.tscc;
        options["UGLIFY_OPTIONS"] = opts_uglify.asm_safe;
        runSequence('clean', 'tsickle', 'tscc'/*, 'tscc-clean'*/, 'append-asm', 'uglify', 'meta', done);
    }
);

gulp.task('release',
    (done) => {
        options["CHANNEL"] = 'Release';
        options["CC_OPTIONS"] = opts_cc.tscc;
        options["UGLIFY_OPTIONS"] = opts_uglify.asm_safe;
        runSequence('clean', 'tsickle', 'tscc', 'tscc-clean', 'append-asm'/*, 'uglify'*/, 'meta', done);
    }
);

gulp.task('release-no-minification',
    (done) => {
        options["CHANNEL"] = "Release";
        options["ROLLUP_OPTIONS"] = opts_rollup.dev;
        options["UGLIFY_OPTIONS"] = opts_uglify.dead_code_removal_only;
        runSequence('rollup', 'uglify', 'meta', done);
    }
);

gulp.task('build-ghpage',
    (done) => {
        runSequence('clean', ['dev', 'build-test'], done);
    }
);

gulp.task('testsToGhPages', ['build-ghpage'],
    () => {
        return [
            require('fs').writeFile('build/.nojekyll', ''),
            gulp.src(['test/index.html', 'test/**/*.js']).pipe(gulp.dest(options['OUTPUT_PATH'] + '/test/')),
            gulp.src('node_modules/mocha/mocha.*').pipe(gulp.dest(options['OUTPUT_PATH'] + '/node_modules/mocha/')),
            gulp.src('node_modules/chai/chai.js').pipe(gulp.dest(options['OUTPUT_PATH'] + '/node_modules/chai/'))
        ];
    }
);

/**********************************************************************************************/
/**********************************************************************************************/
/**********************************************************************************************/
