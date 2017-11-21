import IStats from './IStats';
import TBlockEvent, { Action } from '../event/BlockEvent';

export default interface IStorageProvider {
    domain:string

    action:Action
    notify:boolean
    confirm:boolean
    whitelisted:boolean

    hash:Int32Array

    globalKey?:string

    getTriggerLog(domain:string):ITriggerLog
    appendEvent(domain:string, evt:TBlockEvent):Readonly<IStats>
    getCurrentStat(domain:string):Readonly<IStats>

    changeAction(domain:string, action:Action):void
    silenceNotification(domain:string):void
    resetStatistics(domain:string):void
}
