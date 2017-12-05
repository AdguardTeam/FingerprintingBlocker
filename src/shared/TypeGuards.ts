export default class TypeGuards {
    private static toString = Object.prototype.toString
    static isUndef = (obj:any):obj is undefined => {
        return typeof obj === 'undefined';
    }
    static isUint8Array = (obj:object):obj is Uint8Array => {
        return TypeGuards.toString.call(obj) === '[object Uint8Array]';
    }
    static isHTMLElement = (el:EventTarget):el is HTMLElement => {
        return 'offsetLeft' in el;
    }
}
