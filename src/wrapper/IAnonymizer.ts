import { ApplyHandler } from "../proxy/IProxyService";
import IApiExecResult from "./IApiExecResult";
import { Apis, EventType } from "../notifier/BlockEvent";

export default interface IAnonymizer<T,R> {
    readonly onAllow?:ApplyHandler<T,IApiExecResult<R>>
    readonly onFake:ApplyHandler<T,IApiExecResult<R>>
    readonly onBlock:ApplyHandler<T,IApiExecResult<R>>
    readonly getData?:ApplyHandler<T,any>
    getCombinedHandler(api:Apis, type:EventType, domain:string):ApplyHandler<T,R>
}
