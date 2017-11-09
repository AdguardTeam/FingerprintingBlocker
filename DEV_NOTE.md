## getImageData is often used to detect emoji support

https://stackoverflow.com/questions/40385022/how-does-github-detect-whether-the-browser-has-color-emoji-support

## security feature regarding getImageData
https://stackoverflow.com/questions/17035106/context-getimagedata-operation-is-insecure


## Comparing toDataURL image
Preparation
```
var x = 804;
var y = 533;
document.body.insertAdjacentHTML('beforeend',
`<img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Phoenicopterus_ruber_in_S%C3%A3o_Paulo_Zoo.jpg" crossorigin=anonymous width=${x} height=${y} id=flamingo>
<canvas id=canvas1 width=${x} height=${y}></canvas>
<canvas id=canvas2 width=${x} height=${y}></canvas>`);

flamingo.onload = function() {
    canvas1.getContext('2d').drawImage(flamingo, 0, 0, x, y);
}
```


```
var context = canvas1.getContext('2d');
var imageData = context.getImageData(0,0, x, y)
var dataURL = canvas1.toDataURL();
var image = new Image(x, y)
image.src = dataURL;
document.body.appendChild(image)

canvas2.getContext('2d').drawImage(image, 0, 0, x, y);
document.body.appendChild(canvas2);
var imageData2 = canvas2.getContext('2d').getImageData(0, 0, x, y);

// Compare imageData and imageData2!! They are not equal.
```




```
for (var i = 0; i < 220 * 227; i++) {
	if (imageData.data[i] !== imageData2.data[i]) {
		console.log(i);
	}
}
```

## Comparing self-feeding imageData
```
var context = canvas1.getContext('2d');
var imageData = context.getImageData(0,0,x,y);

canvas2.getContext('2d').putImageData(imageData, 0, 0);
document.body.appendChild(canvas2);
var imageData2 = canvas2.getContext('2d').getImageData(0, 0, x, y);
// In this case, imageData and imageData2 are identical.

var dataURL = canvas1.toDataURL();
var dataURL2 = canvas2.toDataURL();

// dataURL and dataURL2 are identical.
```

### Conclusion
ImageData is a _faithful_ representation of a 2d rendering context.


## Sample code to generate webgl canvas

```
var webgl = document.createElement('canvas');
webgl.id = 'webgl';
var gl = webgl.getContext("webgl2");

gl.enable(gl.SCISSOR_TEST);
for (var y = 0; y < 15; ++y) {
  var v = y / 14;
  gl.scissor(0, y * 10, 300, 10);
  gl.clearColor(v, 0, 1 - v, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

document.body.appendChild(webgl);
var width = gl.drawingBufferWidth;
var height = gl.drawingBufferHeight;
var pixels = new Uint8Array(width * height * 4);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

console.log(webgl.toDataURL());

var webglData = webgl.toDataURL();


var twodcanvas = document.createElement('canvas');
twodcanvas.getContext('2d').drawImage(gl.canvas, 0, 0, 300, 150)
```


## toDataURL on WebGL canvas returns blank image

**By default the canvas is cleared after every composite**
https://stackoverflow.com/questions/26783586/canvas-todataurl-returns-blank-image-only-in-firefox/26790802#26790802


## Regarding WebGLRenderingContext#readPixels

https://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target/
> The readPixels is limited to the RGBA format and the UNSIGNED_BYTE type (WebGL specification).

https://threejs.org/examples/webgl_read_float_buffer.html



## FF
https://bugzilla.mozilla.org/show_bug.cgi?id=1217290