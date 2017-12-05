import IStorage from './IStorage'
import IStats from './IStats';
import TBlockEvent, { Apis, Action } from '../event/BlockEvent';
import FakingModes from './FakingModesEnum';
import * as base64 from '../shared/base64';
import TypeGuards from '../shared/TypeGuards';
import AbstractSettingsStorage from './AbstractStorage';
import IGlobalSettingsStorage from './IGlobalSettingsStorage';
import DomainSettingsStorage from './DomainSettingsStorage';

export default class GlobalSettingsStorage extends AbstractSettingsStorage implements IGlobalSettingsStorage {
    public globalKey:string

    // Default global settings 
    private static readonly DEFAULT_ACTION          = Action.FAKE
    private static readonly DEFAULT_NOTIFY          = true
    private static readonly DEFAULT_CONFIRM         = false
    private static readonly DEFAULT_WHITELISTED     = false
    private static readonly DEFAULT_FAKING_MODE     = FakingModes.PER_DOMAIN
    // Time interval for hash update, in milliseconds.
    private static readonly DEFAULT_UPDATE_INTERVAL = 24 * 60 * 60 * 1000

    protected load() {
        const globalSettingsStringified = GM_getValue(this.GLOBAL_SETTINGS_KEY);

        if (!TypeGuards.isUndef(globalSettingsStringified)) {
            const globalSettings = <IGlobalSettings>JSON.parse(globalSettingsStringified);
            this.action = globalSettings.defaultAction;
            this.notify = globalSettings.defaultNotify;
            this.confirm = globalSettings.defaultConfirm;
            this.whitelisted = globalSettings.defaultWhitelisted;
            this.fakingMode = globalSettings.defaultFakingMode;
            this.updateInterval = globalSettings.defaultUpdateInterval;
            this.globalKey = globalSettings.iframeKey;
            this.hash = new Int32Array(16);
            base64.decode(globalSettings.hash, new Uint8Array(this.hash));
            this.lastUpdated = globalSettings.lastUpdated;
        } else {
            this.action = GlobalSettingsStorage.DEFAULT_ACTION;
            this.notify = GlobalSettingsStorage.DEFAULT_NOTIFY;
            this.confirm = GlobalSettingsStorage.DEFAULT_CONFIRM;
            this.whitelisted = GlobalSettingsStorage.DEFAULT_WHITELISTED;
            this.fakingMode = GlobalSettingsStorage.DEFAULT_FAKING_MODE;
            this.updateInterval = GlobalSettingsStorage.DEFAULT_UPDATE_INTERVAL;
            this.globalKey = base64.encode(new Uint8Array(this.getRandomHash()));
            this.hash = this.getRandomHash();
            this.lastUpdated = this.now();
            this.save();
        }
    }

    protected save() {
        const globalSettings:IGlobalSettings = {
            defaultAction: this.action,
            defaultNotify: this.notify,
            defaultConfirm: this.confirm,
            defaultWhitelisted: this.whitelisted,
            defaultFakingMode: this.fakingMode,
            defaultUpdateInterval: this.updateInterval,
            hash: base64.encode(new Uint8Array(this.hash)),
            lastUpdated: this.now(),
            iframeKey: this.globalKey
        }
        GM_setValue(this.GLOBAL_SETTINGS_KEY, JSON.stringify(globalSettings));
        for (let domain in this.domainStorageMap) {
            this.domainStorageMap[domain].init();
        }
    }
    private domainStorageMap:stringmap<IStorage>
    getDomainStorage(domain:string) {
        if (TypeGuards.isUndef(this.domainStorageMap)) {
            this.domainStorageMap = Object.create(null);
        }
        let domainStorage = this.domainStorageMap[domain];
        if (TypeGuards.isUndef(domainStorage)) {
            domainStorage = this.domainStorageMap[domain] = new DomainSettingsStorage(domain, this);
            domainStorage.init();
        }
        return domainStorage;
    }

    /**
     * Note that below methods will only be used in settings page,
     * those should be removed by closure compiler on userscript build.
     */
    private stats:IStats
    private triggerLog:ITriggerLog
    getTriggerLog():ITriggerLog {
        if (this.triggerLog) {
            return this.triggerLog;
        }
        let domains = this.enumerateDomains();
        // mege sort
        return mergeTriggerLogs(domains.map((domain) => {
            return {
                log: JSON.parse(GM_getValue(this.LOG_PREFIX + domain, '[]')),
                domain: domain
            };
        }));
    }
    resetStatistics():void {
        let domains = this.enumerateDomains();
        for (let l = domains.length; l > 0; l--) {
            let domain = domains[l];
            GM_setValue(this.LOG_PREFIX + domain, '[]');
        }
    }
    appendEventAndStat(evt:TBlockEvent, domain:string):Readonly<IStats> {
        const triggerLog = this.triggerLog;
        if (TypeGuards.isUndef(triggerLog)) { return; }
        this.appendEvent(triggerLog, evt, domain);
        if (TypeGuards.isUndef(this.stats)) {
            this.stats = this.getStatFromTriggerLog(triggerLog);
        } else {
            this.increaseStat(this.stats, evt);
        }
        return this.stats;
    }
    getCurrentStat():Readonly<IStats> {
        if (!TypeGuards.isUndef(this.stats)) {
            return this.stats;
        }
        return (this.stats = this.getStatFromTriggerLog(this.getTriggerLog()));
    }
}

function mergeTriggerLogs(things:{ log:ITriggerLog, domain:string }[]):ITriggerLog {
    // just a stub
    const minHeap = new Array(things.length);
    while (true) {

    }
}
