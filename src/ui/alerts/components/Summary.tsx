import BlockEvent, { Action } from '../../../event/BlockEvent';
import IStats from '../../../storage/IStats';
import { ICommonState } from './Alert';
import { bind, trustedEventListener } from '../../utils/event_listener_decorators';
import IStorage from '../../../storage/IStorage';

const h = preact.h;
const Component = preact.Component;

interface ISummaryProps extends ICommonState {
    storage:IStorage
    latestEvent:BlockEvent
    toPage(index:number):void
    fetchStorageUpdate():void
}

export default class BlockSummary extends Component<ISummaryProps, any> {
    constructor(props) {
        super(props);
        this.onSilenceClick = trustedEventListener(this.onSilenceClick, this);
        this.onWhitelistClick = trustedEventListener(this.onWhitelistClick, this);
        this.onBlacklistClick = trustedEventListener(this.onBlacklistClick, this);
        this.onDetailsClick = trustedEventListener(this.onDetailsClick, this);
    }
    private onSilenceClick() {
        this.props.storage.setNotify(false);
        this.props.fetchStorageUpdate();
    }
    private onWhitelistClick() {
        this.props.storage.setAction(Action.ALLOW);
        this.props.fetchStorageUpdate();
    }
    private onBlacklistClick() {
        this.props.storage.setAction(Action.FAKE);
        this.props.fetchStorageUpdate();
    }
    private onDetailsClick() {
        this.props.toPage(1);
    }
    private getSummaryMessage():string {
        let latestEvent = this.props.latestEvent;
        switch (latestEvent.action) {
            case Action.ALLOW:
                return `Detected a possible fingerprinting attempt from `;
            case Action.BLOCK:
            case Action.FAKE:
                return `Blocked a possible fingerprinting attempt from `;
        }
    }
    render(props:ISummaryProps) {
        const domain = props.storage.domain;
        return (
            <div class="popup__text">
                {this.getSummaryMessage()}
                <a href={domain} class="popup__link popup__link--url">{domain}</a>
                <div class="popup__actions">
                    {
                        this.props.latestEvent.action === Action.ALLOW ?
                        <a href="" class="popup__link popup__link--action popup__link--whitelist" onClick={this.onBlacklistClick}>
                            Blacklist
                        </a> :
                        <a href="" class="popup__link popup__link--action popup__link--whitelist" onClick={this.onWhitelistClick}>
                            Whitelist
                        </a>
                    }
                    <a href="" class="popup__link popup__link--action popup__link--silence" onClick={this.onSilenceClick}>
                        Silence notification
                    </a>
                    <a href="" class="popup__link popup__link--action popup__link--details" onClick={this.onDetailsClick}>
                        Details..
                    </a>
                </div>
            </div>
        );
    }
}