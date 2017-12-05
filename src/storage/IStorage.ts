import IStats from './IStats';
import TBlockEvent, { Action } from '../event/BlockEvent';
import FakingModes from './FakingModesEnum';

export default interface IStorage {
    readonly action:Action
    readonly notify:boolean
    readonly confirm:boolean
    readonly whitelisted:boolean
    readonly fakingMode:FakingModes
    readonly updateInterval:number

    readonly globalKey?:string
    readonly domain?:string
    /**
     * Methods for modifying settings
     */
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
    resetStatistics():void // todo change to resetTriggerLog
    appendEventAndStat?(evt:TBlockEvent, domain?:string):Readonly<IStats>
    getCurrentStat():Readonly<IStats>
    enumerateDomains?():string[]

    init():this
}
