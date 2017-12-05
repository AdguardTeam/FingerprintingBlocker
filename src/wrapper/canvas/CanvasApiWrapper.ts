import ICanvasApiWrapper from './ICanvasApiWrapper';
import IProxyService, { ApplyHandler } from '../../proxy/IProxyService';
import IStorage from '../../storage/IStorage';
import ICanvasProcessor from './ICanvasProcessor';
import INotifier from '../../notifier/INotifier';

import BlockEvent, { Apis, Action, CanvasBlockEvent, CanvasBlockEventType } from '../../event/BlockEvent';

import TypeGuards from '../../shared/TypeGuards';
import * as log from '../../shared/log';

import { crop } from './CanvasProcessor';
import WeakMap from '../../third-party/weakmap';

export default class CanvasApiWrapper implements ICanvasApiWrapper {

    private static MIN_CANVAS_SIZE_TO_FAKE = 128;

    private canvasContextMap:IWeakMap<HTMLCanvasElement, TCanvasMode>

    /**
     * Each canvas is assigned to an internal "mode", which is initially set to 'none', 
     * and can be changed via calling `getContext` method.
     * Canvas is allowed to have only one mode. For example, once '2d' context is requested
     * by `getContext('2d')` call, subsequent calls with `getContext('webgl')` will return `null`.
     * This information is not available during calls for `toDataURL` and other methods,
     * so we track the attached context type by wrapping `HTMLCanvasElement#getContext` method.
     * For the precise logic for `getContext`, we refer to 
     * {@link https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-context-mode}
     */
    private trackCanvasContextStatus:ApplyHandler<HTMLCanvasElement,any> = (orig, __this, _arguments) => {
        const context = orig.apply(__this, _arguments);
        if (context !== null) {
            this.canvasContextMap.set(__this, _arguments[0]);
        }
        return context;
    }

    private anonymizeCanvasElementMethods:ApplyHandler<HTMLCanvasElement,any> = (orig, __this, _arguments) => {
        const contextType = this.canvasContextMap.get(__this);
        if (contextType) {
            const {$data, $result} = this.canvasProcessor.clone2DCanvasWithNoise(__this, contextType);
            if ($result) {
                // this.notifier.onBlocked('Faked HTMLCanvasElement method');
            }
            __this = $data;
        }
        return orig.apply(__this, _arguments);
    };

    private anonymizeImageDataAccess:ApplyHandler<CanvasRenderingContext2D,ImageData> = (orig, __this:CanvasRenderingContext2D, _arguments):ImageData => {
        const sx:number = _arguments[0];
        const sy:number = _arguments[1];
        const sw:number = _arguments[2];
        const sh:number = _arguments[3];
        const origWidth:number = __this.canvas.width;
        const origHeight:number = __this.canvas.height;
        // Noiser requires +-1 more pixels for each of 4 directions to deterministically apply noises.
        let tempImageData:ImageData = orig.apply(__this, [sx - 1, sy - 1, sw + 2, sh + 2]);
        const {$data, $result} = this.canvasProcessor.addNoiseToBitmap((buffView) => { buffView.set(tempImageData.data); }, sx - 1, sy - 1, sw + 2, sh + 2, origWidth, origHeight);

        let imageData = new ImageData(sw, sh);

        // Convert dimension of the obtained imageData.
        crop($data, 1, 1, sw, sh, sw + 2, sh + 2, imageData.data);
        return imageData;
    }

    private anonymizeWebGLReadPixels:ApplyHandler<WebGLRenderingContext|WebGL2RenderingContext, void> = (orig, __this, _arguments) => {
        const sx:number = _arguments[0];
        const sy:number = _arguments[1];
        const sw:number = _arguments[2];
        const sh:number = _arguments[3];
        const format = _arguments[4];
        const type:number = _arguments[5];
        const pixels:ArrayBufferView = _arguments[6];

        const origWidth:number = __this.canvas.width;
        const origHeight:number = __this.canvas.height;

        switch(type) {
            case __this.UNSIGNED_BYTE: {
                if (TypeGuards.isUint8Array(pixels)) {
                    const writeToProcessorBuff = (buffView) => {
                        orig.call(__this, sx - 1, sy - 1, sw + 2, sh + 2, format, type, buffView);
                    }
                    const {$data, $result} = this.canvasProcessor.addNoiseToBitmap(writeToProcessorBuff, sx - 1, sy - 1, sw + 2, sh + 2, origWidth, origHeight);

                    crop($data, 1, 1, sw, sh, sw + 2, sh + 2, pixels);
                    return;
                }
            }
            case __this.UNSIGNED_SHORT_5_6_5:
            case __this.UNSIGNED_SHORT_5_5_5_1:
            case __this.UNSIGNED_SHORT_4_4_4_4:
                log.print('called WebGL(2)RenderingContext#readPixels with a type whose faking is not supported.');
            default:
                return orig.apply(__this, _arguments);
        }      
    }

