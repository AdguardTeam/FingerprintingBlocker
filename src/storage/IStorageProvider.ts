import TBlockEvent, { Action } from '../event/BlockEvent';

export default interface IStorageProvider {
    action:Action
    notify:boolean
    confirm:boolean
    whitelisted:boolean

    fillDomainHash(buffer:Uint8Array):void
    getCurrentStat():{canvas:number, audio:number}
    getTriggerLog():ITriggerLog
    appendEvent(evt:TBlockEvent):void

    changeAction(action:Action):void
    silenceNotification():void
    resetStatistics():void
}
