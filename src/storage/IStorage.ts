import IStats from './IStats';
import TBlockEvent, { Action } from '../event/BlockEvent';
import FakingModes from './FakingModesEnum';

export default interface IStorage {
    readonly globalKey?:string
    readonly domain?:string

    getAction():Action
    getNotify():boolean
    getConfirm():boolean
    getWhitelisted():boolean
    getFakingMode():FakingModes
    getUpdateInterval():number

    setAction(action:Action):void
    setNotify(notify:boolean):void
    setConfirm(confirm:boolean):void
    setWhitelisted(whitelisted:boolean):void
    setFakingmode(fakingMode:FakingModes):void
    setUpdateInterval(updateInterval:number):void

    /**
     * Methods for noise seeds
     */
    getHash():Int32Array
    updateHash():void

    /**
     * Methods for trigger logs
     * @todo make this api asynchronous
     */
    getTriggerLog():ITriggerLog
    getStats():Readonly<IStats>
    appendEvent(evt:TBlockEvent, domain?:string):void
    resetStatistics():void
    enumerateDomains?():string[]

    init():this
}

export interface IGlobalSettingsStorage extends IStorage {
    getDomainStorage(domain:string):IDomainSettingsStorage
}

export interface IDomainSettingsStorage extends IStorage {
    getActionIsModified():boolean
    getNotifyIsModified():boolean
    getConfirmIsModified():boolean
    getWhitelistedIsModified():boolean
    getFakingModeIsModified():boolean
    getUpdateIntervalIsModified():boolean
    
    getIsModified():boolean
}