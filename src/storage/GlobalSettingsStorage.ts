import IStorage, { IGlobalSettingsStorage, IDomainSettingsStorage } from './IStorage'
import IStats from './IStats';
import TBlockEvent, { Apis, Action } from '../event/BlockEvent';
import FakingModes from './FakingModesEnum';
import * as base64 from '../shared/base64';
import TypeGuards from '../shared/TypeGuards';
import AbstractSettingsStorage from './AbstractStorage';
import DomainSettingsStorage from './DomainSettingsStorage';

export default class GlobalSettingsStorage extends AbstractSettingsStorage implements IGlobalSettingsStorage {
    public globalKey:string

    // Default global settings 
    private static readonly DEFAULT_ACTION          = Action.ALLOW
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
            this.$action = globalSettings.defaultAction;
            this.$notify = globalSettings.defaultNotify;
            this.$confirm = globalSettings.defaultConfirm;
            this.$whitelisted = globalSettings.defaultWhitelisted;
            this.$fakingMode = globalSettings.defaultFakingMode;
            this.$updateInterval = globalSettings.defaultUpdateInterval;
            this.globalKey = globalSettings.iframeKey;
            this.hash = new Int32Array(16);
            base64.decode(globalSettings.hash, new Uint8Array(this.hash));
            this.lastUpdated = globalSettings.lastUpdated;
        } else {
            this.$action = GlobalSettingsStorage.DEFAULT_ACTION;
            this.$notify = GlobalSettingsStorage.DEFAULT_NOTIFY;
            this.$confirm = GlobalSettingsStorage.DEFAULT_CONFIRM;
            this.$whitelisted = GlobalSettingsStorage.DEFAULT_WHITELISTED;
            this.$fakingMode = GlobalSettingsStorage.DEFAULT_FAKING_MODE;
            this.$updateInterval = GlobalSettingsStorage.DEFAULT_UPDATE_INTERVAL;
            this.globalKey = base64.encode(new Uint8Array(this.getRandomHash()));
            this.hash = this.getRandomHash();
            this.lastUpdated = this.now();
            this.save();
        }
    }

    protected save() {
        const globalSettings:IGlobalSettings = {
            defaultAction: this.$action,
            defaultNotify: this.$notify,
            defaultConfirm: this.$confirm,
            defaultWhitelisted: this.$whitelisted,
            defaultFakingMode: this.$fakingMode,
            defaultUpdateInterval: this.$updateInterval,
            hash: base64.encode(new Uint8Array(this.hash)),
            lastUpdated: this.now(),
            iframeKey: this.globalKey
        }
        GM_setValue(this.GLOBAL_SETTINGS_KEY, JSON.stringify(globalSettings));
        for (let domain in this.domainStorageMap) {
            this.domainStorageMap[domain].init();
        }
    }

    getAction():Action {
        return this.$action;
    }
    getNotify():boolean {
        return this.$notify;
    }
    getConfirm():boolean {
        return this.$confirm;
    }
    getWhitelisted():boolean {
        return this.$whitelisted;
    }
    getFakingMode():FakingModes {
        return this.$fakingMode;
    }
    getUpdateInterval():number {
        return this.$updateInterval;
    }

    protected loadStats():void {
        const domains = this.enumerateDomains();
        /** @todo optimize this */
        this.triggerLog = Array.prototype.concat.apply([], domains.map((domain) => {
            return JSON.parse(GM_getValue(this.LOG_PREFIX + domain, '[]')).map(entry => {
                entry.domain = domain;
                return entry;
            });
        })).sort((a, b) => {
            return b.date - a.date;
        });
        this.stats = domains.map((domain) => {
            return GM_getValue(this.STATS_PREFIX + domain);
        }).reduce((prev, current) => {
            prev.canvasBlockCount += current.canvas;
            prev.audioBlockCount += current.audio;
        }, {
            canvasBlockCount: 0,
            audioBlockCount: 0
        });
    }

    protected saveStats():void { } // Does nothing
    private domainStorageMap:stringmap<IDomainSettingsStorage>
    getDomainStorage(domain:string):IDomainSettingsStorage {
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
}
