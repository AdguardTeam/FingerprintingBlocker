import INotifier from './INotifier';
import IStorage from '../storage/IStorage';

import IAlertController from '../ui/alerts/controller/IAlertController';
import IInterContextMessageHub, { TMessageHubCallback } from '../messaging/IInterContextMessageHub';

import { IAlertMessage } from '../ui/alerts/message'

import TBlockEvent, { Apis, Action, CanvasBlockEventType, AudioBlockEventType, CanvasBlockEvent, AudioBlockEvent, EventType } from '../notifier/BlockEvent';
import { formatText, getMessage } from '../ui/localization';
import { ApplyHandler } from '../proxy/IProxyService';
import IApiExecResult from '../wrapper/IApiExecResult';
import getStack from '../stack/stack'
import { original } from '../wrapper/common_apply_handlers'

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

    private onBlock(evt:TBlockEvent) {
        // this.latestCanvas = evt.data;
        // delete non-transferrable object
        delete evt.data;

        if (this.storage.getNotify()) {
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
                    this.storage.appendEvent(data.blockEvent);
                    let stat = this.storage.getStat();
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

    dispatchBlockEvent(api:Apis, type:EventType, action:Action, stack:string, data?):void {
        let event:TBlockEvent;
        if (api === Apis.canvas) {
            event = new CanvasBlockEvent(<CanvasBlockEventType>type, action, stack, data);
        } else {
            event = new AudioBlockEvent(<AudioBlockEventType>type, action, stack, data);
        }
        this.onBlock(event);
    }
}
