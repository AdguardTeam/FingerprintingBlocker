import IApiExecResult from "../IApiExecResult";
import * as log from '../../shared/log';

export class PixelFakeResult<T> implements IApiExecResult<T> {
    private static MIN_MODIFIED_BYTES_COUNT = 512;
    constructor(
        public returned:T,
        private modPixelCount:number
    ) { }
    shouldNotify() {
        if (this.modPixelCount < PixelFakeResult.MIN_MODIFIED_BYTES_COUNT) {
            log.print(`Modified pixel count is less than the minimum.`);
            return false;
        }
        return true;
    }
}
