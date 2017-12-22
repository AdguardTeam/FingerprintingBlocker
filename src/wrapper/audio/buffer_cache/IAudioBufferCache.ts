/**
 * @fileoverview Not all readout from AudioBuffer instances should be faked.
 * Instead, we process AudioBuffer instances which is obtained via certain apis,
 * which has access to a result of certain operation of WebAudio API.
 * Specifically, we process AudioBuffer which was obtained via `AudioProcessingEvent`
 * which is available in ScriptProcessorNode, or was obtained via 
 * `OfflineAudioCompletionEvent` which is available via `oncomplete` listener of
 * OfflineAudioContext.
 */
export default interface IAudioBufferCache {
    shouldBeProcessed(buffer:AudioBuffer):boolean
    getProcessedChannelData(buffer:AudioBuffer, channel:number):Float32Array
    setProcessedChannelData(buffer:AudioBuffer, channel:number, data:Float32Array):void
    $apply(window:Window):void
}
