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
            this.$whitelisted = globalSettings.defaultWhitelisted;
            this.$fakingMode = globalSettings.defaultFakingMode;
            this.$updateInterval = globalSettings.defaultUpdateInterval;
            this.globalKey = globalSettings.iframeKey;
            this.$salt = new Int32Array(16);
            base64.decode(globalSettings.defaultSalt, new Uint8Array(this.$salt.buffer));
            this.$lastUpdated = globalSettings.lastUpdated;
        } else {
            this.$action = GlobalSettingsStorage.DEFAULT_ACTION;
            this.$notify = GlobalSettingsStorage.DEFAULT_NOTIFY;
            this.$whitelisted = GlobalSettingsStorage.DEFAULT_WHITELISTED;
            this.$fakingMode = GlobalSettingsStorage.DEFAULT_FAKING_MODE;
            this.$updateInterval = GlobalSettingsStorage.DEFAULT_UPDATE_INTERVAL;
            this.globalKey = base64.encode(new Uint8Array(this.getRandomSalt().buffer));
            this.$salt = this.getRandomSalt();
            this.$lastUpdated = this.now();
            this.save();
        }
    }

    protected save() {
        const globalSettings:IGlobalSettings = {
            defaultAction: this.$action,
            defaultNotify: this.$notify,
            defaultWhitelisted: this.$whitelisted,
            defaultFakingMode: this.$fakingMode,
            defaultUpdateInterval: this.$updateInterval,
            defaultSalt: base64.encode(new Uint8Array(this.$salt.buffer)),
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
    getWhitelisted():boolean {
        return this.$whitelisted;
    }
    getFakingMode():FakingModes {
        return this.$fakingMode;
    }
    getUpdateInterval():number {
        return this.$updateInterval;
    }

    protected loadStat():void {
        const domains = this.enumerateDomains();
        this.triggerLog = [];
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

    protected saveStat():void { } // Does nothing
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
