import CanvasProcessor, { crop } from '../../../src/wrapper/canvas/CanvasProcessor';
import dummyStorageObject from '../../storage/StorageProvider';

const expect = chai.expect;

const crypto:Crypto = window.crypto || window['msCrypto'];

function createImageData(w:number, h:number):ImageData {
    try {
        return new ImageData(w, h);
    } catch(e) {
        // IE does not support ImageData constructor
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas.getContext('2d').getImageData(0, 0, w, h);
    }
}


function getRandomImageData(x?:number, y?:number):ImageData {
    x = x || Math.floor(Math.random() * 27) + 101;
    y = y || Math.floor(Math.random() * 27) + 101;
    let imageData = createImageData(x, y);
    fillRandomValues(imageData.data.buffer);
    return imageData;
}

function fillRandomValues(arrayBuffer:ArrayBuffer):void {
    let size = arrayBuffer.byteLength;
    // `Crypto.getRandomValues` can generate at most 65536 bytes of random data.
    // https://developer.mozilla.org/en-US/docs/Web/API/RandomSource/getRandomValues
    for (let offset = 0; offset < size; offset += 65536) {
        crypto.getRandomValues(new Uint8Array(arrayBuffer, offset, Math.min(size - offset, 65536)));
    }
}

describe('CanvasProcessor', function() {
    it('Applies noise that remains persistent with given hash', function() {
        let canvasProcessor = new CanvasProcessor(dummyStorageObject, window);
        let imageData = getRandomImageData();

        let w = imageData.width;
        let h = imageData.height;

        let x = Math.floor(Math.random() * 68) + 2;
        let y = Math.floor(Math.random() * 68) + 2;

        let croppedImageData = createImageData(w - x, h - y);
        crop(imageData.data, x, y, w - x, h - y, w, h, croppedImageData.data);

        let { data: data1, result: result1 } = canvasProcessor.addNoiseToBitmap((buf) => { buf.set(imageData.data) }, 0, 0, w, h, w, h);
        let point1 = data1[(100 * w + 100) * 4];

        let { data: data2, result: result2 } = canvasProcessor.addNoiseToBitmap((buf) => { buf.set(croppedImageData.data) }, x, y, w - x, h - y, w, h);        
        let point2 = data2[((100 - y) * (w - x) + (100 - x)) * 4];

        expect(point1).to.equal(point2);
        console.log(point1);
    })

    it('took less time than the plain js version', function() {
        this.timeout(10000);

        let canvasProcessor = new CanvasProcessor(dummyStorageObject, window);
        let canvasProcessor2 = new CanvasProcessor(dummyStorageObject, window);

        const ITERATION = 10;

        const TEST_CANVAS_W = 1000;
        const TEST_CANVAS_H = 1000;

        let severalRandomImageData:ImageData[] = [];
        for (let i = 0; i < ITERATION; i++) {
            severalRandomImageData.push(getRandomImageData(TEST_CANVAS_W, TEST_CANVAS_H));
        }

        let severalRandomImageData2:ImageData[] = [];
        for (let i = 0; i < ITERATION; i++) {
            severalRandomImageData2.push(getRandomImageData(TEST_CANVAS_W, TEST_CANVAS_H));
        }

        let start1 = performance.now();
        for (let i = 0; i < ITERATION; i++) {
            canvasProcessor.addNoiseToBitmap((buf) => { buf.set(severalRandomImageData[i].data) }, 0, 0, TEST_CANVAS_W, TEST_CANVAS_H, TEST_CANVAS_W, TEST_CANVAS_H);
        }
        let end1 = performance.now();

        // Replace a module exposed in the global scope that CanvasProcessor uses
        window['noiseApplyerModule2D'] = window['noiseApplyerModule2D_plainJs'];

        let start2 = performance.now();
        for (let i = 0; i < ITERATION; i++) {
            canvasProcessor2.addNoiseToBitmap((buf) => { buf.set(severalRandomImageData2[i].data) }, 0, 0, TEST_CANVAS_W, TEST_CANVAS_H, TEST_CANVAS_W, TEST_CANVAS_H);
        }
        let end2 = performance.now();

        console.log(end1 - start1);
        console.log(end2 - start2);

        expect(end1 - start1).to.be.lessThan(end2 - start2);
    });
});
