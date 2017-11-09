import StorageProvider from './storage/StorageProvider';
import Notifier from './notifier/Notifier';
import SharedObjectProvider from './proxy/SharedObjectProvider';
import ProxyService from './proxy/ProxyService';

import InterContextMessageHub from './messaging/InterContextMessageHub';

import CanvasProcessor from './wrapper/canvas/CanvasProcessor';
import CanvasApiWrapper from './wrapper/canvas/CanvasApiWrapper';

import AlertController from './ui/alerts/AlertController';

const window = unsafeWindow.window;
const KEY = Math.random().toString(36).substr(2);

const storage           = new StorageProvider();

const canvasProcessor   = new CanvasProcessor(storage);

const messageHub        = new InterContextMessageHub(window);
const alertController   = new AlertController(storage);
const notifier          = new Notifier(messageHub, storage, alertController);

function main (window:Window) {
    const sharedObjectProvider  = new SharedObjectProvider(window, KEY, main);
    const proxyService          = new ProxyService(false, sharedObjectProvider);

    sharedObjectProvider.initialize(proxyService);

    new InterContextMessageHub(window);

    const canvasApiWrapper      = new CanvasApiWrapper(proxyService, storage, canvasProcessor, notifier);
    
    canvasApiWrapper.$apply(window);
}

main(window);
