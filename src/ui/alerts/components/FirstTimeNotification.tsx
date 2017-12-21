import { h, Component } from '../../preact'
import BlockEvent, { Action } from '../../../notifier/BlockEvent';
import IStats from '../../../storage/IStats';
import { ICommonState } from './Alert';
import { bind, trustedEventListener } from '../../utils/event_listener_decorators';
import IStorage from '../../../storage/IStorage';
import Pages from './PagesEnum'
import { getMessage } from '../../localization'

interface IFirstTimeNotificationProps {
    storage:IStorage
    toPage(index:number, timeout?:number):void
    fetchStorageUpdate():void
}

export default class FirstTimeNotification extends Component <IFirstTimeNotificationProps, any> {
    constructor(props) {
        super(props);
        this.onDetailsClick = trustedEventListener(this.onDetailsClick, this);
    }
    private actionChangerFactory(action:Action) {
        return trustedEventListener((evt) => {
            this.props.storage.setAction(action);
            this.props.fetchStorageUpdate();
            this.props.toPage(Pages.SAVE_SUCCESS);
            this.props.toPage(Pages.FIRST_TIME, 4000);
        }, this);
    }
    private onDetailsClick() {
        this.props.toPage(Pages.DETAILS);
    }
    render(props:IFirstTimeNotificationProps) {
        return (
            <div class="popup__text popup__text--summary">
                {getMessage("popup.detected_expl")}
                <div class="popup__actions">
                    <a href="" class="popup__link popup__link--action" onClick={this.actionChangerFactory(Action.ALLOW)}>
                        {getMessage("allow")}
                    </a>
                    <a href="" class="popup__link popup__link--action" onClick={this.actionChangerFactory(Action.BLOCK)}>
                        {getMessage("block")}
                    </a>
                    <a href="" class="popup__link popup__link--action" onClick={this.actionChangerFactory(Action.FAKE)}>
                        {getMessage("fake")}
                    </a>
                    <a href="" class="popup__link popup__link--action" onClick={this.onDetailsClick}>
                        {getMessage("popup.details")}
                    </a>
                </div>
            </div>
        )
    }
}
