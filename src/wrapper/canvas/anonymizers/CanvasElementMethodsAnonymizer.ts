import CanvasApiAnonymizer from "./BaseCanvasApiAnonymizer";
import INotifier from "../../../notifier/INotifier";
import IStorage from "../../../storage/IStorage";
import ICanvasProcessor from "../processor/ICanvasProcessor";
import ICanvasModeTracker from "../mode_tracker/ICanvasModeTracker";
import { original } from "../../common_apply_handlers";
import IApiExecResult from "../../IApiExecResult";
import * as log from '../../../shared/log';
import { PixelFakeResult } from "../common_api_exec_results";

export default class CanvasElementMethodsAnonymizer extends CanvasApiAnonymizer<HTMLCanvasElement,any> {
    onFake(orig, __this, _arguments) {
        const contextType = this.canvasModeTracker.getCanvasMode(__this);
        let result:number = 0;
        let fakedCanvas = __this;
        if (contextType) {
            const {$data, $result} = this.canvasProcessor.clone2DCanvasWithNoise(__this, contextType);
            fakedCanvas = $data;
            result = $result;
        }
        return new PixelFakeResult(original(orig, fakedCanvas, _arguments), result);
    }

    private emptyCanvas:HTMLCanvasElement
    onBlock(orig, __this, _arguments) {
        // Creates an empty canvas having the same dimension.
        if (!this.emptyCanvas) {
            this.emptyCanvas = document.createElement('canvas');
        }
        this.emptyCanvas.width = __this.width;
        this.emptyCanvas.height = __this.height;
        return new PixelFakeResult(original(orig, this.emptyCanvas, _arguments), Number.MAX_SAFE_INTEGER);
    }
    getData(orig, __this, _arguments) {
        return __this;
    }

    constructor(
        storage:IStorage,
        notifier:INotifier,
        private canvasProcessor:ICanvasProcessor,
        private canvasModeTracker:ICanvasModeTracker
    ) {
        super(storage, notifier);
    }
}
