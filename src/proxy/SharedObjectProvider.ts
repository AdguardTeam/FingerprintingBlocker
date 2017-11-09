import ISharedObjectProvider from './ISharedObjectProvider';
import IProxyService, { ApplyHandler } from './IProxyService';

import WeakMap from '../third-party/weakmap';

export default class SharedObjectProvider implements ISharedObjectProvider {
    private sharedObject:any[]
    private received:boolean
    private processed:IWeakMap<HTMLIFrameElement, boolean>
    private getContentWindow:(this:HTMLIFrameElement)=>Window
    private proxyService:IProxyService

    constructor(private $window:Window, private KEY:string, private callback:(win:Window)=>any) {
        if (this.sharedObject = $window[KEY]) {
            this.received = true;
        } else {
            this.sharedObject = [];
            this.received = false;
        }
    }

    registerObject<T>(key:number, ctor:{new():T}):T {
        if (this.received) {
            return <T>this.sharedObject[key];
        } else {
            return (this.sharedObject[key] = new ctor);
        }
    }

    initialize(proxyService:IProxyService) {
        const iframePType = this.$window.HTMLIFrameElement.prototype;
        this.getContentWindow = Object.getOwnPropertyDescriptor(iframePType, 'contentWindow').get;
        this.processed = new WeakMap();
        proxyService.wrapAccessor(iframePType, 'contentWindow', this.executeCodeOnGet);
        proxyService.wrapAccessor(iframePType, 'contentDocument', this.executeCodeOnGet);
    }

    private executeCodeOnGet:ApplyHandler<HTMLIFrameElement, any> = (_get:(this:HTMLIFrameElement)=>any, __this) => {
        if (!this.processed.has(__this)) {
            let contentWindow:Window = this.getContentWindow.call(__this);
            try {
                if (contentWindow.location.href === 'about:blank') {
                    contentWindow[this.KEY] = this.sharedObject;
                    this.callback(contentWindow);
                    delete contentWindow[this.KEY];
                }
            } catch(e) {
                // Log something
            } finally {
                this.processed.set(__this, true);
            }
        }
        return _get.call(__this);
    };
}
