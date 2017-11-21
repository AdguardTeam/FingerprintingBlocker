import IStats from '../../storage/IStats';
import TBlockEvent from '../../event/BlockEvent';

export default interface IAlertController {
    createOrUpdateAlert(domain:string, event:TBlockEvent, stat:IStats):void
}
