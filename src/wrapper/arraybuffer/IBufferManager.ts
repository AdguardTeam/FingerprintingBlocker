export default interface IBufferManager {
    readonly buffer:ArrayBuffer
    getModule<T>(size:number, stdlib:Window, asmModule:(stdlib:Window, ffi:any, heap:ArrayBuffer)=>T):T
}
