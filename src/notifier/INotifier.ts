import TBlockEvent, { Apis, EventType, Action } from '../notifier/BlockEvent';
import { ApplyHandler } from '../proxy/IProxyService';
import IApiExecResult from '../wrapper/IApiExecResult';

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
