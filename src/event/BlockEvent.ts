export const enum Apis {
    canvas,
    audio,
}

export const enum CanvasBlockEventType {
    TO_DATA_URL,
    TO_BLOB,
    MOZ_GET_AS_FILE,
    GET_IMAGE_DATA,
    READ_PIXELS,
    READ_PIXELS_2
}

const canvasApiName = [
    'HTMLCanvasElement#toDataURL',
    'HTMLCanvasElement#toBlob',
    'HTMLCanvasElement#mozGetAsFile',
    'CanvasRenderingContext2D#getImageData',
    'WebGLRenderingContext#readPixels',
    'WebGL2RenderingContext#readPixels'
];

export const enum AudioBlockEventType {
    GET_CHANNEL_DATA
}

const audioApiName = [
    'AudioBuffer#getChannelData'
];

export type EventType = CanvasBlockEventType | AudioBlockEventType;

export function getApiName(api:Apis, type:EventType):string {
    switch (api) {
        case Apis.canvas:
            return canvasApiName[type];
        case Apis.audio:
            return audioApiName[type];
    }
}

export const enum Action {
    ALLOW,
    FAKE,
    BLOCK
}

interface IBaseEvent {
    api:Apis
    type:number,
    action:Action,
    stack:string,
    data:any
}

interface ICanvasBlockEvent extends IBaseEvent {
    api:Apis.canvas
    type:CanvasBlockEventType
    data:HTMLCanvasElement
}

export class CanvasBlockEvent implements ICanvasBlockEvent {
    public api:Apis.canvas = Apis.canvas
    constructor(
        public type:CanvasBlockEventType,
        public action:Action,
        public stack:string,
        public data:HTMLCanvasElement
    ) { }
}

interface IAudioBlockEvent extends IBaseEvent {
    api:Apis.audio
    type:AudioBlockEventType
    // audio:
}

export class AudioBlockEvent implements IAudioBlockEvent {
    public api:Apis.audio = Apis.audio
    constructor(
        public type:AudioBlockEventType,
        public action:Action,
        public stack:string,
        public data:any
    ) { }
}

type TBlockEvent = ICanvasBlockEvent | IAudioBlockEvent

export default TBlockEvent;
