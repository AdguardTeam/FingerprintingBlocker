import ICanvasModeTracker from "./ICanvasModeTracker";
import IProxyService from "../../../proxy/IProxyService";
import WeakMap from '../../../shared/WeakMap';

export default class CanvasModeTracker implements ICanvasModeTracker {
    private canvasModeMap:IWeakMap<HTMLCanvasElement,TCanvasMode> = new WeakMap();
    trackCanvasContextStatus(orig, __this:HTMLCanvasElement, _arguments) {
        const context = orig.apply(__this, _arguments);
        if (context !== null) {
            this.canvasModeMap.set(__this, _arguments[0]);
        }
        return context;
    }
    getCanvasMode(canvas:HTMLCanvasElement):TCanvasMode {
        return this.canvasModeMap.get(canvas);
    }
    constructor(
        private proxyService:IProxyService
    ) {
        this.trackCanvasContextStatus = this.trackCanvasContextStatus.bind(this);
    }
    $apply(window:Window) {
        this.proxyService.wrapMethod(window.HTMLCanvasElement.prototype, 'getContext', this.trackCanvasContextStatus);
    }
}
