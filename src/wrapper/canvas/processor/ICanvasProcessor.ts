import IResult from './IResult';

export default interface ICanvasProcessor {
    clone2DCanvasWithNoise(canvas:HTMLCanvasElement, type:TCanvasMode):IResult<HTMLCanvasElement>
    addNoiseToBitmap(writeBuffCb:(buffView:Uint8Array)=>void, sx:number, sy:number, width:number, height:number, origWidth:number, origHeight:number):IResult<Uint8Array>
}
