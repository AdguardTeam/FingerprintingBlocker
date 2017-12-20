import IAudioProcessor from "./IAudioProcessor";
import IBufferManager from "../../arraybuffer/IBufferManager";
import IStorage from "../../../storage/IStorage";
import BufferManager from "../../arraybuffer/BufferManager";
import * as log from '../../../shared/log';

export default class AudioProcessor implements IAudioProcessor {
    private static DATA_OFFSET = 0;

    private bufferManager:IBufferManager
    private audioNoiseApplyer:IAudioNoiseApplier

    constructor(private storage:IStorage, private $window:Window) {
        this.bufferManager = BufferManager.getInstance();
    }

    private initializeNoiser(size:number) {
        if (!this.audioNoiseApplyer || size > this.bufferManager.buffer.byteLength) {
            let init_start = performance.now();
            this.audioNoiseApplyer = this.bufferManager.getModule(size, this.$window, audioNoiseApplier);
            let init_end = performance.now();
            log.print(`initializing audio noiser took ${init_end - init_start} ms.`);
        }
    }

    private methodFactory<T extends Uint8Array | Float32Array>(exportedFnName:string ,byte:boolean) {
        return (writeBuffCb:(buffView:T)=>void, size:number, ...args:number[]):T => {
            let byteLength = size;
            if (!byte) { byteLength <<= 2; }

            this.initializeNoiser(byteLength);
            const buff = this.bufferManager.buffer;
            let buffView = (<T>(byte ? new Uint8Array(buff, 0, size) : new Float32Array(buff, 0, size)));
            writeBuffCb(buffView);

            let h = this.storage.getSalt();
            let start = performance.now();

            // Avoid using spread operator, prevent closure compiler emitting useless symbol polyfill.
            // this.audioNoiseApplyer[exportedFnName]
            //   (AudioProcessor.DATA_OFFSET, size, ...(<number[]>args), h[0], h[1], h[2], h[3]);
            const moduleArg = [AudioProcessor.DATA_OFFSET, size];
            Array.prototype.push.apply(moduleArg, args);
            moduleArg.push(h[0], h[1], h[2], h[3]);
            this.audioNoiseApplyer[exportedFnName].apply(null, moduleArg);
            
            let end = performance.now();
            log.print(`Calling asm.js function took ${end - start}ms.`);
            return buffView;
        }
    }

    public addNoiseToFloatFrequencyData = this.methodFactory<Float32Array>('_noise_to_frequency', false);
    public addNoiseToFloatTimeDomainData = this.methodFactory<Float32Array>('_noise_to_byte_frequency', false);

    public addNoiseToByteFrequencyData = this.methodFactory<Uint8Array>('_noise_to_byte_frequency', true);
    public addNoiseToByteTimeDomainData = this.methodFactory<Uint8Array>('_noise_to_byte_time_domain', true);
}
