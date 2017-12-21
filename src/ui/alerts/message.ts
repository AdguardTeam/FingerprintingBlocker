import TBlockEvent from '../../notifier/BlockEvent'

// postMessage'able object used in Notifier.
export interface IAlertMessage {
    domain:string
    blockEvent:TBlockEvent
}

export interface IAlertData extends IAlertMessage {
    // Api based on Promise would have been clearer
    requestCurrentCanvasImage?(callback:(blob:Blob)=>void):void
}
