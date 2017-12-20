import AbstractAnonymizer from "../../AbstractAnonymizer";
import TypeGuards from "../../../shared/TypeGuards";
import IAudioProcessor from "../processor/IAudioProcessor";
import IStorage from "../../../storage/IStorage";
import INotifier from "../../../notifier/INotifier";
import { original } from "../../common_apply_handlers";
import { Notify } from "../../common_api_exec_results";

export default class ByteFrequencyAnonymizer extends AbstractAnonymizer<AnalyserNode,void> {
    onFake(orig, __this, _arguments) {
        let targetBuff = _arguments[0];
        if (TypeGuards.isUint8Array(targetBuff)) {
            const anonymized = this.processor.addNoiseToByteFrequencyData((buffView) => {
                orig.call(__this, buffView);
            }, __this.frequencyBinCount, __this.minDecibels, __this.maxDecibels);
            targetBuff.set(anonymized.subarray(0, targetBuff.length));
        } else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    }
    onBlock(orig, __this, _arguments) {
        let targetBuff = _arguments[0];
        if (TypeGuards.isUint8Array(targetBuff)) {
            /** @todo */
        } else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    }
    getData() { }

    constructor(
        storage:IStorage,
        notifier:INotifier,
        private processor:IAudioProcessor
    ) {
        super(storage, notifier);
    }
}
