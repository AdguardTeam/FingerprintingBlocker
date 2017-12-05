import IStorage from '../../../storage/IStorage'
import GlobalSettingsStorage from '../../../storage/GlobalSettingsStorage'
import DomainSettingsStorage from '../../../storage/DomainSettingsStorage'
import Settings from './Settings'
import TypeGuards from '../../../shared/TypeGuards'

const h = preact.h;
const Component = preact.Component;

const reDomain = /^\?d\=([^&]+)$/;
function getDomainFromUrlQueryParam():string {
    let match = reDomain.exec(location.search);
    if (match) { return match[1]; }
}

interface IAppState {
    currentDomain:string
}

export default class App extends Component<any, IAppState> {
    private readonly globalStorage:GlobalSettingsStorage
    constructor(props) {
        super(props);
        let domain = getDomainFromUrlQueryParam();
        if (!domain) { domain = Settings.DEFAULT_SETTINGS_LABEL }
        this.state = {
            currentDomain: domain
        }
        this.globalStorage = new GlobalSettingsStorage().init();
        this.onDomainChange = this.onDomainChange.bind(this);
    }
    private onDomainChange(domain:string) {
        if (domain) {
            this.setState({
                currentDomain: domain
            });
        }
    }
    render() {
        const domain = this.state.currentDomain;
        const currentStorage = domain === Settings.DEFAULT_SETTINGS_LABEL ? this.globalStorage : this.globalStorage.getDomainStorage(domain);
        return (
            <Settings
                storage={currentStorage}
                onDomainChange={this.onDomainChange}
            />
        );
    }
}
