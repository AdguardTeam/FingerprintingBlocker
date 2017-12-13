import GlobalSettingsStorage from './storage/GlobalSettingsStorage';
import DomainSettingsStorage from './storage/DomainSettingsStorage';

import Notifier from './notifier/Notifier';
import SharedObjectProvider from './proxy/SharedObjectProvider';
import ProxyService from './proxy/ProxyService';
import InterContextMessageHub from './messaging/InterContextMessageHub';
import CanvasProcessor from './wrapper/canvas/CanvasProcessor';
import CanvasApiWrapper from './wrapper/canvas/CanvasApiWrapper';

import AlertController from './ui/alerts/controller/AlertController';

const window = unsafeWindow.window;

const globalSettings = new GlobalSettingsStorage().init();
const domainSettings = globalSettings.getDomainStorage(location.hostname).init();

const sessionKey = Math.random().toString(36).substr(2);
const globalKey = globalSettings.globalKey;

// `globalKey` is used to indicate that the userscript has been run
// from the parent context which has the same origin.
// See SharedObjectProvider implementation.
if (!window.hasOwnProperty(globalKey)) {
    const canvasProcessor   = new CanvasProcessor(domainSettings, window);
    const messageHub        = new InterContextMessageHub(window);
    const alertController   = new AlertController(globalSettings);
    const notifier          = new Notifier(messageHub, domainSettings, alertController);

    const main = (window:Window) => {
        const sharedObjectProvider  = new SharedObjectProvider(window, inIframe, sessionKey, globalKey);
        const proxyService          = new ProxyService(false, sharedObjectProvider);
        sharedObjectProvider.initialize(proxyService);
        const canvasApiWrapper      = new CanvasApiWrapper(proxyService, domainSettings, canvasProcessor, notifier);
        canvasApiWrapper.$apply(window);
    }

    const inIframe = (window:Window) => {
        main(window);
        new InterContextMessageHub(window, messageHub);
    }

    main(window);
} else {
    delete window[globalKey];
}

if (location.href === 'https://adguardteam.github.io/FingerprintingBlocker/settings.html') {
    window['GM_getValue'] = GM_getValue;
    window['GM_setValue'] = GM_setValue;
    window['GM_listValues'] = GM_listValues;
    window['preact'] = preact;
}
