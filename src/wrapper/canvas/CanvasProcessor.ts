import ICanvasProcessor from './ICanvasProcessor';
import IResult from './IResult';
import IStorageProvider from '../../storage/IStorageProvider';

// https://gist.github.com/wellcaffeinated/5399067#gistcomment-1364265
const SIZE_64_KB = 65536;     // This equals to the size of 128 * 128 canvas.
const SIZE_64_MB = 67108864;

/**
 * Returns `Math.ceil(log_2(num))` for positive integer `num`.
 */
function ln2(num:number):number {
	let i = 0;
	for (num--; num !== 0; i++) { num = num >> 1; }
	return i;
}

function nextValidHeapSize(realSize:number) {	
	if (!realSize || realSize <= SIZE_64_KB) {
		return SIZE_64_KB;
	} else if (realSize <= SIZE_64_MB) {
		return 1 << ln2(realSize);
	} else {
	  	return SIZE_64_MB * Math.ceil(realSize/SIZE_64_MB);
	}
}

export function crop(data:Uint8Array|Uint8ClampedArray, x:number, y:number, w:number, h:number, orig_w:number, orig_h:number, translated:Uint8Array|Uint8ClampedArray):void {
	for (let origOffset = (y * orig_w + x) << 2, targetOffset = 0, counter = 0;
		counter < h;
		counter++, origOffset += (orig_w << 2), targetOffset += (w << 2) ) {
		translated.set(data.subarray(origOffset, origOffset + (w << 2)), targetOffset);
	}
}

export default class CanvasProcessor implements ICanvasProcessor {
	
	private static DATA_OFFSET = 0;

	private buffer:ArrayBuffer
	private bufferBytesLength:number

	private data8:Uint8Array

	private noiseApplyer2D:INoiseApplyer

    constructor(private options:IStorageProvider, private $window:Window) {
		// Stores native methods here, which will be overridden later.
		this.getContext = HTMLCanvasElement.prototype.getContext;
		this.getImageData = CanvasRenderingContext2D.prototype.getImageData;
		if (typeof OffscreenCanvas === 'function') {
			this.getContextOffscreen = OffscreenCanvas.prototype.getContext;
		}
	}

	private getContext:typeof HTMLCanvasElement.prototype.getContext
	private getImageData:typeof CanvasRenderingContext2D.prototype.getImageData
	private getContextOffscreen:typeof OffscreenCanvas.prototype.getContext

	private initialize2DNoiser(size?:number) {
		let bufferSize = nextValidHeapSize(size);
		// Grow buffer size if needed.
		if (!this.buffer || size > this.bufferBytesLength) {
			this.buffer = new ArrayBuffer(bufferSize);
			this.bufferBytesLength = bufferSize;
			this.data8 = new Uint8Array(this.buffer);

			// IE does not support Math.imul, which is required by noise applier.
			if (typeof this.$window.Math.imul !== 'function') {
				this.$window.Math.imul = imul;
			}
			this.noiseApplyer2D = noiseApplyerModule2D(this.$window, null, this.buffer);
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

		writeBuffCb(this.data8);

		let h = this.options.getHashInInt32();

		let start = performance.now();
		let result = this.noiseApplyer2D._apply_noise(CanvasProcessor.DATA_OFFSET, sx, sy, width, height, origWidth, origHeight, h[0], h[1], h[2], h[3]);
		let end = performance.now();
		
		console.log("[FingerprintingBlocker]: total " + result + " values have been modified.");
		console.log(`Elapsed: ${end - start} ms.`);
		console.log(`Canvas size was ${width} * ${height}`);

		return {
			data: new Uint8Array(this.buffer, CanvasProcessor.DATA_OFFSET, dataSize),
			result: result //this.resultBuffer32[0]
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

		const { data: noiseApplied, result } = this.addNoiseToBitmap((buffView)=>{ buffView.set(data) }, -1, -1, w + 2, h + 2, w, h);
		if (result) {
			imageData.data.set(noiseApplied);
			cloned2dCanvas = cloned2dCanvas || document.createElement('canvas');
			this.getContext.call(cloned2dCanvas, '2d').putImageData(imageData, 1, 1, 0, 0, w, h);
			return {
				data: cloned2dCanvas,
				result: result
			}
		} else {
			return {
				data: canvas,
				result: result
			};
		}
	}
}

/**
 * Polyfill of Math.imul for IE.
 */
function imul(a:number, b:number):number {
	var ah = (a >>> 16) & 0xffff;
	var al = a & 0xffff;
	var bh = (b >>> 16) & 0xffff;
	var bl = b & 0xffff;
	// the shift by 0 fixes the sign on the high part
	// the final |0 converts the unsigned value into a signed value
	return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
};
