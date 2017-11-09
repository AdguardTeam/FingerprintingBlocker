import IProxyService from './IProxyService';

/**
 * A class used to share objects with same-origin child browsing contexts.
 */
export default interface ISharedObjectProvider {
    /**
     * @method registerObject assign a key for a constructor function.
     * When this class is initialized in a child browsing context, it checks whether a
     * SharedObjectProvider instance present in a parent browsing context passed objects
     * to be shared, and if such objects were passed, it returns that, and otherwise it
     * invokes the constructor to create a new one, and will pass it to child contexts.
     */
    registerObject<T>(key:number, factory:{ new():T }):T
    /**
     * @method initialize this method is used for lazy initialization of the instance
     * after ProxyService instance is created.
     */
    initialize(proxyService:IProxyService):void
}
