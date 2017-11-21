import IAlertData from '../ui/alerts/IAlertData';
import TBlockEvent from '../event/BlockEvent';

/****************************************************************************
 
    +------------------+      +----------+           +-----------------+
    | CanvasApiWrapper | ---> | Notifier |  ---+---> | AlertController |
    +------------------+      +----------+     |     +-----------------+
                                               |     +-----------------+
                                               +---> | StorageProvider |
                                                     +-----------------+
 */
export default interface INotifier {
    onBlock(evt:TBlockEvent):void
}
