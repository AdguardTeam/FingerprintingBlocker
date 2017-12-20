import { ApplyHandler } from "../../../proxy/IProxyService";

/**
 * Each canvas is assigned to an internal "mode", which is initially set to 'none',
 * and can be changed via calling `getContext` method.
 * Canvas is allowed to have only one mode. For example, once '2d' context is requested
 * by `getContext('2d')` call, subsequent calls with `getContext('webgl')` will return `null`.
 * This information is not available during calls for `toDataURL` and other methods,
 * so we track the attached context type by wrapping `HTMLCanvasElement#getContext` method.
 * For the precise logic for `getContext`, we refer to
 * {@link https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-context-mode}
 */
export default interface ICanvasModeTracker {
    getCanvasMode(canvas:HTMLCanvasElement):TCanvasMode
    trackCanvasContextStatus:ApplyHandler<HTMLCanvasElement,any>
    $apply(window:Window):void
}
