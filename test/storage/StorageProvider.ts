import IStorageProvider from '../../src/storage/IStorageProvider';
import * as base64 from '../../src/shared/base64';

const dummyStorageObject:IStorageProvider = {
    domain: '',
    action: 2,
    notify: false,
    confirm: false,
    whitelisted: false,

    hash: (() => {
        let ar = new ArrayBuffer(16);
        base64.decode("+5CYxzB/ntNvPq6N5G2v2Q==", new Uint8Array(ar));
        return new Int32Array(ar);
    })(),

    
    getTriggerLog() {
        return [];
    },
    appendEvent(...args){
        return { canvasBlockCount: 0, audioBlockCount: 0 };
    },
    getCurrentStat() { 
        return { canvasBlockCount: 0, audioBlockCount: 0 };
    },
    changeAction(){},
    silenceNotification(){},
    resetStatistics(){}
};

export default dummyStorageObject;
