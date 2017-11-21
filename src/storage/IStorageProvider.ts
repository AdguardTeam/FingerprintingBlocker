import TBlockEvent, { Action } from '../event/BlockEvent';

export default interface IStorageProvider {
    action:Action
    notify:boolean
    confirm:boolean
    whitelisted:boolean

    getHashInInt32():Int32Array

    getCurrentStat():{canvas:number, audio:number}
    getTriggerLog():ITriggerLog
    appendEvent(evt:TBlockEvent):void

    changeAction(action:Action):void
    silenceNotification():void
    resetStatistics():void
}
