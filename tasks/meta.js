/**
 * @fileoverview Replaces placeholders in userscript meta file into appropriate values,
 * according to the build channel stored in the global `options` object. 
 */

const gulp = require('gulp');
const insert = require('gulp-insert');
const rename = require('gulp-rename');
const tap = require('gulp-tap');

const reScriptName = /^\/\/\s@name(?:\:[\w-]*)?\s.*$/gm;
const reMetadata = /^(\/\/\s@[^\s]*\s*)\[([A-Za-g_]*?)\][\s\S]*?\n/gm;

const replaceMeta = (config) => {
    return (text) => {
        return text.replace(reScriptName, (match) => (match + ' ' + config['NAME_SUFFIX']))
            .replace(reMetadata, (_, c1, c2) => {
            	let rep = config[c2];
            	if (rep) {
            		return c1 + config[c2] + '\n';
            	} else {
            		return '';
            	}
            });
    };
};

module.exports = () => {
    return gulp.src('meta.js')
        .pipe(insert.transform(replaceMeta(options["META_CONFIG"])))
        .pipe(rename(options["META_FILE_NAME"]))
        .pipe(gulp.dest(options["OUTPUT_PATH"]))
        .pipe(tap((file) => {
            return gulp.src(options["USERSCRIPT_FILE_PATH"])
                .pipe(insert.transform((contents) => {
                    console.log(typeof file.contents);
                    return file.contents.toString().trim() + '\r\n' + contents.trim() + '\r\n';
                }))
                .pipe(gulp.dest(options["OUTPUT_PATH"]));
        }));
};
