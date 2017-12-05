import { ICommonState } from './Alert'
import RadioInputGroup from '../../elements/RadioInputGroup'
import BlockEvent, { Action, getApiName } from '../../../event/BlockEvent'
import parseStack from '../../../stack/StackParseService'
import * as options from '../../options/radio_input_options'
import { bind, trustedEventListener } from '../../utils/event_listener_decorators'
import IStorage from '../../../storage/IStorage';

const h = preact.h;
const Component = preact.Component;

interface IDetailsProps extends ICommonState {
    storage:IStorage
    latestEvent:BlockEvent
    toPage(index:number):void
    fetchStorageUpdate():void
}

export default class Details extends Component<IDetailsProps, never> {
    constructor(props) {
        super(props);
        this.onActionChange = bind.call(this.onActionChange, this);
        this.onResetStatisticsClick = trustedEventListener(this.onResetStatisticsClick, this);
        this.onBackClick = trustedEventListener(this.onBackClick, this);
    }
    private onActionChange(action:Action) {
        this.props.storage.setAction(action);
        this.props.fetchStorageUpdate();
    }
    private onResetStatisticsClick() {
        this.props.storage.resetStatistics();
        this.props.fetchStorageUpdate();
    }
    private onBackClick() {
        this.props.toPage(0);
    }
    render(props:IDetailsProps) {
        const domain = props.storage.domain;
        const parseResult = parseStack(props.latestEvent.stack);
        const currentStats = props.storage.getCurrentStat();
        const statHasCanvas = currentStats.canvasBlockCount > 0;
        const statHasAudio = currentStats.audioBlockCount > 0;
        return (
            <div class="popup__text">
                <div class="popup__row">
                    {
                        statHasCanvas && <div>
                            <div class="popup__count popup__count--canvas">{currentStats.canvasBlockCount}</div>
                            Canvas fingerprinting
                        </div>
                    }
                    {
                        statHasAudio && <div>
                            <div class="popup__count popup__count--audio">{currentStats.audioBlockCount}</div>
                            Audiocontext fingerprinting
                        </div>
                    }
                    {
                        (statHasCanvas || statHasAudio) ?
                        <div class="popup__label">
                            from {domain}
                        </div> :
                        <div class="popup__label">
                            No fingerprinting attempts from {domain}
                        </div>
                    }
                </div>
                <div class="popup__row">
                    <div>
                        <div class="popup__label popup__label-inline">
                            Latest event:
                        </div>
                        <div class="popup__label-detail">
                            {getApiName(props.latestEvent.api, this.props.latestEvent.type)}
                        </div>
                    </div>
                    <div>
                        <div class="popup__label popup__label-inline">
                            Called from a file:
                        </div>
                        <div class="popup__label-detail">
                            {parseResult.callingFile}
                        </div>
                    </div>
                    <div>
                        <div class="popup__label">
                            Calling stack:
                        </div>
                        <textarea class="popup__detail-textarea">{parseResult.raw}</textarea>
                    </div>
                </div>
                <div class="popup__row">
                    <div>
                        Choose action:
                    </div>
                    <RadioInputGroup
                        options={options.ACTION_OPTIONS}
                        selected={props.action}
                        onRadioInputClick={this.onActionChange}
                    />
                </div>
                <div class="popup__row">
                    <a href="" class="popup__link popup__link--action popup__link--log">
                        Trigger log
                    </a>
                    <a href="" class="popup__link popup__link--action popup__link--reset" onClick={this.onResetStatisticsClick}>
                        Reset statatistics
                    </a>
                    <a href="" class="popup__link popup__link--action" onClick={this.onBackClick}>
                        Back...
                    </a>
                </div>
            </div>
        );
    }
}