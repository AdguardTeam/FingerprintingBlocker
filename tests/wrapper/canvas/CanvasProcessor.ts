import CanvasProcessor, { crop } from '../../../src/wrapper/canvas/CanvasProcessor';
import dummyStorageObject from '../../storage/StorageProvider';

const expect = chai.expect;

function getRandomImageData():ImageData {
    let x = Math.floor(Math.random() * 28) + 100;
    let y = Math.floor(Math.random() * 28) + 100;
    let imageData = new ImageData(x, y);
    (window.crypto || window['msCrypto']).getRandomValues(imageData.data);
    return imageData;
}

describe('CanvasProcessor', function() {
    it('Applies noise that remains persistent with given hash', function() {

        let canvasProcessor = new CanvasProcessor(dummyStorageObject);
        let imageData = getRandomImageData();
        let w = imageData.width;
        let h = imageData.height;

        let { data: data1, result: result1 } = canvasProcessor.addNoiseToBitmap(imageData.data, 0, 0, w, h, w, h);
        let point1 = data1[(100 * w + 100) * 4];

        let x = Math.floor(Math.random() * 50);
        let y = Math.floor(Math.random() * 50);

        let croppedImageData = new ImageData(w - x, h - y);
        crop(imageData.data, x, y, w - x, h - y, w, h, croppedImageData.data);

        let { data: data2, result: result2 } = canvasProcessor.addNoiseToBitmap(croppedImageData.data, x, y, w - x, h - y, w, h);
        let point2 = data2[((100 - y) * (w - x) + (100 - x)) * 4];
        
        expect(point1).to.equal(point2);
    })
});
