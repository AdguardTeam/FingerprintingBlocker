import IStorageProvider from './IStorageProvider';
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

    private domainSettings:IDomainSettings
    private domain:string
    private globalSettings:IGlobalSettings
    private hash:string

    private static readonly DEFAULT_UPDATE_INTERVAL = 24 * 60 * 60 * 1000 // Time interval for hash update, in milliseconds.
    private static readonly DEFAULT_ACTION = Action.FAKE
    private static readonly DEFAULT_NOTIFY = true

    private static now = Date.now;

    constructor () {
        this.domain = window.location.host;

        let globalSettings:IGlobalSettings;
        let str = GM_getValue(GLOBAL_SETTINGS_KEY);
        if (TypeGuards.isUndef(str)) {
            globalSettings = this.globalSettings = {
                hash: this.getRandomHash(),
                lastUpdated: StorageProvider.now(),
                updateInterval: StorageProvider.DEFAULT_UPDATE_INTERVAL,
                defaultAction: StorageProvider.DEFAULT_ACTION,
                defaultNotify: StorageProvider.DEFAULT_NOTIFY
            };
            this.updateGlobalSettings();
        } else {
            globalSettings = this.globalSettings = JSON.parse(str);
        }

        const domainSettings = this.domainSettings = <IDomainSettings>JSON.parse(GM_getValue(this.domain) || '{}');
        
        this.action = TypeGuards.isUndef(domainSettings.action) ? globalSettings.defaultAction : domainSettings.action;

        this.notify = TypeGuards.isUndef(domainSettings.notify) ? globalSettings.defaultNotify : domainSettings.notify;

        this.confirm = TypeGuards.isUndef(domainSettings.confirm) ? false : domainSettings.confirm;

        this.whitelisted = domainSettings.whitelisted || false;

        this.hash = globalSettings.hash;

        // Reset `hash` if it is expired.
        let now = StorageProvider.now();
        let lastUpdated = globalSettings.lastUpdated;
        let updateInterval = globalSettings.updateInterval;
        if (!updateInterval) {
            updateInterval = globalSettings.updateInterval = DEFAULT_UPDATE_INTERVAL;
        }
        if (!this.hash || now - lastUpdated > updateInterval) {
            this.hash = globalSettings.hash = this.getRandomHash();
            globalSettings.lastUpdated = now;
            this.updateGlobalSettings();
        }
    }
    private getRandomHash():string {
        let buffer = new Uint8Array(new ArrayBuffer(16));
        (window.crypto || window.msCrypto).getRandomValues(buffer);
        return base64.encode(buffer);
    }
    getHashInInt32():Int32Array {
        let ar = new ArrayBuffer(16);
        base64.decode(this.hash, new Uint8Array(ar));
        return new Int32Array(ar);
    }
    private updateGlobalSettings():void {
        GM_setValue(GLOBAL_SETTINGS_KEY, JSON.stringify(this.globalSettings));
    }
    private updateDomainSettings():void {
        GM_setValue(this.domain, JSON.stringify(this.domainSettings));
    }
    getCurrentStat():{canvas:number, audio:number} {
        let canvasCount = 0;
        let audioCount = 0;
        let triggerLog = this.getTriggerLog();
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
        return { canvas: canvasCount, audio: audioCount };
    }
    getTriggerLog():ITriggerLog {
        return <ITriggerLog>JSON.parse(GM_getValue(LOG_PREFIX + this.domain) || '[]');
    }
    appendEvent(evt:TBlockEvent) {
        let triggerLog = this.getTriggerLog();
        triggerLog.push({
            date: Date.now(),
            api: evt.api,
            type: evt.type,
            action: evt.action,
            stack: evt.stack
        });
        GM_setValue(LOG_PREFIX + this.domain, JSON.stringify(triggerLog));
    }
    changeAction(action:Action):void {
        this.domainSettings.action = action;
        this.action = action;
        this.updateDomainSettings();
    }
    silenceNotification():void {
        this.notify = false;
        this.domainSettings.notify = false;
        this.updateDomainSettings();
    }
    resetStatistics():void {
        GM_setValue(LOG_PREFIX + this.domain, '[]');
    }
}
