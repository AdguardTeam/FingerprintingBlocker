import IStats from './IStats';
import TBlockEvent, { Action } from '../event/BlockEvent';
import FakingModes from './FakingModesEnum';

export default interface IStorage {
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
    getSalt():Int32Array
    updateSalt():void

    /**
     * Methods for trigger logs
     * @todo make this api asynchronous
     */
    getTriggerLog():ITriggerLog
    getStats():Readonly<IStats>
    appendEvent(evt:TBlockEvent, domain?:string):void
    resetStatistics():void
    enumerateDomains?():string[]

    /**
     * Initializes the storage by loading data.
     */
    init():this
}

/**
 * Default settings storage and domain-specific settings
 * storage have the same interface, so as to be used interchangeably
 * in settings page.
 */
export interface IGlobalSettingsStorage extends IStorage {
    readonly globalKey:string
    /**
     * Domain-specific settings storage created by it
     * will be managed internally so that we do not spawn
     * duplicate storage.
     */
    getDomainStorage(domain:string):IDomainSettingsStorage
}

export interface IDomainSettingsStorage extends IStorage {
    /**
     * Below methods indicates whether certain settings key
     * is manually set by users.
     */
    getActionIsModified():boolean
    getNotifyIsModified():boolean
    getConfirmIsModified():boolean
    getWhitelistedIsModified():boolean
    getFakingModeIsModified():boolean
    getUpdateIntervalIsModified():boolean
    getAnythingIsModified():boolean
}
