import { h, Component } from '../../preact'
import Pages from './PagesEnum'
import { trustedEventListener } from '../../utils/event_listener_decorators'
import { Action } from '../../../event/BlockEvent'
import { getMessage } from '../../localization'

interface ISaveSuccessProps {
    action:Action
    toPage(index:number, timeout?:number):void
}

export default class SaveSuccess extends Component<ISaveSuccessProps, any> {
    constructor(props:ISaveSuccessProps) {
        super(props);
        this.onDetailsClick = trustedEventListener(this.onDetailsClick, this);
    }
    private onDetailsClick() {
        this.props.toPage(Pages.DETAILS);
    }
    private static actionName = [
        getMessage("allow"),
        getMessage("fake"),
        getMessage("block")
    ]
    private static appliedActionText = [
        getMessage("popup.allow_confirm"),
        getMessage("popup.fake_confirm"),
        getMessage("popup.block_confirm")
    ]
    render(props:ISaveSuccessProps) {
        return (
            <div class="popup__text">
                <div>
                    <p>{getMessage("popup.applied_action")}<em>{SaveSuccess.actionName[props.action]}</em></p>
                    <p>{SaveSuccess.appliedActionText[props.action]}</p>
                </div>
                <a href="" class="popup__link" onClick={this.onDetailsClick}>
                    {getMessage("popup.details")}
                </a>
            </div>
        );
    }
}
