import { h, Component } from '../../preact'
import IStorage, { IDomainSettingsStorage } from '../../../storage/IStorage'
import TBlockEvent, { Action } from '../../../notifier/BlockEvent'
import IStats from '../../../storage/IStats'
import FirstTimeNotification from './FirstTimeNotification'
import Collapsed from './Collapsed'
import SaveSuccess from './SaveSuccess'
import Details from './Details'
import TriggerLogView from './TriggerLogView'
import TypeGuards from '../../../shared/TypeGuards'
import DomainSettingsStorage from '../../../storage/DomainSettingsStorage'
import GlobalSettingsStorage from '../../../storage/GlobalSettingsStorage'
import { bind, trustedEventListener } from '../../utils/event_listener_decorators'
import Pages from './PagesEnum'

export interface ICommonState {
    action:Action
    notify:boolean
    latestEvent:TBlockEvent
}

interface IAlertProps {
    storage:IDomainSettingsStorage
    onClose:()=>void
    onUpdate:()=>void
}

interface IAlertState extends ICommonState {
    currentPage:Pages
}

export default class Alert extends Component<IAlertProps, IAlertState> {
    static readonly STYLE = "RESOURCE:ALERT_STYLE";
    constructor(props:IAlertProps) {
        super(props);
        const storage = props.storage;
        const pageToShow = storage.getAnythingIsModified() ? Pages.COLLAPSED : Pages.FIRST_TIME;
        this.state = {
            action: storage.getAction(),
            notify: storage.getNotify(),
            latestEvent: null,
            currentPage: pageToShow
        }
        this.toPage = bind.call(this.toPage, this);
        this.fetchStorageUpdate();
        this.fetchStorageUpdate = bind.call(this.fetchStorageUpdate, this);
    }
    private fetchStorageUpdate() {
        const storage = this.props.storage;
        this.setState({
            action: storage.getAction(),
            notify: storage.getNotify()
        });
    }
    /**
     * Navigates the alert to a different page(state).
     * If an optional argument 
     */
    private toPage(index:Pages, timeout?:number):void {
        if (!TypeGuards.isUndef(this.toPageTimer)) {
            clearTimeout(this.toPageTimer);
            this.toPageTimer = undefined;
        }
        if (timeout) {
            this.toPageTimer = setTimeout(this.toPage, timeout, index);
            // `this.toPage` is already bound to `this` in the constructor
        } else {
            this.setState({
                currentPage: index
            });
        }
    }
    private toPageTimer:number

    // Contains a logic for switching component according to the current page(state).
    private renderMainPane() {
        // Passing props one by one in order to avoid using object rest operator
        // which will be converted to Object.assign, which requires a polyfill.
        // This also reduces a number of property copies.
        const storage = this.props.storage;
        const latestEvent = this.state.latestEvent;
        const currentAction = this.state.action;
        const currentNotify = this.state.notify;
        const toPage = this.toPage;
        const fetchStorageUpdate = this.fetchStorageUpdate;
        const onUpdate = this.props.onUpdate;

        const currentPage = this.state.currentPage

        switch (currentPage) {
            case Pages.FIRST_TIME:
                return <FirstTimeNotification
                    storage={storage}
                    toPage={toPage}
                    fetchStorageUpdate={fetchStorageUpdate}
                />
            case Pages.COLLAPSED:
                return <Collapsed
                    latestEvent={latestEvent}
                    toPage={toPage}
                />
            case Pages.SAVE_SUCCESS:
                return <SaveSuccess
                    action={currentAction}
                    toPage={toPage}
                />
            case Pages.DETAILS:
                return <Details
                    storage={storage}
                    action={currentAction}
                    notify={currentNotify}
                    latestEvent={latestEvent}
                    toPage={toPage}
                    fetchStorageUpdate={fetchStorageUpdate}
                    onUpdate={onUpdate}
                />
            case Pages.TRIGGER_LOG:
                return <TriggerLogView
                    storage={storage}
                    toPage={toPage}
                />
        }
    }
    componentDidMount() {
        this.props.onUpdate();
    }
    componentDidUpdate() {
        this.props.onUpdate();
    }
    componentWillUnmount() {
        if (!TypeGuards.isUndef(this.toPageTimer)) {
            clearTimeout(this.toPageTimer);
            this.toPageTimer = undefined;
        }
    }
    public rootNode:Element
    render(props:IAlertProps, state:IAlertState) {
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
