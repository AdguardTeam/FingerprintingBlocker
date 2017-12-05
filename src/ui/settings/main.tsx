import GlobalSettingsStorage from '../../storage/GlobalSettingsStorage'
import App from './components/App'
import Settings from './components/Settings'

if (typeof GM_getValue !== 'undefined') {
    const render = preact.render;
    const h = preact.h;
    
    render(
        <App/>,
        document.body
    );
}

