import GlobalSettingsStorage from './storage/GlobalSettingsStorage';
import DomainSettingsStorage from './storage/DomainSettingsStorage';
import ProxyService from './proxy/ProxyService';
import ChildContextInjector from './proxy/ChildContextInjector';
import Notifier from './notifier/Notifier';
import InterContextMessageHub from './messaging/InterContextMessageHub';
import CanvasProcessor from './wrapper/canvas/processor/CanvasProcessor';
import CanvasModeTracker from './wrapper/canvas/mode_tracker/CanvasModeTracker';
import AudioProcessor from './wrapper/audio/processor/AudioProcessor';
import AudioBufferCache from './wrapper/audio/buffer_cache/AudioBufferCache';
import ApiWrapper from './wrapper/ApiWrapper';
import AlertController from './ui/alerts/controller/AlertController';

const window = unsafeWindow.window;

const globalSettings = new GlobalSettingsStorage().init();
const domainSettings = globalSettings.getDomainStorage(location.hostname);

const globalKey = globalSettings.globalKey;

// globalKey is used to indicate that the userscript has been run
// from the parent context which has the same origin.
// See ChildContextInjector implementation.
if (!window.hasOwnProperty(globalKey)) {
    const proxyService      = new ProxyService();
    const injector          = new ChildContextInjector(window, proxyService, globalKey);
    const messageHub        = new InterContextMessageHub(window);
    const alertController   = new AlertController(globalSettings);
    const notifier          = new Notifier(messageHub, domainSettings, alertController);

    const canvasProcessor   = new CanvasProcessor(domainSettings, window);
    const canvasModeTracker = new CanvasModeTracker(proxyService);
    const audioProcessor    = new AudioProcessor(domainSettings, window);
    const audioBufferCache  = new AudioBufferCache(proxyService);

    const apiWrapper        = new ApiWrapper(proxyService, domainSettings, notifier, canvasProcessor, canvasModeTracker, audioProcessor, audioBufferCache);

    const main = (window:Window) => {
        proxyService.$apply(window);
        apiWrapper.$apply(window);
    };

    const inIframe = (window:Window) => {
        main(window);
        // Establishes a bridging message channel,
        // won't directly assign callbacks to this instance.
        new InterContextMessageHub(window, messageHub);
    };

    injector.registerCallback(inIframe);

    main(window);
} else {
    delete window[globalKey];
}

// Expose for the settings page.
if (location.href === 'https://adguardteam.github.io/FingerprintingBlocker/settings.html') {
    window['GM_getValue'] = GM_getValue;
    window['GM_setValue'] = GM_setValue;
    window['GM_listValues'] = GM_listValues;
    window['preact'] = preact;
}
