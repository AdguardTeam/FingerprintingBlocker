import IApiExecResult from "../../IApiExecResult";
import { original } from "../../common_apply_handlers";
import { crop } from "../processor/CanvasProcessor";
import ICanvasProcessor from "../processor/ICanvasProcessor";
import { PixelFakeResult } from "../common_api_exec_results";
import CanvasApiAnonymizer from "./BaseCanvasApiAnonymizer";
import IStorage from "../../../storage/IStorage";
import INotifier from "../../../notifier/INotifier";
import { Notify } from "../../common_api_exec_results";

export default class ImgDataAccessAnonymizer extends CanvasApiAnonymizer<CanvasRenderingContext2D,ImageData> {
    private hasEnoughPixelCount(_arguments:IArguments|any[]):boolean {
        const sw:number = _arguments[2];
        const sh:number = _arguments[3];
        return CanvasApiAnonymizer.MIN_CANVAS_SIZE_TO_BLOCK < sw * sh << 2;
    }

    onAllow(orig, __this, _arguments) {
        const notify = this.hasEnoughPixelCount(_arguments);
        return new Notify(original<CanvasRenderingContext2D,ImageData>(orig, __this, _arguments), notify);
    }
    onFake(orig, __this:CanvasRenderingContext2D, _arguments:IArguments|any[]):IApiExecResult<ImageData> {
        const sx:number = _arguments[0];
        const sy:number = _arguments[1];
        const sw:number = _arguments[2];
        const sh:number = _arguments[3];
        const origWidth:number = __this.canvas.width;
        const origHeight:number = __this.canvas.height;
        // Noiser requires +-1 more pixels for each of 4 directions to deterministically apply noises.
        const tempImageData:ImageData = orig.apply(__this, [sx - 1, sy - 1, sw + 2, sh + 2]);
        const {$data, $result} = this.canvasProcessor.addNoiseToBitmap((buffView) => { buffView.set(tempImageData.data); }, sx - 1, sy - 1, sw + 2, sh + 2, origWidth, origHeight);

        const imageData = this.canvasProcessor.createImageData(sw, sh);

        // Convert dimension of the obtained imageData.
        crop($data, 1, 1, sw, sh, sw + 2, sh + 2, imageData.data);

        return new PixelFakeResult(imageData, $result);
    }
    onBlock(orig, __this, _arguments) {
        const sw:number = _arguments[2];
        const sh:number = _arguments[3];
        const notify = this.hasEnoughPixelCount(_arguments);
        const returned = notify ? this.canvasProcessor.createImageData(sw, sh) : original<CanvasRenderingContext2D,ImageData>(orig, __this, _arguments)
        return new Notify(returned, notify);
    }
    getData(orig, __this:CanvasRenderingContext2D, _arguments) {
        return __this.canvas;
    }

    constructor(
        storage:IStorage,
        notifier:INotifier,
        private canvasProcessor:ICanvasProcessor
    ) { super(storage, notifier); }
}