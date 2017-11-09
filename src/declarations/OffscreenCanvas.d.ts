interface OffscreenCanvas {
    getContext(type:'2d', ...args):CanvasRenderingContext2D
    getContext(type:'experimental-webgl'|'webgl', ...args):WebGLRenderingContext
    getContext(type:'webgl2', ...args):WebGL2RenderingContext
    getContext(type:'bitmaprenderer', ...args):ImageBitmapRenderingContext
    getContext(type:any, ...args):any   

    toBlob():Promise<Blob>
    convertToBlob():Promise<Blob> // Chrome 64
    transferToImageBitmap():ImageBitmap

    width:number
    height:number
}

declare var OffscreenCanvas: {
    prototype:OffscreenCanvas
    new(width:number, height:number):OffscreenCanvas
}

interface Window {
    OffscreenCanvas?: typeof OffscreenCanvas
}
