export default class TypeGuards {
    private static toString = Object.prototype.toString
    static isUndef = (obj:any):obj is undefined => {
        return typeof obj === 'undefined';
    }
    static isUint8Array = (obj:object):obj is Uint8Array => {
        return TypeGuards.toString.call(obj) === '[object Uint8Array]';
    }
    static isFloat32Array = (obj:object):obj is Float32Array => {
        return TypeGuards.toString.call(obj) === '[object Float32Array]';
    }
    static isAudioBuffer = (obj:object):obj is AudioBuffer => {
        return TypeGuards.toString.call(obj) === '[object AudioBuffer]';
    }
    static isHTMLElement = (el:EventTarget):el is HTMLElement => {
        return 'offsetLeft' in el;
    }
}
