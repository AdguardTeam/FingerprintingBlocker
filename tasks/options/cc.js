const base = {
    compilation_level: 'ADVANCED',
    language_in: 'ECMASCRIPT6',
    language_out: 'ECMASCRIPT5',
    assume_function_wrapper: true,
    warning_level: 'VERBOSE',
    strict_mode_input: false,
    rewrite_polyfills: false
};

module.exports = {
    dev: Object.assign({}, base, {
        compilation_level: 'WHITESPACE_ONLY',
        assume_function_wrapper: false,
        warning_level: 'QUIET'
    }),
    tscc: {
        flagfile: "tasks/tscc/closure.conf"
    }
};
