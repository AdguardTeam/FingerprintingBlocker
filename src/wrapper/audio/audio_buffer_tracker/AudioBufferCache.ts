import IProxyService from "../../../proxy/IProxyService";
import IAudioBufferCache from "./IAudioBufferCache";
import { original } from "../../common_apply_handlers";
import TypeGuards from "../../../shared/TypeGuards";
import { NonBuggyWeakMap as WeakMap } from '../../../shared/WeakMap';

export default class AudioBufferCache implements IAudioBufferCache {
    private 
    constructor(
        private proxyService:IProxyService
    ) {
        this.trackOutputAudioBuffer = this.trackOutputAudioBuffer.bind(this);
    }

    private channelDataCache:IWeakMap<AudioBuffer,Float32Array[]> = new WeakMap();

    private trackOutputAudioBuffer(orig, __this, _arguments):AudioBuffer {
        let buffer:AudioBuffer = original(orig, __this, _arguments);
        if (TypeGuards.isAudioBuffer(buffer)) {
            if (!this.channelDataCache.has(buffer)) {
                this.channelDataCache.set(buffer, undefined);
            }
        }
        return buffer;
    }

    shouldBeProcessed(buffer:AudioBuffer):boolean {
        return this.channelDataCache.has(buffer);
    } 
    getProcessedChannelData(buffer:AudioBuffer, channel:number):Float32Array {
        const cached = this.channelDataCache.get(buffer);
        if (TypeGuards.isUndef(cached)) { return undefined; }
        return cached[channel];
    }
    setProcessedChannelData(buffer:AudioBuffer, channel:number, data:Float32Array):void {
        let cached = this.channelDataCache.get(buffer);
        if (TypeGuards.isUndef(cached)) {
            cached = [];
            this.channelDataCache.set(buffer, cached);
        }
        cached[channel] = data;
    }
    $apply(window:Window):void {
        this.proxyService.wrapAccessor(window.AudioProcessingEvent.prototype, 'inputBuffer', this.trackOutputAudioBuffer);
        this.proxyService.wrapAccessor(window.OfflineAudioCompletionEvent.prototype, 'renderedBuffer', this.trackOutputAudioBuffer);
    }
}
