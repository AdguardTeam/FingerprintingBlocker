

import IStorageProvider from '../../storage/IStorageProvider';
import BlockEvent, * as BlockEventTypes from '../../event/BlockEvent';

const h = preact.h;
const Component = preact.Component;

interface IBaseProps {
    domain:string
    storage:IStorageProvider
}

interface IPaneData {
    latestEvent?:BlockEvent

    currentAction:BlockEventTypes.Action
    currentNotificationSetting:boolean
    currentStats: {
        canvas:number
        audio:number
    }
}

interface IAlertProps extends IBaseProps {
    onClose():void
    onUpdate():void
}

/** todo change pane to page */
interface IPaneProps extends IBaseProps, IPaneData {
    toPage(index:number):void
    fetchStorageUpdate():void
}

interface IAlertStates extends IPaneData {
    currentPane?:number
}

function preventDefault(cb:func):(e:Event)=>void {
    return (e:Event) => {
        e.preventDefault();
        cb();
    };
}

export default class Alert extends Component<IAlertProps, IAlertStates> {
    constructor(props) {
        super(props);
        this.fetchStorageUpdate();
    }
    private fetchStorageUpdate():void {
        this.setState({
            currentAction: this.props.storage.action,
            currentNotificationSetting: this.props.storage.notify,
            currentStats: this.props.storage.getCurrentStat()
        });
    }
    private toPage(index:number):void {
        this.setState({
            currentPane: index
        });
    }
    private toPaneProp():IPaneProps {
        return {
            domain: this.props.domain,
            storage: this.props.storage,
            latestEvent: this.state.latestEvent,
            currentAction: this.state.currentAction,
            currentNotificationSetting: this.state.currentNotificationSetting,
            currentStats: this.state.currentStats,
            toPage: (index:number) => { this.toPage(index); },
            fetchStorageUpdate: () =>{ this.fetchStorageUpdate(); }
        };
    }
    componentDidMount() {
        this.props.onUpdate();
    }
    componentDidUpdate() {
        this.props.onUpdate();
    }
    private renderMainPane() {
        switch (this.state.currentPane) {
            case 0:
                return <BlockSummary {...this.toPaneProp()}/>
            case 1:
                return <Details {...this.toPaneProp()}/>
        }
    }

    public rootNode:Element;

    render () {
        return (
            <div>
                <div class="popup" ref={(el) => { this.rootNode = el; }}>
                    <div class="popup__logo"></div>
                    {this.renderMainPane()}
                </div>
                <button class="popup__close" onClick={() => { this.props.onClose(); }}></button>
            </div>
        );
    }

    static readonly STYLE = "RESOURCE:ALERT_STYLE";
}

class BlockSummary extends Component<IPaneProps, any> {
    private onActionChangeClick(action:BlockEventTypes.Action):void {
        this.props.storage.changeAction(action);
        this.props.fetchStorageUpdate();
    }
    private onSilenceClick():void {
        this.props.storage.silenceNotification();
        this.props.fetchStorageUpdate();
    }
    private getSummaryMessage():string {
        let latestEvent = this.props.latestEvent;
        switch (latestEvent.action) {
            case BlockEventTypes.Action.ALLOW:
                return `Possible fingerprinting attempt from `;
            case BlockEventTypes.Action.BLOCK:
                return `Blocked a possible fingerprinting attempt from `
            case BlockEventTypes.Action.FAKE:
                return `Faked a possible fingerprinting attempt from `
        }
    }
    render() {
        return (
            <div class="popup__text popup__text-summary">
                {this.getSummaryMessage()/* To be elaborated... */} 
                <a href={this.props.domain} class="popup__link popup__link--url">{this.props.domain}</a>
                <div class="popup__actions">
                    {
                        this.props.latestEvent.action === BlockEventTypes.Action.ALLOW ?
                        <a href="javascript:;" class="popup__link popup__link--action popup__link--whitelist" onClick={preventDefault(() => { this.onActionChangeClick(BlockEventTypes.Action.FAKE) })}>
                            Blacklist
                        </a> :
                        <a href="javascript:;" class="popup__link popup__link--action popup__link--whitelist" onClick={() => { this.onActionChangeClick(BlockEventTypes.Action.ALLOW); }}>
                            Whitelist
                        </a>
                    }
                    <a href="javascript:;" class="popup__link popup__link--action popup__link--silence" onClick={() => { this.onSilenceClick(); }}>
                        Silence notification
                    </a>
                    <a href="javascript:;" class="popup__link popup__link--action popup__link--details" onClick={()=> { this.props.toPage(1); }}>
                        Details..
                    </a>
                </div>
            </div>
        );
    }
}

