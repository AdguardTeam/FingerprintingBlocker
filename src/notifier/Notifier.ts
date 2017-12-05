import INotifier from './INotifier';
import IStorage from '../storage/IStorage';

import IAlertController from '../ui/alerts/controller/IAlertController';
import IInterContextMessageHub, { TMessageHubCallback } from '../messaging/IInterContextMessageHub';

import { IAlertMessage } from '../ui/alerts/message'

import TBlockEvent from '../event/BlockEvent';

const enum NotifierMessageType {
    ALERT_DATA,
    CANVAS_REQUEST,
    CANVAS_IMAGE_DATA,
    FREE_CANVAS_REQUEST
}

export default class Notifier implements INotifier {
    private transferAlertData:TMessageHubCallback<IAlertMessage>

    constructor(
        private messageHub:IInterContextMessageHub,
        private storage:IStorage,
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
            let alertMessage:IAlertMessage = {
                domain: this.storage.domain,
                blockEvent: evt
            };
            this.transferAlertData(alertMessage);
        }
    }
    private installAlertDataTransferrer() {
        if (this.messageHub.isTop) {
            this.transferAlertData = (data) => {
                (typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout)(() => {
                    let stat = this.storage.appendEventAndStat(data.blockEvent);
                    this.alertController.createOrUpdateAlert(data, stat);
                });
            }
        } else {
            // Pass the message to the top.
            this.transferAlertData = (data) => {
                this.messageHub.trigger<IAlertMessage>(0, data, this.messageHub.parent);
            };
        }
        this.messageHub.on<IAlertMessage>(0, this.transferAlertData);
    }
}
