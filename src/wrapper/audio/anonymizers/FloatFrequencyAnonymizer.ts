import AbstractAnonymizer from "../../AbstractAnonymizer";
import TypeGuards from "../../../shared/TypeGuards";
import IAudioProcessor from "../processor/IAudioProcessor";
import IStorage from "../../../storage/IStorage";
import INotifier from "../../../notifier/INotifier";
import { original } from "../../common_apply_handlers";
import { Notify } from "../../common_api_exec_results";

export default class FloatFrequencyAnonymizer extends AbstractAnonymizer<AnalyserNode,void> {
    onFake(orig, __this, _arguments) {
        let targetBuff = _arguments[0];
        if (TypeGuards.isFloat32Array(targetBuff)) {
            const anonymized = this.processor.addNoiseToFloatFrequencyData((buffView) => {
                orig.call(__this, buffView);
            }, __this.frequencyBinCount);
            targetBuff.set(anonymized.subarray(0, targetBuff.length));
        } else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    }
    onBlock(orig, __this, _arguments) {
        let targetBuff = _arguments[0];
        if (TypeGuards.isFloat32Array(targetBuff)) {
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
