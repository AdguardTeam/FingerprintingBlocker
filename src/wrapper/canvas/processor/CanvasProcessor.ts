import ICanvasProcessor from './ICanvasProcessor';
import IResult from './IResult';
import IStorage from '../../../storage/IStorage';
import * as log from '../../../shared/log';
import IBufferManager from '../../arraybuffer/IBufferManager';
import BufferManager from '../../arraybuffer/BufferManager';

export function crop(data:Uint8Array|Uint8ClampedArray, x:number, y:number, w:number, h:number, orig_w:number, orig_h:number, translated:Uint8Array|Uint8ClampedArray):void {
    for (let origOffset = (y * orig_w + x) << 2, targetOffset = 0, counter = 0;
        counter < h;
        counter++, origOffset += (orig_w << 2), targetOffset += (w << 2) ) {
        translated.set(data.subarray(origOffset, origOffset + (w << 2)), targetOffset);
    }
}

export default class CanvasProcessor implements ICanvasProcessor {
    private static DATA_OFFSET = 0;

    private bufferManager:IBufferManager
    private noiseApplyer2D:IBitmapNoiseApplier

    constructor(private storage:IStorage, private $window:Window) {
        this.bufferManager = BufferManager.getInstance();
        // Stores native methods here, which will be overridden later.
        this.getContext = HTMLCanvasElement.prototype.getContext;
        this.getImageData = CanvasRenderingContext2D.prototype.getImageData;
    }

    private getContext:typeof HTMLCanvasElement.prototype.getContext
    private getImageData:typeof CanvasRenderingContext2D.prototype.getImageData

    createImageData(w:number, h:number):ImageData {
        try {
            return new ImageData(w, h);
        } catch(e) {
            // IE does not support ImageData constructor.
            let canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            return this.getImageData.call(this.getContext.call(canvas, '2d'), 0, 0, w, h);
        }
    }

    private initialize2DNoiser(size:number) {
        if (!this.noiseApplyer2D || size > this.bufferManager.buffer.byteLength) {
            let init_start = performance.now();
            this.noiseApplyer2D = this.bufferManager.getModule(size, this.$window, bitmapNoiseApplier);
            let init_end = performance.now();
            log.print(`Initializing noiser took ${init_end - init_start} ms.`);
        }
    }
    /**
     * Beware: this does _not_ apply noise to pixels on 4 borders.
     */
    addNoiseToBitmap(
        writeBuffCb :(buffView:Uint8Array)=>void,
        sx			:number, // x-coord in which `data` is extracted from
        sy			:number, // y-coord in which `data` is extracted from
        width		:number, // width of `data`
        height		:number, // height of `data`
        origWidth	:number, // width of a data from which `data` is extracted
        origHeight	:number  // height of a data from which `data` is extracted
    ):IResult<Uint8Array> {
        let dataSize = (width * height) << 2;
        let bufferSize = dataSize + CanvasProcessor.DATA_OFFSET;

        this.initialize2DNoiser(bufferSize);

        writeBuffCb(new Uint8Array(this.bufferManager.buffer));

        let h = this.storage.getSalt();

        let start = performance.now();
        let result = this.noiseApplyer2D._apply_noise(CanvasProcessor.DATA_OFFSET, sx, sy, width, height, origWidth, origHeight, h[0], h[1], h[2], h[3]);
        let end = performance.now();

        log.print("Total " + result + " values have been modified.");
        log.print(`Elapsed: ${end - start} ms.`);
        log.print(`Canvas size was ${width} * ${height}`);

        return {
            $data: new Uint8Array(this.bufferManager.buffer, CanvasProcessor.DATA_OFFSET, dataSize),
            $result: result //this.resultBuffer32[0]
        };
    }

    addNoiseToFloatArray(data:ArrayBufferView, sx:number, sy:number, width:number, height:number):Float64Array {
        // Just a stub
        return;
    }

    clone2DCanvasWithNoise(canvas:HTMLCanvasElement, contextType:TCanvasMode):IResult<HTMLCanvasElement> {
        // ToDo: make this type safe
        const w = canvas.width, h = canvas.height;
        let context:CanvasRenderingContext2D; // A canvas rendering context, to read ImageData from.
        let cloned2dCanvas:HTMLCanvasElement

        if (contextType === '2d') {
            context = this.getContext.call(canvas, '2d');
        } else {
            let cloned2dCanvas = document.createElement('canvas');
            cloned2dCanvas.width = w;
            cloned2dCanvas.height = h;
            context = this.getContext.call(cloned2dCanvas, '2d');
            context.drawImage(canvas, 0, 0, w, h);
        }
        const imageData:ImageData = this.getImageData.call(context, -1, -1, w + 2, h + 2);
        const data = imageData.data;

        const { $data: noiseApplied, $result } = this.addNoiseToBitmap((buffView)=>{ buffView.set(data) }, -1, -1, w + 2, h + 2, w, h);
        if ($result) {
            imageData.data.set(noiseApplied);
            cloned2dCanvas = cloned2dCanvas || document.createElement('canvas');
            cloned2dCanvas.width = w;
            cloned2dCanvas.height = h;
            this.getContext.call(cloned2dCanvas, '2d').putImageData(imageData, 1, 1, 0, 0, w, h);
            return {
                $data: cloned2dCanvas,
                $result: $result
            }
        } else {
            return {
                $data: canvas,
                $result: $result
            };
        }
    }
}
