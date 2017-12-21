import CanvasApiAnonymizer from "./BaseCanvasApiAnonymizer";
import { Notify } from "../../common_api_exec_results";
import { original } from "../../common_apply_handlers";
import TypeGuards from "../../../shared/TypeGuards";
import ICanvasProcessor from "../processor/ICanvasProcessor";
import IStorage from "../../../storage/IStorage";
import INotifier from "../../../notifier/INotifier";
import { PixelFakeResult } from "../common_api_exec_results";
import { crop } from "../processor/CanvasProcessor";
import * as log from '../../../shared/log';

export default class ReadPixelAnonymizer extends CanvasApiAnonymizer<WebGLRenderingContext|WebGL2RenderingContext,void> {
    private hasEnoughPixelCount(_arguments:IArguments|any[]):boolean {
        const sw:number = _arguments[2];
        const sh:number = _arguments[3];
        return CanvasApiAnonymizer.MIN_CANVAS_SIZE_TO_BLOCK < sw * sh << 2;
    }
    onAllow(orig, __this, _arguments) {
        return new Notify(original<any,void>(orig, __this, _arguments), this.hasEnoughPixelCount(_arguments));
    }
    onFake(orig, __this, _arguments) {
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
                    return new PixelFakeResult(undefined, $result);
                }
            }
            case __this.UNSIGNED_SHORT_5_6_5:
            case __this.UNSIGNED_SHORT_5_5_5_1:
            case __this.UNSIGNED_SHORT_4_4_4_4:
                log.print('called WebGL(2)RenderingContext#readPixels with a type whose faking is not supported.');
            default:
                original(orig, __this, _arguments);
                return new PixelFakeResult(undefined, 0);
        }
    }
    onBlock(orig, __this, _arguments) {
        if (this.hasEnoughPixelCount(_arguments)) {
            return new Notify(original(orig, __this, _arguments), false);
        }
        const sw:number = _arguments[2];
        const sh:number = _arguments[3];

        let dstOffset:number;
        let pixels:Uint8Array|Uint16Array|Float32Array;
        if (typeof _arguments[6] === 'number') {
            dstOffset = _arguments[6];
        } else {
            pixels = _arguments[6];
            dstOffset = _arguments[7];
        }

        let outLen = sw * sh << 2;
        if (outLen > pixels.length) {
            outLen = pixels.length;
        }

        while (outLen--) {
            pixels[outLen] = 0;
        }
        return new Notify(undefined);
    }
    getData(orig, __this, _arguments) {
        return __this.canvas;
    }

    constructor(
        storage:IStorage,
        notifier:INotifier,
        private canvasProcessor:ICanvasProcessor
    ) {
        super(storage, notifier);
    }
}
