import IStorageProvider from '../../src/storage/IStorageProvider';
import * as base64 from '../../src/shared/base64';

const dummyStorageObject:IStorageProvider = {
    whitelisted: false,
    silenced: false,
    fillDomainHash: function(buffer:Uint8Array) {
        base64.decode("+5CYxzB/ntNvPq6N5G2v2Q==", buffer);
    }
};

export default dummyStorageObject;
