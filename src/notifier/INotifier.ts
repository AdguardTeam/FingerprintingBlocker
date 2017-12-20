import TBlockEvent, { Apis, EventType, Action } from '../event/BlockEvent';
import { ApplyHandler } from '../proxy/IProxyService';
import IApiExecResult from './IApiExecResult';

/****************************************************************************
 
    +------------------+      +----------+           +-----------------+
    | CanvasApiWrapper | ---> | Notifier |  ---+---> | AlertController |
    +------------------+      +----------+     |     +-----------------+
                                               |     +-----------------+
                                               +---> |     Storage     |
                                                     +-----------------+
 */
export default interface INotifier {
    dispatchBlockEvent(api:Apis, type:EventType, action:Action, stack:string, data?):void
}
