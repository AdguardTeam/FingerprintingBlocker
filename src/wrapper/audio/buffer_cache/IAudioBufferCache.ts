/**
 * Not all readout from AudioBuffer instances should be faked.
 * Instead, we process AudioBuffer instances which is obtained via certain apis,
 * which has access to a result of certain operation of WebAudio API.
 * Only such AudioBuffers can provide meaningful fingerprint data; also
 * it covers all the use cases in PoC websites.
 */
export default interface IAudioBufferCache {
    shouldBeProcessed(buffer:AudioBuffer):boolean
    getProcessedChannelData(buffer:AudioBuffer, channel:number):Float32Array
    setProcessedChannelData(buffer:AudioBuffer, channel:number, data:Float32Array):void
    $apply(window:Window):void
}
