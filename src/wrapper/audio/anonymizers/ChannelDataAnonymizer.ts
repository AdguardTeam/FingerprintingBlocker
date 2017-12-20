import AbstractAnonymizer from "../../AbstractAnonymizer";
import { original } from "../../common_apply_handlers";
import IAudioBufferCache from "../audio_buffer_tracker/IAudioBufferCache";
import IStorage from "../../../storage/IStorage";
import INotifier from "../../../notifier/INotifier";
import IAudioProcessor from "../processor/IAudioProcessor";
import TypeGuards from "../../../shared/TypeGuards";
import { Notify } from "../../common_api_exec_results";

/**
 * It is possible that
 */
export default class ChannelDataAnonymizer extends AbstractAnonymizer<AudioBuffer,Float32Array> {
    onAllow(orig, __this, _arguments) {
        let ret:Float32Array = original(orig, __this, _arguments);
        let shouldNotify = false;
        label: {
            const channel = _arguments[0];
            if (typeof channel !== 'number') {
                break label;
            }
            if (!this.channelDataCache.shouldBeProcessed(__this)) {
                break label;
            }
            let cached = this.channelDataCache.getProcessedChannelData(__this, channel);
            if (!TypeGuards.isUndef(cached)) {
                // Do not show notification if we have already shown a notification
                // for a given audiobuffer and a channel.
                break label;
            }

            const dummy = new Float32Array(0);
            this.channelDataCache.setProcessedChannelData(__this, channel, dummy);
            shouldNotify = true;
            break label;
        }
        return new Notify(ret, shouldNotify);
    }
    onFake(orig, __this, _arguments) {
        let ret:Float32Array = original(orig, __this, _arguments);
        label: {
            const channel = _arguments[0];
            if (typeof channel !== 'number') {
                break label;
            }
            if (!this.channelDataCache.shouldBeProcessed(__this)) {
                break label;
            }

            let cached = this.channelDataCache.getProcessedChannelData(__this, channel);
            if (!TypeGuards.isUndef(cached)) {
                ret = cached;
                break label; // Do not show notification when we are using a cached response.
            }

            const anonymized = this.processor.addNoiseToFloatTimeDomainData((buffView) => {
                buffView.set(ret);
            }, ret.byteLength >> 2);

            this.channelDataCache.setProcessedChannelData(__this, channel, anonymized);
            ret = anonymized;
            return new Notify(ret); // Show notification
        }
        return new Notify(ret, false);
    }
    onBlock(orig, __this:AudioBuffer, _arguments) {
        let ret:Float32Array;
        label: {
            const channel = _arguments[0];
            if (typeof channel !== 'number') {
                break label;
            }
            if (!this.channelDataCache.shouldBeProcessed(__this)) {
                break label;
            }
            let cached = this.channelDataCache.getProcessedChannelData(__this, channel);
            if (!TypeGuards.isUndef(cached)) {
                return new Notify(cached, false);
            }

            const emptyBuffer = new Float32Array(__this.length);
            this.channelDataCache.setProcessedChannelData(__this, channel, emptyBuffer);
            ret = emptyBuffer;
            return new Notify(ret);
        }
        return new Notify(original<AudioBuffer,Float32Array>(orig, __this, _arguments), false);
    }
    getData() { }

    constructor(
        storage:IStorage,
        notifier:INotifier,
        private processor:IAudioProcessor,
        private channelDataCache:IAudioBufferCache
    ) {
        super(storage, notifier);
    }
}
