import StorageProvider from './storage/StorageProvider';
import Notifier from './notifier/Notifier';
import SharedObjectProvider from './proxy/SharedObjectProvider';
import ProxyService from './proxy/ProxyService';

import InterContextMessageHub from './messaging/InterContextMessageHub';

import CanvasProcessor from './wrapper/canvas/CanvasProcessor';
import CanvasApiWrapper from './wrapper/canvas/CanvasApiWrapper';

import AlertController from './ui/alerts/AlertController';

const window = unsafeWindow.window;

const storage       = new StorageProvider();

const sessionKey = Math.random().toString(36).substr(2);
const globalKey = storage.globalKey;

/**
 * `globalKey` is used to indicate that the userscript has been run
 * from the parent context which has the same origin.
 * See SharedObjectProvider implementation.
 */
if (!window.hasOwnProperty(globalKey)) {
    const canvasProcessor   = new CanvasProcessor(storage, window);
    const messageHub        = new InterContextMessageHub(window);
    const alertController   = new AlertController(storage);
    const notifier          = new Notifier(messageHub, storage, alertController);

    const main = (window:Window) => {
        const sharedObjectProvider  = new SharedObjectProvider(window, inIframe, sessionKey, globalKey);
        const proxyService          = new ProxyService(false, sharedObjectProvider);
        sharedObjectProvider.initialize(proxyService);
        const canvasApiWrapper      = new CanvasApiWrapper(proxyService, storage, canvasProcessor, notifier);
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
