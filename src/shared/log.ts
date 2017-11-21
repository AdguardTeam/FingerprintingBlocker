/// <reference path="../../node_modules/closure-library.ts/closure-library.d.ts/all.d.ts"/>

/**
 * This is a HACK for tsickle and closure compiler:
 *   1. Closure compiler does not support @define flags in ES6 module yet
 *      See {@link https://github.com/google/closure-compiler/issues/1601}
 *         - Using `goog.module.declareLegacyNamespace` as described in 
 *           {@link https://github.com/angular/tsickle/issues/434}
 *   2. Typescript does not sees `goog` namespace, and if declared, tsickle will include it
 *      in externs, which will colide with declarations that closure compiler already have
 *         - Use a triple-slash directive to reference typings defined in `node_modules`
 *           directory, because tsickle won't generate externs from types included in `node_modules`
 *
 * Once closure compiler supports es6-module-scoped @define variables or tsickle supports converting
 * such variables into closure compiler acceptible form, we will be able to drop this workaround.
 */
goog.module.declareLegacyNamespace();
/** @define {boolean} */
export const PRINT_LOGS = true;

/**
 * @fileoverview Logging functions to be used in dev channel. Function bodies are enclosed with preprocess
 * directives in order to ensure that these are stripped out by minifier in beta and release channels.
 */

const getTime = Date.now;

let prefix = '';
let win = unsafeWindow;
while (win.parent !== win) {
    win = win.parent;
    prefix += '-- ';
}
let loc = location.href;
let suffix = `    (at ${loc})`;
let depth = 0;


export function call(msg:string) {
    if (PRINT_LOGS) {
        depth++;
        console.group(prefix + msg + suffix);
    }
}

export function callEnd() {
    if (PRINT_LOGS) {
        depth--;
        console.groupEnd();
    }
}

export function closeAllGroup() {
    if (PRINT_LOGS) {
        while (depth > 0) {
            console.groupEnd();
            depth--;
        }
    }
}

export function print(str:string, obj?):void {
    if (PRINT_LOGS) {
        let date = getTime().toFixed(3);
        let indent = 10 - date.length;
        if (indent < 0) { indent =0; }
        let indentstr = '';
        while (indent-- > 0) { indentstr += ' '; }
        console.log(prefix + `[${indentstr}${date}]: ${str}${suffix}`);
        if (obj !== undefined) {
            console.log(prefix + '=============================');
            console.log(obj);
            console.log(prefix + '=============================');
        }
    }
}

/**
* Accepts a function, and returns a wrapped function that calls `call` and `callEnd`
* automatically before and after invoking the function, respectively.
* @param fn A function to wrap
* @param message 
* @param cond optional argument, the function argument will be passed to `cond` function, and
* its return value will determine whether to call `call` and `callEnd`.
*/
export function connect<T extends (...args)=>any>(fn:T, message:string, cond?:(this:null)=>boolean):T {
    if (PRINT_LOGS) {
        return <T>function () {
            let shouldLog = cond ? cond.apply(null, arguments) : true;
            if (shouldLog) { call(message); }
            let ret = fn.apply(this, arguments);
            if (shouldLog) { callEnd(); }
            return ret;
        };
    } else {
        return fn;
    }
}

export function throwMessage(thrown:any) {
    if (PRINT_LOGS) {
        throw thrown;
    }
}

export function debuggerPause() {
    if (PRINT_LOGS) {
        debugger;
    }
}
