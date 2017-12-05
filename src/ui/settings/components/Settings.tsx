
import Select from '../../elements/Select'
import RadioInputGroup from '../../elements/RadioInputGroup'
import IStorage from '../../../storage/IStorage'
import BlockEvent, { Action } from '../../../event/BlockEvent';
import FakingModesEnum from '../../../storage/FakingModesEnum'
import * as radioInputOptions from '../../options/radio_input_options';

const h = preact.h;
const Component = preact.Component;

interface ISettingsProps {
    storage:IStorage
    onDomainChange:(domain:string)=>void
}

interface ISettingsState {
    domainOptions:string[]
}

export default class GlobalSettings extends Component<ISettingsProps, ISettingsState> {
    static readonly DEFAULT_SETTINGS_LABEL = "Default settings"
    constructor(props:ISettingsProps) {
        super(props);
        let domains = props.storage.enumerateDomains();
        domains.unshift(GlobalSettings.DEFAULT_SETTINGS_LABEL);
        this.state = {
            domainOptions: domains,
        };
        this.onActionChange = this.onActionChange.bind(this);
        this.onNotifyChange = this.onNotifyChange.bind(this);
        this.onConfirmChange = this.onConfirmChange.bind(this);
        this.onWhitelistedChange = this.onWhitelistedChange.bind(this);
        this.onFakingModechange = this.onFakingModechange.bind(this);
        this.onDomainSelectionChange = this.onDomainSelectionChange.bind(this);
    }
    private onActionChange(action:Action) {
        this.props.storage.setAction(action);
        this.setState({});
    }
    private onNotifyChange(notify:boolean) {
        this.props.storage.setNotify(notify);
        this.setState({});
    }
    private onConfirmChange(confirm:boolean) {
        this.props.storage.setConfirm(confirm);
        this.setState({});
    }
    private onWhitelistedChange(whitelisted:boolean) {
        this.props.storage.setWhitelisted(whitelisted);
        this.setState({});
    }
    private onFakingModechange(fakingMode:FakingModesEnum) {
        this.props.storage.setFakingmode(fakingMode);
        this.setState({});
    }
    private onDomainSelectionChange(value:string) {
        this.props.onDomainChange(value);
    }
    render(props:ISettingsProps, state:ISettingsState) {
        return (
            <div class="settings__root">
                <div>
                    Settings for:
                    <Select
                        initialValue={props.storage.domain || GlobalSettings.DEFAULT_SETTINGS_LABEL}
                        onChange={this.onDomainSelectionChange}
                        options={state.domainOptions}
                        calculateConfidence={(given:string, against:string) => {
                            return given.startsWith(against) ? 1 : 0;
                        }}
                        confidenceThreshold={1}
                        getCreateMessage={(input) => {
                            return `Create settings for a domain ${input}`;
                        }}
                    />
                </div>
                <div class="settings__table">
                    <div class="settings__row">
                        <div class="settings__label settings__col">
                            Action:
                        </div>
                        <div class="settings__col">
                            <RadioInputGroup
                                options={radioInputOptions.ACTION_OPTIONS}
                                selected={props.storage.action}
                                onRadioInputClick={this.onActionChange}
                            />
                        </div>
                    </div>
                    <div class="settings__row">
                        <div class="settings__label settings__col">
                            Notification
                        </div>
                        <div class="settings__col">
                            <RadioInputGroup
                                options={radioInputOptions.SHOW_OPTIONS}
                                selected={props.storage.notify}
                                onRadioInputClick={this.onNotifyChange}
                            />
                        </div>
                    </div>
                    <div class="settings__row">
                        <div class="settings__label settings__col">
                            Confirmation dialog
                        </div>
                        <div class="settings__col">
                            <RadioInputGroup
                                options={radioInputOptions.SHOW_OPTIONS}
                                selected={props.storage.confirm}
                                onRadioInputClick={this.onConfirmChange}
                            />
                        </div>
                    </div>
                    <div class="settings__row">
                        <div class="settings__label settings__col">
                        Whitelist
                        </div>
                        <div class="settings__col">
                            <RadioInputGroup
                                options={radioInputOptions.WHITELIST_OPTIONS}
                                selected={props.storage.whitelisted}
                                onRadioInputClick={this.onWhitelistedChange}
                            />
                        </div>
                    </div>
                    <div class="settings__row">
                        <div class="settings__label settings__col">
                            Salt renewal policy
                        </div>
                        <div class="settings__col">
                            <RadioInputGroup
                                options={radioInputOptions.FAKING_MODE_OPTIONS}
                                selected={props.storage.fakingMode}
                                onRadioInputClick={this.onFakingModechange}
                            />
                        </div>
                    </div>
                    <div class="settings__row">
                        <div class="settings__label settings__col">
                            update Interval
                        </div>
                        <div class="settings__col">
                            <input type="text" value={String(props.storage.updateInterval)}/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}