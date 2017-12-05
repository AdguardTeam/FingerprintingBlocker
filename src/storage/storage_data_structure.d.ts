interface IDomainSettings {
    /**
     * Indicates an action: Allow, Fake, Block.
     */
    action?:number,
    /**
     * Show an alert about a blocked FP attempt or not.
     */
    notify?:boolean,
    /**
     * Show a confirmation dialog before taking action.
     */
    confirm?:boolean,
    /**
     * Completely whitelist the domain.
     * If set, we will not wrap apis at all.
     */
    whitelisted?:boolean,
    /**
     * 
     */
    fakingMode?:number,
    /**
     * 
     */
    updateInterval?:number
}

interface IGlobalSettings {
    /**
     * Indicates default value applied when domain-specific setting
     * is not set.
     * When defaultAction == ALLOW && defaultNotify == true,
     * a notification will offer user to add sites to a blacklist.
     */
    defaultAction:number,
    defaultNotify:boolean,
    defaultConfirm:boolean,
    defaultWhitelisted:boolean,
    defaultFakingMode:number,
    defaultUpdateInterval:number

    hash:string,
    /**
     * @member lastUpdated indicates the latest time when the hash was updated.
     */
    lastUpdated:number,
    /**
     * A string to be used as a flag variable, independent to the hash,
     * to be used in circumstances where we need a set a flag
     * in certain same-origin iframes.
     */
    iframeKey?:string
}

interface ITriggerLogEntry {
    api:number,
    type:number,
    action:number,
    stack:string,

    date:number
    domain?:string
}

type ITriggerLog = ITriggerLogEntry[]

interface IStoredStats {
    canvas:number, 
    audio:number
}
