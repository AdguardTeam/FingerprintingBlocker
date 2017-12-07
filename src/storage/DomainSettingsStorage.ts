import IStorage, { IDomainSettingsStorage } from './IStorage'
import IStats from './IStats'
import TBlockEvent, { Apis, Action } from '../event/BlockEvent'
import FakingModes from './FakingModesEnum'
import * as base64 from '../shared/base64'
import TypeGuards from '../shared/TypeGuards'
import AbstractSettingsStorage from './AbstractStorage'

export default class DomainSettingsStorage extends AbstractSettingsStorage implements IDomainSettingsStorage {
    constructor(
        public domain:string,
        private globalSettings:IStorage
    ) { super(); }

    protected load() {
        const domainSettingsStringified = GM_getValue(this.domain);
        if (TypeGuards.isUndef(domainSettingsStringified)) { return; }
        const domainSettings =  <IDomainSettings>JSON.parse(domainSettingsStringified);
        this.$action = domainSettings.action;
        this.$notify = domainSettings.notify;
        this.$confirm = domainSettings.confirm;
        this.$whitelisted = domainSettings.whitelisted;
        this.$fakingMode = domainSettings.fakingMode;
        this.$updateInterval = domainSettings.updateInterval;
    }

    protected save() {
        const domainSettings:IDomainSettings = {};
        let hasSpecificSettings = false;
        if (!TypeGuards.isUndef(this.$action)) {
            hasSpecificSettings = true;
            domainSettings.action = this.$action;
        }
        if (!TypeGuards.isUndef(this.$notify)) {
            hasSpecificSettings = true;
            domainSettings.notify = this.$notify;
        }
        if (!TypeGuards.isUndef(this.$confirm)) {
            hasSpecificSettings = true;
            domainSettings.confirm = this.$confirm;
        }
        if (!TypeGuards.isUndef(this.$whitelisted)) {
            hasSpecificSettings = true;
            domainSettings.whitelisted = this.$whitelisted;
        }
        if (!TypeGuards.isUndef(this.$fakingMode)) {
            hasSpecificSettings = true;
            domainSettings.fakingMode = this.$fakingMode;
        }
        if (!TypeGuards.isUndef(this.$updateInterval)) {
            hasSpecificSettings = true;
            domainSettings.updateInterval = this.$updateInterval;
        }
        if (hasSpecificSettings) {
            GM_setValue(this.domain, JSON.stringify(domainSettings));
        }
    }

    getAction():Action {
        return this.getActionIsModified() ? this.$action : this.globalSettings.getAction();
    }
    getActionIsModified() {
        return !TypeGuards.isUndef(this.$action);
    }
    getNotify():boolean {
        return this.getNotifyIsModified() ? this.$notify : this.globalSettings.getNotify();
    }
    getNotifyIsModified() {
        return !TypeGuards.isUndef(this.$notify)
    }
    getConfirm():boolean {
        return this.getConfirmIsModified() ? this.$confirm : this.globalSettings.getConfirm();
    }
    getConfirmIsModified() {
        return !TypeGuards.isUndef(this.$confirm);
    }
    getWhitelisted():boolean {
        return this.getWhitelistedIsModified() ? this.$whitelisted : this.globalSettings.getWhitelisted();
    }
    getWhitelistedIsModified() {
        return !TypeGuards.isUndef(this.$whitelisted);
    }
    getFakingMode():FakingModes {
        return this.getFakingModeIsModified() ? this.$fakingMode : this.globalSettings.getFakingMode();
    }
    getFakingModeIsModified() {
        return !TypeGuards.isUndef(this.$fakingMode);
    }
    getUpdateInterval():number {
        return this.getUpdateIntervalIsModified() ? this.$updateInterval : this.globalSettings.getUpdateInterval();
    }
    getUpdateIntervalIsModified() {
        return !TypeGuards.isUndef(this.$updateInterval);
    }
    getAnythingIsModified() {
        return this.getActionIsModified() ||
            this.getNotifyIsModified() ||
            this.getConfirmIsModified() ||
            this.getWhitelistedIsModified() ||
            this.getFakingModeIsModified() ||
            this.getUpdateIntervalIsModified();
    }

    protected loadStats():void {
        this.triggerLog = [];
        const statsStringified = GM_getValue(this.STATS_PREFIX + this.domain);
        if (!TypeGuards.isUndef(statsStringified)) {
            const stats:IStoredStats = JSON.parse(statsStringified);
            this.stats = {
                canvasBlockCount: stats.canvas,
                audioBlockCount: stats.audio
            };
        } else {
            this.stats = {
                canvasBlockCount: 0,
                audioBlockCount: 0
            }
        }
    }

    protected saveStats():void {
        if (this.stats.canvasBlockCount === 0 && this.stats.audioBlockCount === 0) { return; }
        const stats:IStoredStats = {
            canvas: this.stats.canvasBlockCount,
            audio: this.stats.audioBlockCount
        };
        GM_setValue(this.STATS_PREFIX + this.domain, JSON.stringify(stats));
    }
}