import parseStack from '../../stack/StackParseService';

class Details extends Component<IPaneProps, never> {
    onActionChangeClick(action:BlockEventTypes.Action) {
        return () => {
            this.props.storage.changeAction(action);
            this.props.fetchStorageUpdate();
        };
    }
    render(){
        const parseResult = parseStack(this.props.latestEvent.stack);
        
        const statHasCanvas = this.props.currentStats.canvas > 0;
        const statHasAudio = this.props.currentStats.audio > 0;

        return (
            <div class="popup__text popup__text-detail">
                <div class="popup__row">
                    {
                        statHasCanvas && <div class="popup__text-canvas">
                            <div class="popup__count popup__count--canvas">{this.props.currentStats.canvas}</div>
                            Canvas fingerprinting
                        </div>
                    }
                    {
                        statHasAudio && <div class="popup__text-audio">
                            <div class="popup__count popup__count--audio">{this.props.currentStats.audio}</div>
                            Audiocontext fingerprinting
                        </div>
                    }
                    {
                        (statHasCanvas || statHasAudio) ?
                        <div class="popup__label">
                            from {this.props.domain}
                        </div> :
                        <div class="popup__label">
                            No fingerprinting attempts from {this.props.domain}
                        </div>
                    }
                </div>
                <div class="popup__row">
                    <div class="popup__text-event">
                        <div class="popup__label popup__label-inline">
                            Latest event:
                        </div>
                        <div class="popup__label-detail">
                            {BlockEventTypes.getApiName(this.props.latestEvent.api, this.props.latestEvent.type)}
                        </div>
                    </div>
                    <div class="popup__text-file">
                        <div class="popup__label popup__label-inline">
                            Called from a file:
                        </div>
                        <div class="popup__label-detail">
                            {parseResult.callingFile}
                        </div>
                    </div>
                    <div class="popup__text-calling-stack">
                        <div class="popup__label">
                            Calling stack:
                        </div>
                        <textarea class="popup__detail-textarea">{parseResult.raw}</textarea>
                    </div>
                    <div class="">
                        <div class="popup__label popup__label-inline">
                            Requested image: 
                        </div>
                        <button class="popup__detail-button">
                            View
                        </button>
                    </div>
                </div>
                <div class="popup__row">
                    <div class="popup__text-action-label">
                        Choose action:
                    </div>
                    <div class="popup__text-radio">
                        <label>
                            <input type="radio" checked={this.props.currentAction === BlockEventTypes.Action.ALLOW} onClick={this.onActionChangeClick(BlockEventTypes.Action.ALLOW)}/>
                            <span>Allow</span>
                        </label>
                        <label>
                            <input type="radio" checked={this.props.currentAction === BlockEventTypes.Action.FAKE} onClick={this.onActionChangeClick(BlockEventTypes.Action.FAKE)}/>
                            <span>Fake</span>
                        </label>
                        <label>
                            <input type="radio" checked={this.props.currentAction === BlockEventTypes.Action.BLOCK} onClick={this.onActionChangeClick(BlockEventTypes.Action.BLOCK)}/>
                            <span>Block</span>
                        </label>
                    </div>
                </div>
                <div class="popup__row">
                    <a href="" class="popup__link popup__link--action popup__link--log">
                        Trigger log
                    </a>
                    <a href="" class="popup__link popup__link--action popup__link--reset" onClick={preventDefault(() => { this.props.storage.resetStatistics(); this.props.fetchStorageUpdate(); })}>
                        Reset statatistics
                    </a>
                    <a href="" class="popup__link popup__link--action" onClick={preventDefault(() => { this.props.toPage(0); })}>
                        Back...
                    </a>
                </div>
            </div>
        );
    }
}
