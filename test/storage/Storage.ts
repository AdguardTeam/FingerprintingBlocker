import IStorage from '../../src/storage/IStorage';
import * as base64 from '../../src/shared/base64';

const dummyStorageObject:IStorage = {
    domain: '',

    getAction() { return 2; }, // fake
    getNotify() { return false; },
    getWhitelisted() { return false; },
    getFakingMode() { return 3 /* FakingModes.CONSTANT */; },
    getUpdateInterval() { return Number.MAX_SAFE_INTEGER; },

    setAction(action) { },
    setNotify(notify) { },
    setWhitelisted(whitelisted) { },
    setFakingmode(fakingMode) { },
    setUpdateInterval(updateInterval:number) { },

    /**
     * Methods for noise seeds
     */
    getSalt():Int32Array { 
        let ar = new ArrayBuffer(16);
        base64.decode("+5CYxzB/ntNvPq6N5G2v2Q==", new Uint8Array(ar));
        return new Int32Array(ar);
    },
    updateSalt() { },

    /**
     * Methods for trigger logs
     * @todo make this api asynchronous
     */
    getTriggerLog() { return []; },
    getStat() { return { canvasBlockCount: 0, audioBlockCount: 0 }; },
    appendEvent(evt, domain?:string):void { },
    enumerateDomains():string[] { return ['']; },

    /**
     * Initializes the storage by loading data.
     */
    init() { return this; }
};

export default dummyStorageObject;
