export default interface IAudioProcessor {
    addNoiseToFloatFrequencyData(writeBuffCb:(buffView:Float32Array)=>void, size:number):Float32Array
    addNoiseToByteFrequencyData(writeBuffCb:(buffView:Uint8Array)=>void, size:number, min:number, max:number):Uint8Array

    addNoiseToFloatTimeDomainData(writeBuffCb:(buffView:Float32Array)=>void, size:number):Float32Array
    addNoiseToByteTimeDomainData(writeBuffCb:(buffView:Uint8Array)=>void, size:number):Uint8Array
}
