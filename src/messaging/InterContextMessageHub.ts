import IInterContextMessageHub, { TMessageHubCallback } from './IInterContextMessageHub'
import { isEmptyUrl } from '../shared/dom'
import TypeGuards from '../shared/TypeGuards'
import * as log from '../shared/log'

interface FrameData {
    messagePort:MessagePort,
    locationObject:Location
}

export default class InterContextMessageHub implements IInterContextMessageHub {
    public supported:boolean
    public $window:Window
    public parent:Window
    public isTop:boolean
    private framePortMap:IWeakMap<Window, FrameData>
    private typeCallbackMap:TMessageHubCallback<any>[];
    private static readonly MAGIC = 'fpb_handshake';
    private parentPort:MessagePort

    constructor(window:Window, parentInstance?:IInterContextMessageHub) {
        this.$window = window;
        const supported = this.supported = typeof WeakMap === 'function';
        const parent = this.parent = window.parent;
        const isTop = this.isTop = window.top === window;

        const isEmpty = isEmptyUrl(location.href);
        const channel = !isTop && supported ? new MessageChannel() : null;

        if (supported) {
            this.framePortMap = new WeakMap();
            // Listens for handshake messages
            window.addEventListener('message', (evt) => {
                this.handshake(evt);
            });
            // Passes message port to parent context.
            if (parentInstance) {
                parentInstance.registerChildPort(window, channel.port1);
            } else if (!isTop) {
                log.print(`sending message from ${window.location.href} to parent...`);
                log.print(`readystate is: ${window.document.readyState}`);
                parent.postMessage(InterContextMessageHub.MAGIC, '*', [channel.port1]);
                this.parentPort = channel.port2;
                this.parentPort.onmessage = (evt) => { this.onMessage(evt); };
            }
            this.typeCallbackMap = [];
        }
    }
    private handshake(evt:MessageEvent) {
        if (evt.data !== InterContextMessageHub.MAGIC) {
            // `MAGIC` indicates that this message is sent by the popupblocker from the child frame.
            return;
        }
        let source = evt.source;
        // From now on, propagation of event must be stopped.
        receivePort: {
            if (TypeGuards.isUndef(source)) {
                // evt.source can be undefiend when an iframe has been removed from the document before the message is received.
                break receivePort;
            }
            if (this.framePortMap.has(source)) {
                let frameData = this.framePortMap.get(source);
                if (frameData.locationObject === source.location) {
                    log.print(`Received a port from a frame that we already met. This could be a bug`);
                    log.debuggerPause();
                    break receivePort;
                }
                log.print(`Received a port from a known frame, but location object has updated`);
                // Such frames have already sent its message port, we do not accept additional ports.
            }
            // log.print('received a message from:', evt.source);
            let port:MessagePort = evt.ports[0]; // This is a port that a child frame sent.
            port.onmessage = (evt) => {
                this.onMessage(evt);
            };
            this.framePortMap.set(source, {
                messagePort: port,
                locationObject: source.location
            });
        }

        evt.stopImmediatePropagation();
        evt.preventDefault();
    }
    registerChildPort(child:Window, port:MessagePort) {
        log.print('MessageHub: registering child context directly..');
        this.framePortMap.set(child, {
            messagePort: port,
            locationObject: child.location
        });
    }
    private onMessage(evt:MessageEvent) {
        let data = evt.data;
        this.triggerCallback(data.type, data.data, evt.source);
    }
    private triggerCallback<T>(type:number, data:T, source:Window) {
        let callback = this.typeCallbackMap[type];
        if (callback) {
            callback(data, source);
        }
    }
    on<T>(type:number, callback:TMessageHubCallback<T>):void {
        if (!TypeGuards.isUndef(this.typeCallbackMap[type])) {
            log.throwMessage('Tried to re-assign a callback for an event type');
        }
        this.typeCallbackMap[type] = callback;
    }
    trigger<T>(type:number, data:T, target:Window, transferList?:any[]):void {
        if (!this.supported) {
            // if WeakMap is not supported, this method will only work when
            // the target is the same browsing context.
            if (target === this.$window) {
                this.triggerCallback(type, data, this.$window);
            }
            return;
        }
        let port:MessagePort;
        if (target === this.parent) {
            port = this.parentPort;
        } else {
            port = this.framePortMap.get(target).messagePort;
        }
        if (!port) { return; }
        let msgData = {
            type: type,
            data: data
        };
        port.postMessage(msgData, transferList);
    }
}
