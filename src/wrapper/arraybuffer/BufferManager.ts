import IBufferManager from "./IBufferManager";

// https://gist.github.com/wellcaffeinated/5399067#gistcomment-1364265
const SIZE_64_KB = 65536;     // This equals to the size of 128 * 128 canvas.
const SIZE_64_MB = 67108864;

/**
 * Returns `Math.ceil(log_2(num))` for positive integer `num`.
 */
function ln2(num:number):number {
    let i = 0;
    for (num--; num !== 0; i++) { num = num >> 1; }
    return i;
}

function nextValidHeapSize(realSize:number) {
    if (!realSize || realSize <= SIZE_64_KB) {
        return SIZE_64_KB;
    } else if (realSize <= SIZE_64_MB) {
        return 1 << ln2(realSize);
    } else {
          return SIZE_64_MB * Math.ceil(realSize/SIZE_64_MB);
    }
}

/**
 * Polyfill of Math.imul for IE.
 */
function imul(a:number, b:number):number {
    var ah = (a >>> 16) & 0xffff;
    var al = a & 0xffff;
    var bh = (b >>> 16) & 0xffff;
    var bl = b & 0xffff;
    // the shift by 0 fixes the sign on the high part
    // the final |0 converts the unsigned value into a signed value
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
};

export default class BufferManager implements IBufferManager {
    public buffer:ArrayBuffer
    getModule<T>(size:number, stdlib:Window, asmModule:(stdlib:Window, ffi:any, heap:ArrayBuffer)=>T):T {
        if (!this.buffer || size > this.buffer.byteLength) {
            let bufferSize = nextValidHeapSize(size);
            this.buffer = new ArrayBuffer(bufferSize);
        }
        if (!stdlib.Math.imul) {
            stdlib.Math.imul = imul;
        }
        return asmModule(stdlib, null, this.buffer);
    }

    private static instance:IBufferManager
    public static getInstance() {
        if (!this.instance) {
            this.instance = new BufferManager();
        }
        return this.instance;
    }
    
    private constructor() { }
}
