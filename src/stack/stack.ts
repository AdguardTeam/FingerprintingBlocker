/**
 * @todo Use stack 'boundary' function
 */

export default function getStack():string {
    if ('captureStackTrace' in Error) {
        // https://github.com/v8/v8/wiki/Stack-Trace-API
        const prevLimit = Error['stackTraceLimit'];
        Error['stackTraceLimit'] = Infinity;
        const dummyErrorObj = Object.create(null);
       
        Error['captureStackTrace'](dummyErrorObj, getStack);
        Error['stackTraceLimit'] = prevLimit;
        return dummyErrorObj.stack;
    }

    const error = new Error();
    try {
        throw error;
    } catch(e) {
        return e.stack;
    }
}
