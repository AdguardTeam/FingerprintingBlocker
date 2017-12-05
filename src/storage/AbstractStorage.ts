import IStorage from './IStorage'
import IStats from './IStats';
import TBlockEvent, { Apis, Action } from '../event/BlockEvent';
import FakingModes from './FakingModesEnum';
import * as base64 from '../shared/base64';
import TypeGuards from '../shared/TypeGuards';

export default abstract class AbstractSettingsStorage implements IStorage {
    public action:Action
    public notify:boolean
    public confirm:boolean
    public whitelisted:boolean
    public fakingMode:FakingModes
    public updateInterval:number

    protected abstract load():void
    protected abstract save():void

    init():this {
        this.load();
        this.updateHashIfNeeded();
        return this;
    }

    setAction(action:Action):void {
        this.action = action;
        this.save();
    }
    setNotify(notify:boolean):void {
        this.notify = notify;
        this.save();
    }
    setConfirm(confirm:boolean):void {
        this.confirm = confirm;
        this.save();
    }
    setWhitelisted(whitelisted:boolean):void {
        this.whitelisted = whitelisted;
        this.save;
    }
    setFakingmode(fakingMode:FakingModes):void {
        this.fakingMode = fakingMode;
        this.save();
    }
    setUpdateInterval(updateInterval:number):void {
        this.updateInterval = updateInterval;
        this.save();
    }

    protected hash:Int32Array
    protected lastUpdated:number
    getHash():Int32Array {
        if (this.fakingMode === FakingModes.EVERY_TIME) {
            return this.getRandomHash();
        } else {
            return this.hash;
        }
    }
    updateHash():void {
        this.hash = this.getRandomHash();
    }
    protected updateHashIfNeeded():void {
        if (!this.hash || this.now() - this.lastUpdated > this.updateInterval) {
            this.updateHash();
        }
    }
    protected getRandomHash():Int32Array {
        let buffer = new Uint8Array(new ArrayBuffer(16));
        (window.crypto || window.msCrypto).getRandomValues(buffer);
        return new Int32Array(buffer.buffer);
    }

    protected readonly LOG_PREFIX = 'log#'
    protected readonly GLOBAL_SETTINGS_KEY = 'settings'
    protected readonly now = Date.now

    abstract getTriggerLog():ITriggerLog
    abstract resetStatistics():void

    abstract appendEventAndStat?(evt:TBlockEvent, domain?:string):Readonly<IStats>
    abstract getCurrentStat():Readonly<IStats>
    enumerateDomains():string[] {
        let keys = GM_listValues();
        return keys.filter((key) => {
            return key !== this.GLOBAL_SETTINGS_KEY &&
                key.indexOf(this.LOG_PREFIX) !== 0;
        });
    }
    // Utility methods.
    protected appendEvent(triggerLog:ITriggerLog, evt:TBlockEvent, domain?:string):void {
        const entry:ITriggerLogEntry = {
            date: this.now(),
            api: evt.api,
            type: evt.type,
            action: evt.action,
            stack: evt.stack
        };
        if (domain) { entry.domain = domain; } 
        triggerLog.push(entry);
    }
    protected increaseStat(stats:IStats, evt:TBlockEvent):void {
        switch (evt.api) {
            case Apis.canvas:
                stats.canvasBlockCount++;
                break;
            case Apis.audio:
                stats.audioBlockCount++;
                break;
        }
    }
    protected getStatFromTriggerLog(triggerLog:ITriggerLog):IStats {
        let canvasCount = 0;
        let audioCount = 0;
        for (let i = 0, l = triggerLog.length; i < l; i++) {
            let entry = triggerLog[i];
            switch (entry.api) {
                case Apis.canvas:
                    canvasCount++;
                    break;
                case Apis.audio:
                    audioCount++;
                    break;
            }
        }
        return { canvasBlockCount: canvasCount, audioBlockCount: audioCount };
    }
}
