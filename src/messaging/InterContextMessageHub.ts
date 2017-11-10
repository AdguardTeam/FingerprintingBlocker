import IInterContextMessageHub from './IInterContextMessageHub';

export default class InterContextMessageHub implements IInterContextMessageHub {
    public supported:boolean
    public $window:Window
    public parent:Window
    public isTop:boolean
    private framePortMap:IWeakMap<Window, MessagePort>
    private typeCallbackMap:func[];
    private static readonly MAGIC = 'fpb_handshake';
    constructor(window:Window) {
        this.$window = window;
        const supported = this.supported = typeof WeakMap === 'function';
        const parent = this.parent = window.parent;
        const isTop = this.isTop = parent === window;

        const isEmpty = location.href === 'about:blank';
        const channel = !isTop && supported ? new MessageChannel() : null;

        if (supported) {
            this.framePortMap = new WeakMap<Window, MessagePort>();
            window.addEventListener('message', (evt) => {
                this.handshake(evt);
            });
            if (!isTop) {
                parent.postMessage(InterContextMessageHub.MAGIC, '*', [channel.port1]);
                channel.port2.onmessage = (evt) => { this.onMessage(evt); };
            }
            this.typeCallbackMap = [];
        }
    }
    private handshake(evt:MessageEvent) {
        if (evt.data !== InterContextMessageHub.MAGIC) {
            // `MAGIC` indicates that this message is sent by the popupblocker from the child frame.
            return;
        }
        if (typeof evt.source === 'undefined') {
            // evt.source can be undefiend when an iframe has been removed from the document before the message is received.
            return;
        }
        if (this.framePortMap.has(evt.source)) {
            // Such frames have already sent its message port, we do not accept additional ports.
            return;
        }
        // log.print('received a message from:', evt.source);
        let port = evt.ports[0]; // This is a port that a child frame sent.
        port.onmessage = (evt) => {
            this.onMessage(evt);
        };
        this.framePortMap.set(evt.source, port);
        evt.stopImmediatePropagation();
        evt.preventDefault();
    }
    private onMessage(evt:MessageEvent) {
        let data = evt.data;
        this.triggerCallback(data.type, data.data);
    }
    private triggerCallback<T>(type:number, data:T) {
        let callback = this.typeCallbackMap[type];
        if (callback) {
            callback(data);
        }
    }
    on<T>(type:number, callback:(arg:T)=>void):void {
        // @ifdef DEBUG
        if (typeof this.typeCallbackMap[type] !== 'undefined') {
            throw new Error('Tried to re-assign a callback for an event type');
        }
        // @endif
        this.typeCallbackMap[type] = callback;
    }
    trigger<T>(type:number, data:T, target:Window):void {
        if (!this.supported) {
            // if WeakMap is not supported, this method will only work when
            // the target is the same browsing context.
            if (target === this.$window) {
                this.triggerCallback(type, data);
            }
            return;
        }
        let port = this.framePortMap.get(target);
        if (!port) { return; }
        let msgData = {
            type: type,
            data: data
        };
        port.postMessage(msgData);
    }
}
