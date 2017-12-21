import { h, Component } from '../../preact'
import { ICommonState } from "./Alert";
import TBlockEvent, { Action } from '../../../notifier/BlockEvent'
import Pages from './PagesEnum'
import { trustedEventListener } from "../../utils/event_listener_decorators";
import { getMessage } from '../../localization'

interface ICollapsedProps {
    latestEvent:TBlockEvent
    toPage(index:number):void
}

export default class Collapsed extends Component<ICollapsedProps, any> {
    constructor(props) {
        super(props);
        this.onExpandClick = trustedEventListener(this.onExpandClick, this);
    }
    private getMsg() {
        switch (this.props.latestEvent.action) {
            case Action.ALLOW:
                return getMessage("popup.detected");
            case Action.FAKE:
                return getMessage("popup.faked");
            case Action.BLOCK:
                return getMessage("popup.blocked");
        }
    }
    private onExpandClick(evt:UIEvent) {
        this.props.toPage(Pages.DETAILS);
    }
    render(props:ICollapsedProps) {
        if (!props.latestEvent) { return null; }
        return (
            <div class="popup__text">
                <div class="popup__text--min">
                    <div class="popup__text-blocked">
                        {getMessage("popup.fp_attempt")}
                    </div>
                    <div class="popup__actions">
                        <a href="" class="popup__link popup__link--expand" onClick={this.onExpandClick}>
                            {this.getMsg()}
                        </a>
                    </div>
                </div>
            </div>
        )
    }
}