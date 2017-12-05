import IStorage from './IStorage'

export default interface IGlobalSettingsStorage extends IStorage {
    getDomainStorage(domain:string):IStorage
}
