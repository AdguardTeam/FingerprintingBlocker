export default interface IApiExecResult<R> {
    returned:R
    shouldNotify():boolean
}
