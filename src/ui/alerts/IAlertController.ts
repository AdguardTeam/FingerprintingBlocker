import TBlockEvent from '../../event/BlockEvent';

export default interface IAlertController {
    createOrUpdateAlert(domain:string, event:TBlockEvent, stat:{canvas:number, audio:number}):void
}
