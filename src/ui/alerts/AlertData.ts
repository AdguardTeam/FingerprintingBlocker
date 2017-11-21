import IAlertData from './IAlertData';
import INotifier from '../../notifier/INotifier';
import TBlockEvent from '../../event/BlockEvent';

export default class AlertData implements IAlertData {
    constructor(
        public domain:string,
        public blockEvent:TBlockEvent
    ) { }
}
