import { ApplyHandler } from "../proxy/IProxyService";

export const noop:ApplyHandler<any,void> = (...args) => {};
export const returnNull:ApplyHandler<any,null> = (orig, __this, _arguments) => null;
export const original = <T,R>(orig:func, __this:T, _arguments:IArguments|any[]):R => {
    return orig.apply(__this, _arguments);
};
