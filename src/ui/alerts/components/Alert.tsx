
import IStorage from '../../../storage/IStorage'
import TBlockEvent, { Action } from '../../../event/BlockEvent'
import IStats from '../../../storage/IStats'
import BlockSummary from './Summary'
import Details from './Details'
import TypeGuards from '../../../shared/TypeGuards'
import DomainSettingsStorage from '../../../storage/DomainSettingsStorage'
import GlobalSettingsStorage from '../../../storage/GlobalSettingsStorage'
import { bind } from '../../utils/event_listener_decorators'

const h = preact.h;
const Component = preact.Component;

export interface ICommonState {
    action:Action
    notify:boolean

    latestEvent:TBlockEvent
}

interface IAlertProps {
    storage:IStorage
    onClose:()=>void
    onUpdate:()=>void
}

interface IAlertState extends ICommonState {
    currentPage:number
}

export default class Alert extends Component<IAlertProps, IAlertState> {
    static readonly STYLE = "RESOURCE:ALERT_STYLE";
    constructor(props) {
        super(props);
        this.toPage = bind.call(this.toPage, this);
        this.fetchStorageUpdate();
        this.fetchStorageUpdate = bind.call(this.fetchStorageUpdate, this);
    }
    private fetchStorageUpdate() {
        const storage = this.props.storage;
        this.setState({
            action: storage.action,
            notify: storage.notify
        });
    }
    private toPage(index:number):void {
        this.setState({
            currentPage: index
        });
    }
    private renderMainPane() {
        // Passing props one by one in order to avoid using object rest operator
        // which will be converted to Object.assign, which requires a polyfill.
        // This also reduces a number of property copies.
        const storage = this.props.storage;
        const latestEvent = this.state.latestEvent;
        const currentAction = this.state.action;
        const currentNotificationSetting = this.state.notify;
        const toPage = this.toPage;
        const fetchStorageUpdate = this.fetchStorageUpdate;

        switch (this.state.currentPage) {
            case 0:
                return <BlockSummary
                    storage={storage}
                    latestEvent={latestEvent}
                    action={currentAction}
                    notify={currentNotificationSetting}
                    toPage={toPage}
                    fetchStorageUpdate={fetchStorageUpdate}
                />
            case 1:
                return <Details 
                    storage={storage}
                    latestEvent={latestEvent}
                    action={currentAction}
                    notify={currentNotificationSetting}
                    toPage={toPage}
                    fetchStorageUpdate={fetchStorageUpdate}
                />
        }
    }
    componentDidMount() {
        this.props.onUpdate();
    }
    componentDidUpdate() {
        this.props.onUpdate();
    }
    public rootNode:Element
    render(props:IAlertProps) {
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
}
