import IAlertController from './IAlertController'
import IStorage from '../../../storage/IStorage'
import TBlockEvent from '../../../event/BlockEvent'
import IStats from '../../../storage/IStats'
import { IAlertData } from '../message'
import Alert from '../components/Alert'
import * as log from '../../../shared/log'
import IGlobalSettingsStorage from '../../../storage/IGlobalSettingsStorage';

const h = preact.h;
const Component = preact.Component;
const render = preact.render;

const px = 'px';

export default class AlertController implements IAlertController {
    private static readonly STYLE_CONST = {
        bottom_offset: 10,
        right_offset: 10
    };
    private static readonly BASE_IFRAME_STYLE = {
        "position": "fixed",
        "bottom": AlertController.STYLE_CONST.bottom_offset + px,
        "border": "none",
        "z-index": String(-1 - (1 << 31)),
    };
    private static readonly HIDDEN_IFRAME_STYLE = {
        "right": "-100%",
        "opacity": "0",
        "transform": "translate3d(0,0,0)", // GPU acceleration
        "transition": "right .4s, opacity .4s",
        "transitionTimingFunction": "cubic-bezier(.25,.8,.25,1),cubic-bezier(.25,.8,.25,1)"
    }
    private static readonly VISIBLE_IFRAME_STYLE = {
        "right": AlertController.STYLE_CONST.right_offset + px,
        "opacity": "1"
    }
    private iframe:HTMLIFrameElement
    private alertInstance:Alert
    constructor(
        private storage:IGlobalSettingsStorage
    ) { }
    private pendingDomain:string
    private pendingEvent:TBlockEvent
    private pendingStat:IStats
    private lastUpdate:number
    createOrUpdateAlert(alertData:IAlertData, stat:IStats):void {
        log.print(`AlertController: creating alert`);
        const domain = alertData.domain;
        const event = alertData.blockEvent;
        if (this.alertInstance !== undefined) {
            if (this.alertInstance.props.storage.domain !== domain) { return; }
            this.alertInstance.setState({
                latestEvent: event
            });
            this.scheduleDestroy();
        } else if (this.pendingDomain) {
            if (this.pendingDomain !== domain) { return; }
            this.pendingEvent = event;
            this.pendingStat = stat;
        } else {
            this.pendingDomain = domain;
            this.pendingEvent = event;
            this.pendingStat = stat;
            let iframe = this.iframe = document.createElement('iframe');
            iframe.addEventListener('load', () => {
                let doc = iframe.contentDocument;
                this.appendStyle(doc);
                const storage = this.storage.getDomainStorage(domain);
                render(
                    <Alert
                        storage={storage}
                        onClose={() => { this.destroy(); }}
                        ref={(inst) => { this.alertInstance  = inst; }}
                        onUpdate={() => {
                            this.updateIframeDimension();
                        }}
                    />,
                    doc.body
                );
                this.alertInstance.setState({
                    latestEvent: this.pendingEvent,
                    currentPage: 0
                });
                this.pendingDomain = undefined;
                this.pendingEvent = undefined;
                this.pendingStat = undefined;
                // Attaches event listeners
                const onInteraction = (evt:MouseEvent) => {
                    if (evt.isTrusted) {
                        this.timerPrevented = true;
                        this.cancelDestroy();
                        doc.removeEventListener('mousedown', onInteraction);
                    }
                }
                doc.addEventListener('mousedown', onInteraction, true);
                doc.addEventListener('mouseover', (evt) => {
                    evt.isTrusted && this.onMouseOver();
                }, true);
                doc.addEventListener('mouseout', (evt) => {
                    evt.isTrusted && this.onMouseOut();
                }, true)
                this.scheduleDestroy();
                // Without this, the background of the iframe will be white in IE11
                doc.body.setAttribute('style', 'background-color:transparent;');
            });
            // Applies iframe styles
            applyStyle(iframe, AlertController.BASE_IFRAME_STYLE);
            applyStyle(iframe, AlertController.HIDDEN_IFRAME_STYLE);
            requestAnimationFrame(() => {
                applyStyle(iframe, AlertController.VISIBLE_IFRAME_STYLE);
            });
            // Appends the iframe
            document.documentElement.appendChild(iframe);
        }
        this.lastUpdate = Date.now();
    }
    private appendStyle(doc:Document):void {
        let style = doc.createElement('style');
        style.appendChild(doc.createTextNode(Alert.STYLE));
        doc.head.appendChild(style);
    }

    private updateIframeDimension():void {
        const el = this.alertInstance.rootNode;
        if (el) {
            let height = el.scrollHeight + 2; // border width
            let width = el.scrollWidth + 2;
            this.iframe.style['height'] = height + 5 /* shadow */ + 2 /* border */ + px;
            this.iframe.style['width'] = width + 2 /* shadow */ + 2 /* border */ + px;
        }
    }
    private destroy():void {
        let iframe = this.iframe;
        applyStyle(iframe, AlertController.HIDDEN_IFRAME_STYLE);
        setTimeout(() => {
            document.documentElement.removeChild(iframe);
        }, 400);
        this.iframe = undefined;
        this.alertInstance = undefined;
    }
    private static readonly TIMEOUT = 8000;
    private static readonly MIN_TIMEOUT = 1000;
    private timer:number
    private timerPrevented:boolean = false
    private scheduleDestroy():void {
        if (this.timerPrevented) { return; }
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.destroy();
        }, AlertController.TIMEOUT);
    }
    private cancelDestroy() {
        clearTimeout(this.timer);
        this.timer = undefined;
    }

    private onMouseOver() {
        if (!this.timerPrevented) {
            this.cancelDestroy();
        }
    }
    private onMouseOut() {
        if (!this.timerPrevented) {
            let pastDue = this.lastUpdate + AlertController.TIMEOUT - Date.now();
            let minTimeout = AlertController.MIN_TIMEOUT;
            let timeout = pastDue > minTimeout ? pastDue : minTimeout;
            this.timer = setTimeout(() => {
                this.destroy();
            }, timeout);
        }
    }
}

function applyStyle(element:HTMLElement, styleMap:stringmap<string>) {
    for (let styleProp in styleMap) {
        element.style[styleProp] = styleMap[styleProp];
    }
}
