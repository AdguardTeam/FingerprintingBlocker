import IResult from './IResult';

export default interface ICanvasProcessor {
    clone2DCanvasWithNoise(canvas:HTMLCanvasElement, type:TCanvasMode):IResult<HTMLCanvasElement>
    addNoiseToBitmap(data:Uint8Array|Uint8ClampedArray, sx:number, sy:number, width:number, height:number, origWidth:number, origHeight:number):IResult<Uint8ClampedArray>
}