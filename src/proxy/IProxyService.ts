export default interface IProxyService {
    wrapMethod<T, R>(obj:T, prop:PropertyKey, applyHandler?:ApplyHandler<T, R>):void
    wrapAccessor<T, R>(obj, prop:PropertyKey, getterApplyHandler?:ApplyHandler<T, R>, setterApplyHandler?:ApplyHandler<T, any>)
}

export type ApplyHandler<T, R> = (target:func, _this:T, _arguments:IArguments|any[]) => R