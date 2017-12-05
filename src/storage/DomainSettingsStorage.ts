import IStorage from './IStorage'
import IStats from './IStats'
import TBlockEvent, { Apis, Action } from '../event/BlockEvent'
import FakingModes from './FakingModesEnum'
import * as base64 from '../shared/base64'
import TypeGuards from '../shared/TypeGuards'
import AbstractSettingsStorage from './AbstractStorage'

export default class DomainSettingsStorage extends AbstractSettingsStorage {
    public action:Action
    public notify:boolean
    public confirm:boolean
    public whitelisted:boolean
    public fakingMode:FakingModes
    public updateInterval:number

    constructor(
        public domain:string,
        private globalSettings:IStorage
    ) {
        super();
    }

    protected load() {
        const domainSettingsStringified = GM_getValue(this.domain);
        let action:Action;
        let notify:boolean;
        let confirm:boolean;
        let whitelisted:boolean;
        let fakingMode:FakingModes;
        let updateInterval:number;

        if (!TypeGuards.isUndef(domainSettingsStringified)) {
            const domainSettings =  <IDomainSettings>JSON.parse(domainSettingsStringified);
            action = domainSettings.action;
            notify = domainSettings.notify;
            confirm = domainSettings.confirm;
            whitelisted = domainSettings.whitelisted;
            fakingMode = domainSettings.fakingMode;
            updateInterval = domainSettings.updateInterval;
        }

        this.action = TypeGuards.isUndef(action) ? this.globalSettings.action : action;
        this.notify = TypeGuards.isUndef(notify) ? this.globalSettings.notify : notify;
        this.confirm = TypeGuards.isUndef(confirm) ? this.globalSettings.confirm : confirm;
        this.whitelisted = TypeGuards.isUndef(whitelisted) ? this.globalSettings.whitelisted : whitelisted;
        this.fakingMode = TypeGuards.isUndef(fakingMode) ? this.globalSettings.fakingMode : fakingMode;
        this.updateInterval = TypeGuards.isUndef(updateInterval) ? this.globalSettings.updateInterval : updateInterval;
    }

    protected save() {
        const domainSettings:IDomainSettings = {};
        let hasSpecificSetting = false;
        if (this.action !== this.globalSettings.action) {
            hasSpecificSetting = true;
            domainSettings.action = this.action
        }
        if (this.notify !== this.globalSettings.notify) {
            hasSpecificSetting = true;
            domainSettings.notify = this.notify
        }
        if (this.confirm !== this.globalSettings.confirm) {
            hasSpecificSetting = true;
            domainSettings.confirm = this.confirm
        }
        if (this.whitelisted !== this.globalSettings.whitelisted) {
            hasSpecificSetting = true;
            domainSettings.whitelisted = this.whitelisted
        }
        if (this.fakingMode !== this.globalSettings.fakingMode) {
            hasSpecificSetting = true;
            domainSettings.fakingMode = this.fakingMode
        }
        if (this.updateInterval !== this.globalSettings.updateInterval) {
            hasSpecificSetting = true;
            domainSettings.updateInterval = this.updateInterval
        }
        if (hasSpecificSetting) {
            GM_setValue(this.domain, JSON.stringify(domainSettings));
        }
    }

    private stats:IStats
    private triggerLog:ITriggerLog
    getTriggerLog():ITriggerLog {
        return this.triggerLog || (this.triggerLog = <ITriggerLog>JSON.parse(GM_getValue(this.LOG_PREFIX + this.domain) || '[]'));
    }
    resetStatistics():void {// todo change to resetTriggerLog 
        GM_setValue(this.LOG_PREFIX + this.domain, '[]');
    }
    appendEventAndStat(evt:TBlockEvent):Readonly<IStats> {
        const triggerLog = this.getTriggerLog();
        this.appendEvent(triggerLog, evt);
        this.globalSettings.appendEventAndStat(evt, this.domain);
        GM_setValue(this.LOG_PREFIX + this.domain, JSON.stringify(triggerLog));
        // Note: the above can be optimized to avoid JSON.parse.
        if (TypeGuards.isUndef(this.stats)) {
            // caching
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
