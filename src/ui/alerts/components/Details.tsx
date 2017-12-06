import { ICommonState } from './Alert'
import BlockEvent, { Action, getApiName } from '../../../event/BlockEvent'
import parseStack from '../../../stack/StackParseService'
import * as options from '../../options/radio_input_options'
import { bind, trustedEventListener } from '../../utils/event_listener_decorators'
import IStorage from '../../../storage/IStorage';
import Pages from './PagesEnum'
import { getMessage } from '../../localization'

const h = preact.h;
const Component = preact.Component;

interface IDetailsProps extends ICommonState {
    storage:IStorage
    toPage(index:number, timeout?:number):void
    fetchStorageUpdate():void
    onUpdate():void
}

interface IDetailsState {
    chosenAction:Action
    chosenNotify:boolean
}

export default class Details extends Component<IDetailsProps, IDetailsState> {
    constructor(props) {
        super(props);
        this.state = {
            chosenAction: props.action,
            chosenNotify: props.notify
        };
        this.onStatNumberClick = trustedEventListener(this.onStatNumberClick, this);
        this.onActionSelection = trustedEventListener(this.onActionSelection, this);
        this.onNotifyCheckboxClick = trustedEventListener(this.onNotifyCheckboxClick, this);
        this.onConfirm = trustedEventListener(this.onConfirm, this);
        this.onSave = trustedEventListener(this.onSave, this);
    }

    private onStatNumberClick(evt:UIEvent) {
        this.props.toPage(Pages.TRIGGER_LOG);
    }

    private onActionSelection(evt:UIEvent) {
        this.setState({
            chosenAction: parseInt((evt.currentTarget as HTMLSelectElement).value, 10)
        });
    }
    private onNotifyCheckboxClick(evt:UIEvent) {
        this.setState({
            chosenNotify: (evt.currentTarget as HTMLInputElement).checked
        });
    }
    private onConfirm(evt:UIEvent) {
        this.props.storage.setAction(this.state.chosenAction);
        this.props.storage.setNotify(this.state.chosenNotify);
        this.props.fetchStorageUpdate();
        this.onSave(evt);
    }
    private onSave(evt:UIEvent) {
        this.props.toPage(Pages.SAVE_SUCCESS);
        this.props.toPage(Pages.DETAILS, 5000);
    }
    private getActionExplanation(action:Action):string {
        switch (action) {
            case Action.ALLOW:
                return getMessage("popup.allow_expl");
            case Action.FAKE:
                return getMessage("popup.fake_expl");
            case Action.BLOCK:
                return getMessage("popup.block_expl");
        }
    }
    componentDidMount() {
        this.props.onUpdate();
    }
    componentDidUpdate() {
        this.props.onUpdate();
    }
    render(props:IDetailsProps, state:IDetailsState) {
        const domain = props.storage.domain;
        const parseResult = parseStack(props.latestEvent.stack);
        const currentStats = props.storage.getStats();
        const statHasCanvas = currentStats.canvasBlockCount > 0;
        const statHasAudio = currentStats.audioBlockCount > 0;
        
        return (
            <div class="popup__text">
                <div class="popup__text--domain">
                    {domain}
                </div>
                <div class="popup__text--paragraph">
                    {getMessage("popup.fp_attempt_detected")}
                    <a href="" class="popup__link" onClick={this.onStatNumberClick}>
                        {currentStats.canvasBlockCount + currentStats.audioBlockCount}
                    </a>
                </div>
                <div class="popup__row">
                    <div>
                        {getMessage("popup.choose_action")}
                    </div>
                    <select value={String(state.chosenAction)} onChange={this.onActionSelection}>
                        <option value={String(Action.ALLOW)}>
                            {getMessage("allow")}
                        </option>
                        <option value={String(Action.FAKE)}>
                            {getMessage("fake")}
                        </option>
                        <option value={String(Action.BLOCK)}>
                            {getMessage("block")}
                        </option>
                    </select>
                    <div class="popup__text--paragraph">
                        {this.getActionExplanation(state.chosenAction)}
                    </div>
                </div>
                <div class="popup__row">
                    <label>
                        <input type="checkbox" checked={state.chosenNotify}/>
                        {getMessage("popup.notify_about_attempts")}
                    </label>
                    <div class="popup__text--paragraph">
                        {getMessage("popup.notify_expl")}
                    </div>
                </div>
                <div>
                    <button class="popup__button" onClick={this.onConfirm}>
                        {getMessage("popup.confirm")}
                    </button>
                    <button class="popup__button" onClick={this.onSave}>
                        {getMessage("popup.cancel")}
                    </button>
                </div>
            </div>
        )
    }
}
