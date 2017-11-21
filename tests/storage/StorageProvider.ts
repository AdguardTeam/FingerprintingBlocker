import IStorageProvider from '../../src/storage/IStorageProvider';
import * as base64 from '../../src/shared/base64';

const dummyStorageObject:IStorageProvider = {
    action: 2,
    notify: false,
    confirm: false,
    whitelisted: false,
    getHashInInt32: function():Int32Array {
        let ar = new ArrayBuffer(16);
        base64.decode("+5CYxzB/ntNvPq6N5G2v2Q==", new Uint8Array(ar));
        return new Int32Array(ar);
    },
    getCurrentStat() { 
        return { canvas: 0, audio: 0 };
    },
    getTriggerLog() {
        return [];
    },
    appendEvent(){},
    changeAction(){},
    silenceNotification(){},
    resetStatistics(){}
};

export default dummyStorageObject;
