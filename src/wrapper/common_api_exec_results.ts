import IApiExecResult from "./IApiExecResult";

export class Notify<T> implements IApiExecResult<T> {
    constructor(
        public returned:T,
        private notify:boolean = true
    ) { }
    shouldNotify() {
        return this.notify;
    }
}
