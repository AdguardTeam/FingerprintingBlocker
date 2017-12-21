import IAnonymizer from "./IAnonymizer";
import { ApplyHandler } from "../proxy/IProxyService";
import IApiExecResult from "./IApiExecResult";
import { Apis, EventType, Action } from "../notifier/BlockEvent";
import INotifier from "../notifier/INotifier";
import getStack from "../stack/stack";
import IStorage from "../storage/IStorage";
import { original } from "./common_apply_handlers";
import { Notify } from "./common_api_exec_results";

export default abstract class AbstractAnonymizer<T,R> implements IAnonymizer<T,R> {
    onAllow(orig, _this:T, _arguments:IArguments|any[]):IApiExecResult<R> {
        return new Notify(original(orig, _this, _arguments));
    }
    abstract onFake(orig, _this:T, _arguments:IArguments|any[]):IApiExecResult<R>
    abstract onBlock(orig, _this:T, _arguments:IArguments|any[]):IApiExecResult<R>
    abstract getData(orig, _this:T, _arguments:IArguments|any[]):any

    constructor(
        private storage:IStorage,
        private notifier:INotifier
    ) { }

    getCombinedHandler(api:Apis, type:EventType, domain:string):ApplyHandler<T,R> {
        return (orig, __this:T, _arguments) => {
            let stack = getStack();
            let action = this.storage.getAction();
            
            const dispatch = () => {
                this.notifier.dispatchBlockEvent(api, type, action, stack);
            };

            const doOriginal = ():R => {
                return original(orig, __this, _arguments);
            };

            let execResult:IApiExecResult<R>;

            switch (action) {
                case Action.ALLOW:
                    if (this.onAllow) {
                        execResult = this.onAllow(orig, __this, _arguments);
                        if (execResult.shouldNotify()) {
                            dispatch();
                        }
                        return execResult.returned;
                    }
                    dispatch();
                    return doOriginal();
                case Action.BLOCK: 
                    execResult = this.onBlock(orig, __this, _arguments);
                    if (execResult.shouldNotify()) {
                        dispatch();
                    }
                    return execResult.returned;
                case Action.FAKE:
                    execResult = this.onFake(orig, __this, _arguments);
                    if (execResult.shouldNotify()) {
                        dispatch();
                    }
                    return execResult.returned;
            }
        };
    }
}