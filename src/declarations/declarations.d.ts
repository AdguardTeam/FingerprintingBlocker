declare interface Window {
    Function:FunctionConstructor
    HTMLCanvasElement: typeof HTMLCanvasElement
    HTMLIFrameElement: typeof HTMLIFrameElement
    CanvasRenderingContext2D?: typeof CanvasRenderingContext2D
    WebGLRenderingContext?:typeof WebGLRenderingContext
    WebGL2RenderingContext?:typeof WebGL2RenderingContext
    eval:typeof eval
    readonly msCrypto?:Crypto
    readonly Math:typeof Math
}

// requestIdleCallback
// Reference: https://w3c.github.io/requestidlecallback/#window_extensions
type IdleRequestCallback = (deadline:IdleDeadline)=>void
type IdleRequestOptions = {
    timeout:number
}
interface IdleDeadline {
    timeRemaining():number
    readonly didTimeout:boolean
}

declare function requestIdleCallback (callback:IdleRequestCallback, option?:IdleRequestOptions):number
declare function cancelIdleCallback (handle:number):void

interface Window {
    requestIdleCallback?:typeof requestIdleCallback
    cancelIdleCallback?:typeof cancelIdleCallback
}

// Workaround for [Symbol.toStringTag] requirement of TS
interface IWeakMap<K extends object, V> {
    delete(key: K): boolean;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
}

interface IWeakMapCtor {
    new (): IWeakMap<object, any>;
    new <K extends object, V>(entries?: [K, V][]): IWeakMap<K, V>;
    readonly prototype: IWeakMap<object, any>;
}

//

type func = (...args)=>any

type stringmap<T> = {
    [id: string]: T
}


