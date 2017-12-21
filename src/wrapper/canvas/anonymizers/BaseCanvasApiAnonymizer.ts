import AbstractAnonymizer from "../../AbstractAnonymizer";
import IApiExecResult from "../../IApiExecResult";
import { ApplyHandler } from "../../../proxy/IProxyService";
import { Apis, EventType } from "../../../notifier/BlockEvent";
import { original } from "../../common_apply_handlers";
import * as log from '../../../shared/log';

export default abstract class CanvasApiAnonymizer<T,R> extends AbstractAnonymizer<T,R> {
    abstract onFake(orig, _this:T, _arguments:IArguments|any[]):IApiExecResult<R>
    abstract onBlock(orig, _this:T, _arguments:IArguments|any[]):IApiExecResult<R>

    abstract getData(orig, _this:T, _arguments:IArguments|any[]):any

    protected static MIN_CANVAS_SIZE_TO_BLOCK = 256;

    getCombinedHandler(api:Apis, type:EventType, domain:string):ApplyHandler<T,R> {
        const handler = super.getCombinedHandler(api, type, domain);
        return (orig, __this:T, _arguments) => {
            let canvas = this.getData(orig, __this, _arguments);
            if (canvas.width * canvas.height < CanvasApiAnonymizer.MIN_CANVAS_SIZE_TO_BLOCK) {
                log.print(`Allowing canvas readout for a canvas smaller than the minimum size...`);
                return original(orig, __this, _arguments);
            }
            return handler(orig, __this, _arguments);
        }
    }
}