    /**
     * Combines general apply handlers, so that in a resulting apply handler, we notify
     * users and apply appropriate blocking method depending on user settings.
     * @param type 
     * @param fake to be used when a setting is set to fake canvas output
     * @param block to be used when a setting is et to block output
     * @param getData to be used to retrieve original HTMLCanvasElement, which will be
     *   used to display original canvas image to user.
     */
    applyHandlerFactory<T,R> (
        type:CanvasBlockEventType,
        fake:ApplyHandler<T,R>,
        block:ApplyHandler<T,R>,
        getData:(arg:T)=>HTMLCanvasElement,
        domain:string
    ):ApplyHandler<T,R> {
        return (orig, __this:T, _arguments) => {
            let stack = (new Error).stack;
            let action = this.storage.getAction();
            let canvas = getData(__this);

            breakThisToApplyOrig: {
                if (canvas.width * canvas.height < CanvasApiWrapper.MIN_CANVAS_SIZE_TO_FAKE) {
                    break breakThisToApplyOrig;
                }

                if (this.storage.getConfirm()) {
                    // This is the message that FF shows.
                    // https://www.ghacks.net/2017/10/28/firefox-58-warns-you-if-sites-use-canvas-image-data/
                    let msg = `Will you allow ${domain} to use your HTML5 canvas image data? This may be used to uniquely identify your computer.`;
                    // Use a ui-blocking window.confirm
                    if(window.confirm(msg)) {
                        break breakThisToApplyOrig;
                    }
                }

                if (action === Action.ALLOW) {
                    let blockEvent = new CanvasBlockEvent(type, Action.ALLOW, stack, canvas);
                    this.notifier.onBlock(blockEvent);
                    break breakThisToApplyOrig;
                }

                const ret = action === Action.FAKE ? fake(orig, __this, _arguments) : block(orig, __this, _arguments);
                let blockEvent = new CanvasBlockEvent(type, action, stack, canvas);
                this.notifier.onBlock(blockEvent);
                return ret;
            }

            return <R>orig.apply(__this, _arguments);
        }
    }

    private static returnNull:ApplyHandler<any,null> = (orig, __this, _arguments) => null;
    private static identity = (x:HTMLCanvasElement):HTMLCanvasElement => x;
    private static canvasFromContext = (ctxt:CanvasRenderingContext2D|WebGLRenderingContext|WebGL2RenderingContext):HTMLCanvasElement => ctxt.canvas;

    $apply(window:Window) {
        if (this.storage.getWhitelisted()) { return; }

        const domain = this.storage.domain;
        const canvasPType = window.HTMLCanvasElement.prototype;
        this.proxyService.wrapMethod(canvasPType, 'getContext', this.trackCanvasContextStatus);
        this.proxyService.wrapMethod(
            canvasPType,
            'toDataURL',
            this.applyHandlerFactory<HTMLCanvasElement,string>(
                CanvasBlockEventType.TO_DATA_URL,
                this.anonymizeCanvasElementMethods,
                CanvasApiWrapper.returnNull,
                CanvasApiWrapper.identity,
                domain
            )
        );
        this.proxyService.wrapMethod(
            canvasPType,
            'toBlob',
            this.applyHandlerFactory<HTMLCanvasElement,Blob>(
                CanvasBlockEventType.TO_BLOB,
                this.anonymizeCanvasElementMethods,
                CanvasApiWrapper.returnNull,
                CanvasApiWrapper.identity,
                domain
            )
        );
        this.proxyService.wrapMethod(
            canvasPType,
            'mozGetAsFile',
            this.applyHandlerFactory<HTMLCanvasElement,File>(
                CanvasBlockEventType.MOZ_GET_AS_FILE,
                this.anonymizeCanvasElementMethods,
                CanvasApiWrapper.returnNull,
                CanvasApiWrapper.identity,
                domain
            )
        );

        const twoDPType = window.CanvasRenderingContext2D.prototype;
        this.proxyService.wrapMethod(
            twoDPType,
            'getImageData',
            this.applyHandlerFactory<CanvasRenderingContext2D,ImageData>(
                CanvasBlockEventType.GET_IMAGE_DATA,
                this.anonymizeImageDataAccess,
                CanvasApiWrapper.returnNull,
                CanvasApiWrapper.canvasFromContext,
                domain
            )
        );

        const webgl = window.WebGLRenderingContext;
        if (webgl) {
            this.proxyService.wrapMethod(
                webgl.prototype,
                'readPixels',
                this.applyHandlerFactory<WebGLRenderingContext,void>(
                    CanvasBlockEventType.READ_PIXELS,
                    this.anonymizeWebGLReadPixels,
                    CanvasApiWrapper.returnNull,
                    CanvasApiWrapper.canvasFromContext,
                    domain
                )
            );
        }

        const webgl2 = window.WebGL2RenderingContext;
        if (webgl2) {
            this.proxyService.wrapMethod(
                webgl2.prototype,
                'readPixels',
                this.applyHandlerFactory<WebGL2RenderingContext,void>(
                    CanvasBlockEventType.READ_PIXELS_2,
                    this.anonymizeWebGLReadPixels,
                    CanvasApiWrapper.returnNull,
                    CanvasApiWrapper.canvasFromContext,
                    domain
                )
            )
        }

        // Unlike usual canvas, offscreen canvas can be used in worker
        const offscreenCanvas = window.OffscreenCanvas;
    }

    constructor(
        private proxyService:IProxyService,
        private storage:IStorage,
        private canvasProcessor:ICanvasProcessor,
        private notifier:INotifier
    ) {
        this.canvasContextMap = new WeakMap();
    }
}
