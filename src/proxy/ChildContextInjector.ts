import IChildContextInjector from "./IChildContextInjector";
import IProxyService, { ApplyHandler } from './IProxyService';
import { ABOUT_PROTOCOL } from '../shared/dom'
import TypeGuards from '../shared/TypeGuards';
import * as log from '../shared/log';
import { isSameOrigin } from '../shared/url';
import WeakMap from '../shared/WeakMap';

export default class ChildContextInjector implements IChildContextInjector {
    /**
     * A Weakmap instance that maps iframe elements to its contentDocument.
     * If an iframe's contentDocument is not available, it is mapped to `null`.
     */
    private frameToDocument:IWeakMap<HTMLIFrameElement, Document>
    
    private getContentWindow:(this:HTMLIFrameElement)=>Window
    private getContentDocument:(this:HTMLIFrameElement)=>Document

    private callbacks:func[] = [];

    constructor(
        private $window:Window,
        proxyService:IProxyService,
        private globalKey:string
    ) {
        this.onFrameLoad = this.onFrameLoad.bind(this);

        // Initialize
        const iframePType = this.$window.HTMLIFrameElement.prototype;
        this.getContentWindow = Object.getOwnPropertyDescriptor(iframePType, 'contentWindow').get;
        this.getContentDocument = Object.getOwnPropertyDescriptor(iframePType, 'contentDocument').get;

        this.frameToDocument = new WeakMap();
        proxyService.wrapAccessor(iframePType, 'contentWindow', this.executeCodeOnGet);
        proxyService.wrapAccessor(iframePType, 'contentDocument', this.executeCodeOnGet);
    }

    private executeCodeOnGet:ApplyHandler<HTMLIFrameElement, any> = (_get:(this:HTMLIFrameElement)=>any, __this) => {
        let prevDoc = this.frameToDocument.get(__this);
        if (TypeGuards.isUndef(prevDoc)) {
            // New iframe elements
            log.print("ChildContextInjector: attaching an event listener to a first met frame");
            __this.addEventListener('load', this.onFrameLoad);
            try {
                let contentWin:Window = this.getContentWindow.call(__this);
                if (contentWin.location.protocol === ABOUT_PROTOCOL) {
                    log.print("ChildContextInjector: new child context encountered.", __this.outerHTML);
                    this.frameToDocument.set(__this, contentWin.document);
                    this.processChildWindow(contentWin);
                    /**
                     * {@link https://dev.w3.org/html5/spec-preview/history.html#navigate}
                     * 
                     *    First, a new Window object must be created and associated with the Document, with one exception:
                     *    if the browsing context's only entry in its session history is the about:blank Document that was
                     *    added when the browsing context was created, and navigation is occurring with replacement enabled,
                     *    and that Document has the same origin as the new Document, then the Window object of that Document
                     *    must be used instead, and the document attribute of the Window object must be changed to point to
                     *    the new Document instead.
                     * 
                     * This exception clause is applied when there is an iframe whose src attribute is set to be same-origin,
                     * and its `contentWindow` is accessed after the iframe is attached to the document very quickly,
                     * either synchronously or in the next microtask queue.
                     * Note that, how such uninitialized empty frames' origins are treated can be browser-dependent.
                     * In such cases, the `Window` object will reused by the newly loaded document, so we set a global flag
                     * in order to prevent userscripts loaded to the document from running, to avoid overriding DOM Apis
                     * twice.
                     */
                    let src = __this.src;
                    if (src && this.globalKey && isSameOrigin(src, this.$window.location, this.$window.document.domain)) {
                        log.print("ChildContextInjector: setting globalKey");
                        ChildContextInjector.setNonEnumerableValue(contentWin, this.globalKey, undefined);
                    }
                }
            } catch(e) {
                log.print(`error`, e);
                this.frameToDocument.set(__this, null);
            }
        }
        return _get.call(__this);
    };
    /**
     * This should be called when we are sure that `childWindow` is not subject to
     * CORS restrictions.
     */
    private processChildWindow(childWindow:Window) {
        const callbacks = this.callbacks;
        for (let i = 0, l = callbacks.length; i < l; i++) {
            callbacks[i](childWindow);
        }
    }
    private onFrameLoad(evt:Event) {
        const iframe = <HTMLIFrameElement>evt.target;
        try {
            let document:Document = this.getContentDocument.call(iframe);
            // If a loaded document has empty location, and it is different from the previous document,
            // We execute the callback again.
            if (document.location.protocol === ABOUT_PROTOCOL && this.frameToDocument.get(iframe) !== document) {
                log.print("ChildContextInjector: a content of an empty iframe has changed.");
                this.frameToDocument.set(iframe, document);
                this.processChildWindow(document.defaultView);
            }
        } catch(e) {
            this.frameToDocument.set(iframe, null);
        }
    }

    private static setNonEnumerableValue(owner:object, prop:string, value:any) {
        Object.defineProperty(owner, prop, {
            value,
            configurable: true
        });
    }

    registerCallback(callback:(win:Window)=>void):void {
        this.callbacks.push(callback);
    }
}
