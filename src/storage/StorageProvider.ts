import IStorageProvider from './IStorageProvider';
import IStats from './IStats';
import TBlockEvent, { Apis, Action } from '../event/BlockEvent';
import * as base64 from '../shared/base64';
import TypeGuards from '../shared/TypeGuards';

const DEFAULT_UPDATE_INTERVAL = 24 * 60 * 60 * 1000 // Time interval for hash update, in milliseconds.
const GLOBAL_SETTINGS_KEY = 'settings';
const LOG_PREFIX = 'log#';

/**
 * @member hash 16-byte random data to be used to generate image noises.
 */
export default class StorageProvider implements IStorageProvider {
    public action:Action
    public notify:boolean
    public confirm:boolean
    public whitelisted:boolean

    public domain:string

    public hash:Int32Array
    public globalKey?

    private stats:stringmap<IStats>

    // Time interval for hash update, in milliseconds.
    private static readonly DEFAULT_UPDATE_INTERVAL = 24 * 60 * 60 * 1000
    private static readonly DEFAULT_ACTION = Action.FAKE
    private static readonly DEFAULT_NOTIFY = true

    private static now = Date.now;

    constructor () {
        this.domain = window.location.host;
        const globalSettings = this.getGlobalSettings();
        const domainSettings = this.getDomainSettings(this.domain, globalSettings);
        this.action = domainSettings.action;
        this.notify = domainSettings.notify;
        this.confirm = domainSettings.confirm;
        this.whitelisted = domainSettings.whitelisted;

        this.hash = StorageProvider.hashInInt32(globalSettings.hash);
        this.globalKey = globalSettings.iframeKey;

        // Update global settings -- start
        let globalSettingNeedsUpdate = false;
        // Reset `hash` if it is expired.
        let now = StorageProvider.now();
        let lastUpdated = globalSettings.lastUpdated;
        let updateInterval = globalSettings.updateInterval;
        if (!updateInterval) {
            updateInterval = globalSettings.updateInterval = DEFAULT_UPDATE_INTERVAL;
        }
        if (!this.hash || now - lastUpdated > updateInterval) {
            this.hash = StorageProvider.getRandomHash();
            globalSettings.hash = base64.encode(new Uint8Array(this.hash.buffer));
            globalSettings.lastUpdated = now;
            globalSettingNeedsUpdate = true;
            
        }
        // Set `iframeKey` if it is not provided,
        // but do not use it in this session.
        if (TypeGuards.isUndef(this.globalKey)) {
            globalSettings.iframeKey = base64.encode(new Uint8Array(StorageProvider.getRandomHash()));
            globalSettingNeedsUpdate = true;
        }

        if (globalSettingNeedsUpdate) {
            this.setGlobalSettings(globalSettings);
        }

        this.stats = Object.create(null);
    }
    private static getRandomHash():Int32Array {
        let buffer = new Uint8Array(new ArrayBuffer(16));
        (window.crypto || window.msCrypto).getRandomValues(buffer);
        return new Int32Array(buffer.buffer);
    }

    private static hashInInt32(hashStr:string):Int32Array {
        let ar = new ArrayBuffer(16);
        base64.decode(hashStr, new Uint8Array(ar));
        return new Int32Array(ar);
    }

    private static readonly GLOBAL_SETTINGS_KEY = 'settings';
    private getGlobalSettings():IGlobalSettings {
        let globalSettingsStringified:string = GM_getValue(StorageProvider.GLOBAL_SETTINGS_KEY);
        if (!TypeGuards.isUndef(globalSettingsStringified)) {
            return <IGlobalSettings>JSON.parse(globalSettingsStringified);
        }
        let globalSettings:IGlobalSettings = {
            hash: base64.encode(new Uint8Array(StorageProvider.getRandomHash())),
            lastUpdated: StorageProvider.now(),
            updateInterval: StorageProvider.DEFAULT_UPDATE_INTERVAL,
            defaultAction: StorageProvider.DEFAULT_ACTION,
            defaultNotify: StorageProvider.DEFAULT_NOTIFY
        };
        this.setGlobalSettings(globalSettings);
        return globalSettings;
    }
    private setGlobalSettings(globalSettings:IGlobalSettings):void {
        GM_setValue(StorageProvider.GLOBAL_SETTINGS_KEY, JSON.stringify(globalSettings));
    }

    private getDomainSettings(domain:string, globalSettings?:IGlobalSettings):IDomainSettings {
        let domainSettingsStringified = GM_getValue(domain);
        if (!TypeGuards.isUndef(domainSettingsStringified)) {
            return <IDomainSettings>JSON.parse(domainSettingsStringified);
        }
        globalSettings = globalSettings || this.getGlobalSettings();
        let domainSettings:IDomainSettings = {
            action: globalSettings.defaultAction,
            notify: globalSettings.defaultNotify,
            confirm: false,
            whitelisted: false
        };
        return domainSettings;
    }
    private setDomainSettings(domain:string, settings:IDomainSettings):void {
        GM_setValue(domain, JSON.stringify(settings));
    }

    changeAction(domain:string, action:Action):void {
        let domainSettings = this.getDomainSettings(domain);
        domainSettings.action = action;
        this.setDomainSettings(domain, domainSettings);
    }
    silenceNotification(domain:string):void {
        let domainSettings = this.getDomainSettings(domain);
        domainSettings.notify = false;
        this.setDomainSettings(domain, domainSettings);
    }

    resetStatistics(domain:string):void {
        GM_setValue(LOG_PREFIX + domain, '[]');
        if (this.stats[domain]) {
            this.stats[domain].canvasBlockCount = 0;
            this.stats[domain].audioBlockCount = 0;
        }
    }
    private static getStatFromTriggerLog(triggerLog:ITriggerLog):IStats {
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
    getTriggerLog(domain:string):ITriggerLog {
        return <ITriggerLog>JSON.parse(GM_getValue(LOG_PREFIX + domain) || '[]');
    }
    appendEvent(domain:string, evt:TBlockEvent):IStats {
        let triggerLog = this.getTriggerLog(domain);
        triggerLog.push({
            date: StorageProvider.now(),
            api: evt.api,
            type: evt.type,
            action: evt.action,
            stack: evt.stack
        });
        GM_setValue(LOG_PREFIX + domain, JSON.stringify(triggerLog));
        let stats:IStats
        if (TypeGuards.isUndef(this.stats[domain])) {
            stats = StorageProvider.getStatFromTriggerLog(triggerLog);
            // caching
            this.stats[domain] = stats;
        } else {
            stats = this.stats[domain];
            switch (evt.api) {
                case Apis.canvas:
                    stats.canvasBlockCount++;
                    break;
                case Apis.audio:
                    stats.audioBlockCount++;
                    break;
            }
        }
        return stats;
    }
    getCurrentStat(domain:string):Readonly<IStats> {
        if (!TypeGuards.isUndef(this.stats[domain])) {
            return this.stats[domain];
        }
        return this.getCurrentStat(domain);
    }
}
