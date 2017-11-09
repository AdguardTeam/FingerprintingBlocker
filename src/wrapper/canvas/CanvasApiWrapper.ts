import ICanvasApiWrapper from './ICanvasApiWrapper';
import IProxyService, { ApplyHandler } from '../../proxy/IProxyService';
import IStorageProvider from '../../storage/IStorageProvider';
import ICanvasProcessor from './ICanvasProcessor';
import INotifier from '../../notifier/INotifier';

import BlockEvent, { Apis, Action, CanvasBlockEvent, CanvasBlockEventType } from '../../event/BlockEvent';

import { crop } from './CanvasProcessor';
import WeakMap from '../../third-party/weakmap';

export default class CanvasApiWrapper implements ICanvasApiWrapper {

    /**
     * Canvases 
     */
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
            const {data, result} = this.canvasProcessor.clone2DCanvasWithNoise(__this, contextType);
            if (result) {

                // this.notifier.onBlocked('Faked HTMLCanvasElement method');
            }
            __this = data;
        }
        return orig.apply(__this, _arguments);
    };

    private anonymizeImageDataAccess:ApplyHandler<CanvasRenderingContext2D,ImageData> = (orig, __this:CanvasRenderingContext2D, _arguments):ImageData => {
        const sx = _arguments[0];
        const sy = _arguments[1];
        const sw = _arguments[2];
        const sh = _arguments[3];
        const origWidth = __this.canvas.width;
        const origHeight = __this.canvas.height;
        // Noiser requires +-1 more pixels for each of 4 directions to deterministically apply noises.
        let tempImageData:ImageData = orig.apply(__this, [sx - 1, sy - 1, sw + 2, sh + 2]);
        const {data, result} = this.canvasProcessor.addNoiseToBitmap(tempImageData.data, sx - 1, sy - 1, sw + 2, sh + 2, origWidth, origHeight);

        let imageData = new ImageData(sw, sh);

        // Convert dimension of obtained imageData.
        crop(tempImageData.data, 1, 1, sw, sh, sw + 1, sh + 1, data);
        return imageData;
    }

    private anonymizeWebGLRenderingContextMethods:ApplyHandler<WebGLRenderingContext|WebGL2RenderingContext, void> = (orig, __this, _arguments) => {
        console.log('called WebGL(2)RenderingContext#readPixels, intercepting it is not implementd yet.');
        orig.apply(__this, _arguments);
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
            let action = this.storage.action;
            let canvas = getData(__this);

            breakThisToApplyOrig: {
                if (canvas.width * canvas.height < CanvasApiWrapper.MIN_CANVAS_SIZE_TO_FAKE) {
                    break breakThisToApplyOrig;
                }

                if (this.storage.confirm) {
                    // This is the message that FF shows.
                    // https://www.ghacks.net/2017/10/28/firefox-58-warns-you-if-sites-use-canvas-image-data/
                    let msg = `Will you allow ${domain} to use your HTML5 canvas image data? This may be used to uniquely identify your computer.`;
                    // Use a ui-blocking window.confirm
                    if(!window.confirm(msg)) {
                        break breakThisToApplyOrig;
                    }
                }

                if (action === Action.ALLOW) {
                    let blockEvent = new CanvasBlockEvent(type, Action.ALLOW, stack, canvas);
                    this.notifier.onBlocked(blockEvent);
                    break breakThisToApplyOrig;
                }

                const ret = action === Action.FAKE ? fake(orig, __this, _arguments) : block(orig, __this, _arguments);
                let blockEvent = new CanvasBlockEvent(type, action, stack, canvas);
                this.notifier.onBlocked(blockEvent);
                return ret;
            }

            return <R>orig.apply(__this, _arguments);
        }
    }

    private static returnNull:ApplyHandler<any,null> = (orig, __this, _arguments) => null;
    private static identity = (x:HTMLCanvasElement):HTMLCanvasElement => x;
    private static canvasFromContext = (ctxt:CanvasRenderingContext2D|WebGLRenderingContext|WebGL2RenderingContext):HTMLCanvasElement => ctxt.canvas;

    $apply(window:Window) {
        let domain = window.location.hostname;

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
                    this.anonymizeWebGLRenderingContextMethods,
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
                    this.anonymizeWebGLRenderingContextMethods,
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
        private storage:IStorageProvider,
        private canvasProcessor:ICanvasProcessor,
        private notifier:INotifier
    ) {
        this.canvasContextMap = new WeakMap();
    }
}
