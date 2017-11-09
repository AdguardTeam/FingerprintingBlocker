import INotifier from './INotifier';
import IStorageProvider from '../storage/IStorageProvider';
import IAlertData from '../ui/alerts/IAlertData';
import IAlertController from '../ui/alerts/IAlertController';
import IInterContextMessageHub from '../messaging/IInterContextMessageHub';

import { getSafeNonEmptyParent } from '../shared/dom';

import AlertData from '../ui/alerts/AlertData';

import TBlockEvent from '../event/BlockEvent';

export default class Notifier implements INotifier {
    private onMessage:(data:IAlertData)=>void
    constructor(
        private messageHub:IInterContextMessageHub,
        private storage:IStorageProvider,
        alertController?:IAlertController
    ) {
        if (messageHub.isTop) {
            this.onMessage = (data) => {
                let stat = this.storage.getCurrentStat();
                alertController.createOrUpdateAlert(data.domain, data.blockEvent, stat);
            }
        } else {
            // Pass the message to the top.
            this.onMessage = (data) => {
                messageHub.trigger<IAlertData>(0, data, messageHub.parent);
            };
        }
        messageHub.on<IAlertData>(0, this.onMessage);
    }
    onBlocked(evt:TBlockEvent) {
        this.storage.appendEvent(evt);
        if (this.storage.notify) {
            // produces AlertData interface.    
            let alertData = new AlertData(location.hostname, evt);
            this.onMessage(alertData);
        }
    }
    
}
