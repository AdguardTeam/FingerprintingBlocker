import TBlockEvent from '../event/BlockEvent';

/****************************************************************************
 
    +------------------+      +----------+           +-----------------+
    | CanvasApiWrapper | ---> | Notifier |  ---+---> | AlertController |
    +------------------+      +----------+     |     +-----------------+
                                               |     +-----------------+
                                               +---> |     Storage     |
                                                     +-----------------+
 */
export default interface INotifier {
    onBlock(evt:TBlockEvent):void
}
