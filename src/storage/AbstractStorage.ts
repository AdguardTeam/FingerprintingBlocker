import IStorage from './IStorage'
import IStats from './IStats';
import TBlockEvent, { Apis, Action } from '../event/BlockEvent';
import FakingModes from './FakingModesEnum';
import * as base64 from '../shared/base64';
import TypeGuards from '../shared/TypeGuards';

export default abstract class AbstractSettingsStorage implements IStorage {
    protected action:Action
    protected notify:boolean
    protected confirm:boolean
    protected whitelisted:boolean
    protected fakingMode:FakingModes
    protected updateInterval:number

    protected abstract load():void
    protected abstract save():void

    init():this {
        this.load();
        this.updateHashIfNeeded();
        return this;
    }
    abstract getAction():Action
    setAction(action:Action):void {
        this.action = action;
        this.save();
    }
    abstract getNotify():boolean
    setNotify(notify:boolean):void {
        this.notify = notify;
        this.save();
    }
    abstract getConfirm():boolean
    setConfirm(confirm:boolean):void {
        this.confirm = confirm;
        this.save();
    }
    abstract getWhitelisted():boolean
    setWhitelisted(whitelisted:boolean):void {
        this.whitelisted = whitelisted;
        this.save();
    }
    abstract getFakingMode():FakingModes
    setFakingmode(fakingMode:FakingModes):void {
        this.fakingMode = fakingMode;
        this.save();
    }
    abstract getUpdateInterval():number
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
    protected readonly STATS_PREFIX = 'stats#'
    protected readonly GLOBAL_SETTINGS_KEY = 'settings'
    protected readonly now = Date.now


    protected triggerLog:ITriggerLog
    protected stats:IStats

    protected abstract loadStats():void
    protected abstract saveStats():void

    getTriggerLog():ITriggerLog {
        if (TypeGuards.isUndef(this.triggerLog))
            this.loadStats();
        return this.triggerLog;
    }
    getStats():Readonly<IStats> {
        if (TypeGuards.isUndef(this.stats))
            this.loadStats();
        return this.stats;
    }
    appendEvent(evt:TBlockEvent, domain?:string):void {
        if (TypeGuards.isUndef(this.triggerLog))
            this.loadStats();

        const entry:ITriggerLogEntry = {
            date: this.now(),
            api: evt.api,
            type: evt.type,
            action: evt.action,
            stack: evt.stack
        };
        if (domain) { entry.domain = domain; } 
        this.triggerLog.push(entry);
        switch (evt.api) {
            case Apis.canvas:
                this.stats.canvasBlockCount++;
                break;
            case Apis.audio:
                this.stats.audioBlockCount++;
                break;
        }
        this.saveStats();
    }
    resetStatistics():void {
        this.triggerLog = [];
        this.stats = {
            canvasBlockCount: 0,
            audioBlockCount: 0
        };
        this.saveStats();
    }

    enumerateDomains():string[] {
        let keys = GM_listValues();
        return keys.filter((key) => {
            return key !== this.GLOBAL_SETTINGS_KEY &&
                key.indexOf(this.LOG_PREFIX) !== 0;
        });
    }
}
