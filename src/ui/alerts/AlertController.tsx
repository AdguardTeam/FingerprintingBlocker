import IAlertController from './IAlertController';
import IStorageProvider from '../../storage/IStorageProvider';
import TBlockEvent from '../../event/BlockEvent';
import IStats from '../../storage/IStats';
import Alert from './Alert';

const h = preact.h;
const Component = preact.Component;
const render = preact.render;

const px = 'px';

export default class AlertController implements IAlertController {
    private iframe:HTMLIFrameElement

    private alertInstance:Alert
    
    private static readonly STYLE_CONST = {
        bottom_offset: 10,
        right_offset: 10,
        height: 72,
        width: 500,
        // just a stub
        detail_height: 500,
        detail_width: 500,
    };

    private static readonly BASE_IFRAME_STYLE = {
        "position": "fixed",
        "right": AlertController.STYLE_CONST.right_offset + px,
        "bottom": AlertController.STYLE_CONST.bottom_offset + px,
        "border": "none",
        "opacity": "1",
        "z-index": String(-1 - (1 << 31)),
    };
    
    constructor(
        private storage:IStorageProvider
    ) { }

    private pendingDomain:string
    private pendingEvent:TBlockEvent
    private pendingStat:IStats

    createOrUpdateAlert(domain:string, event:TBlockEvent, stat:IStats):void {
        if (this.alertInstance !== undefined) {
            if (this.alertInstance.props.domain !== domain) { return; }
            this.alertInstance.setState({
                latestEvent: event,
                currentStats: stat
            });
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
                render(
                    <Alert
                        domain={domain}
                        storage={this.storage}
                        onClose={() => { this.destroy(); }}
                        ref={(inst) => { this.alertInstance  = inst; }}
                        onUpdate={() => { this.updateIframeDimension() }}
                    />,
                    doc.body
                );
                this.alertInstance.setState({
                    latestEvent: this.pendingEvent,
                    currentStats: this.pendingStat,
                    currentPane: 0
                });
                this.pendingDomain = undefined;
                this.pendingEvent = undefined;
                this.pendingStat = undefined;
                // Without this, the background of the iframe will be white in IE11
                doc.body.setAttribute('style', 'background-color:transparent;');
            });

            for (let prop in AlertController.BASE_IFRAME_STYLE) {
                iframe.style[prop] = AlertController.BASE_IFRAME_STYLE[prop];
            }

            document.documentElement.appendChild(iframe);
        }
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
            this.iframe.style['height'] = height + px;
            this.iframe.style['width'] = width + px;
        }
    }

    private destroy():void {
        document.documentElement.removeChild(this.iframe);
        this.iframe = undefined;
        this.alertInstance = undefined;
    }

    private static readonly TIMEOUT = 1005000;
    private timer:number

    private scheduleDestroy():void {
        let currentPane = this.alertInstance.state.currentPane;
        switch (currentPane) {
            case 0:
                if (typeof this.timer === 'undefined') {
                    this.timer = setTimeout(() => {
                        this.destroy();
                    }, AlertController.TIMEOUT);
                }
                break;
            case 1:
                if (typeof this.timer === 'undefined') {
                    clearTimeout(this.timer);
                }
                break;
        }
    }

}
