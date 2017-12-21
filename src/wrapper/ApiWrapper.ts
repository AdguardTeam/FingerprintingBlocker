import IApiWrapper from "./IApiWrapper";
import IAnonymizer from "./IAnonymizer";
import { Apis, EventType, CanvasBlockEventType, CanvasBlockEvent, AudioBlockEventType } from "../notifier/BlockEvent";
import IProxyService from "../proxy/IProxyService";
import INotifier from "../notifier/INotifier";
import IStorage from "../storage/IStorage";
import CanvasElementMethodsAnonymizer from "./canvas/anonymizers/CanvasElementMethodsAnonymizer";
import ICanvasProcessor from "./canvas/processor/ICanvasProcessor";
import ICanvasModeTracker from "./canvas/mode_tracker/ICanvasModeTracker";
import ImgDataAccessAnonymizer from "./canvas/anonymizers/ImgDataAccessAnonymizer";
import ReadPixelAnonymizer from "./canvas/anonymizers/ReadPixelAnonymizer";
import IAudioBufferCache from "./audio/buffer_cache/IAudioBufferCache";
import ChannelDataAnonymizer from "./audio/anonymizers/ChannelDataAnonymizer";
import IAudioProcessor from "./audio/processor/IAudioProcessor";
import ByteFrequencyAnonymizer from "./audio/anonymizers/ByteFrequencyAnonimizer";
import ByteTimeDomainAnonymizer from "./audio/anonymizers/ByteTimeDomainAnonymizer";
import FloatFrequencyAnonymizer from "./audio/anonymizers/FloatFrequencyAnonymizer";
import FloatTimeDomainAnonymizer from "./audio/anonymizers/FloatTimeDomainAnonymizer";

export default class ApiWrapper implements IApiWrapper {
    constructor(
        private proxyService:IProxyService,
        private storage:IStorage,
        private notifier:INotifier,
        private canvasProcessor:ICanvasProcessor,
        private canvasModeTracker:ICanvasModeTracker,
        private audioProcessor:IAudioProcessor,
        private audioBufferCache:IAudioBufferCache
    ) { }

    anonymize<T,R>(anonymizer:IAnonymizer<T,R>, owner:T, prop:PropertyKey, api:Apis, type:EventType, domain:string):void {
        this.proxyService.wrapMethod(owner, prop, anonymizer.getCombinedHandler(api, type, domain));
    }

    wrapCanvasApis(window:Window) {
        const domain = window.location.hostname;

        const canvasElementMethodsAnonymizer = new CanvasElementMethodsAnonymizer(this.storage, this.notifier, this.canvasProcessor, this.canvasModeTracker);
        const canvasPType = window.HTMLCanvasElement.prototype;
        this.anonymize(canvasElementMethodsAnonymizer, canvasPType, 'toDataURL', Apis.canvas, CanvasBlockEventType.TO_DATA_URL, domain);
        this.anonymize(canvasElementMethodsAnonymizer, canvasPType, 'toBlob', Apis.canvas, CanvasBlockEventType.TO_BLOB, domain);
        this.anonymize(canvasElementMethodsAnonymizer, canvasPType, 'mozGetAsFile', Apis.canvas, CanvasBlockEventType.MOZ_GET_AS_FILE, domain);

        const imgDataAccessAnonymizer = new ImgDataAccessAnonymizer(this.storage, this.notifier, this.canvasProcessor);
        this.anonymize(imgDataAccessAnonymizer, window.CanvasRenderingContext2D.prototype, 'getImageData', Apis.canvas, CanvasBlockEventType.GET_IMAGE_DATA, domain);

        const readPixelAnonymizer = new ReadPixelAnonymizer(this.storage, this.notifier, this.canvasProcessor);
        const webgl = window.WebGLRenderingContext;
        const webgl2 = window.WebGL2RenderingContext;
        if (webgl) {
            this.anonymize(readPixelAnonymizer, webgl.prototype, 'readPixels', Apis.canvas, CanvasBlockEventType.READ_PIXELS, domain);
        }
        if (webgl2) {
            this.anonymize(readPixelAnonymizer, webgl2.prototype, 'readPixels', Apis.canvas, CanvasBlockEventType.READ_PIXELS_2, domain);
        }
    }

    wrapAudioApis(window:Window) {
        if (!window.AudioContext) { return; }
        const domain = window.location.hostname;

        const channelDataAnonymizer = new ChannelDataAnonymizer(this.storage, this.notifier, this.audioProcessor, this.audioBufferCache);

        this.anonymize(channelDataAnonymizer, window.AudioBuffer.prototype, 'getChannelData', Apis.audio, AudioBlockEventType.GET_CHANNEL_DATA, domain);

        const analyserNodePType = window.AnalyserNode.prototype;

        const byteFrequencyAnonymizer =  new ByteFrequencyAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(byteFrequencyAnonymizer, analyserNodePType, 'getByteFrequencyData', Apis.audio, AudioBlockEventType.GET_BYTE_FREQUENCY_DATA, domain);

        const byteTimeDomainAnonymizer = new ByteTimeDomainAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(byteTimeDomainAnonymizer, analyserNodePType, 'getByteTimeDomainData', Apis.audio, AudioBlockEventType.GET_BYTE_TIME_DOMAIN_DATA, domain);

        const floatFrequencyAnonymizer = new FloatFrequencyAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(floatFrequencyAnonymizer, analyserNodePType, 'getFloatFrequencyData', Apis.audio, AudioBlockEventType.GET_FLOAT_FREQUENCY_DATA, domain);

        const floatTimeDomainAnonymizer = new FloatTimeDomainAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(floatTimeDomainAnonymizer, analyserNodePType, 'getFloatTimeDomainData', Apis.audio, AudioBlockEventType.GET_FLOAT_TIME_DOMAIN_DATA, domain);
    }

    $apply(window:Window) {
        this.canvasModeTracker.$apply(window);
        this.wrapCanvasApis(window);

        this.audioBufferCache.$apply(window);
        this.wrapAudioApis(window);
    }
}
