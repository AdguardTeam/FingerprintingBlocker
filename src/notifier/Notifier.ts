import INotifier from './INotifier';
import IStorageProvider from '../storage/IStorageProvider';
import IAlertData from '../ui/alerts/IAlertData';
import IAlertController from '../ui/alerts/IAlertController';
import IInterContextMessageHub, { TMessageHubCallback } from '../messaging/IInterContextMessageHub';

import AlertData from '../ui/alerts/AlertData';

import TBlockEvent from '../event/BlockEvent';

const enum NotifierMessageType {
    ALERT_DATA,
    CANVAS_REQUEST,
    CANVAS_IMAGE_DATA,
    FREE_CANVAS_REQUEST
}

export default class Notifier implements INotifier {
    private transferAlertData:TMessageHubCallback<IAlertData>

    constructor(
        private messageHub:IInterContextMessageHub,
        private storage:IStorageProvider,
        private alertController?:IAlertController
    ) {
        this.installAlertDataTransferrer();
    }

    onBlock(evt:TBlockEvent) {
        // this.latestCanvas = evt.data;
        // delete non-transferrable object
        delete evt.data;

        if (this.storage.notify) {
            // produces AlertData interface.
            let alertData = new AlertData(this.storage.domain, evt);
            this.transferAlertData(alertData);
        }
    }
    private installAlertDataTransferrer() {
        if (this.messageHub.isTop) {
            this.transferAlertData = (data) => {
                let stat = this.storage.appendEvent(data.domain, data.blockEvent);
                this.alertController.createOrUpdateAlert(data.domain, data.blockEvent, stat);
            }
        } else {
            // Pass the message to the top.
            this.transferAlertData = (data) => {
                this.messageHub.trigger<IAlertData>(0, data, this.messageHub.parent);
            };
        }
        this.messageHub.on<IAlertData>(0, this.transferAlertData);
    }
}
