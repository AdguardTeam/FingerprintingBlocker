export default interface IInterContextMessageHub {
    supported:boolean
    $window:Window
    parent:Window
    isTop:boolean
    on<T>(type:number, callback:(arg:T)=>void):void
    trigger<T>(type:number, data:T, target:Window):void
}
