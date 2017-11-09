
/**
 * Each blocked attempt produces a data containing fields of
 * ['type', 'stack', 'dataUrl']
 * 
 * This is then transfered to Notifier, and appended to trigger log
 * and passed to AlertController.
 * 
 */
export default interface ICanvasApiWrapper {
    /**
     * Wraps apis.
     */
    $apply(window:Window):void
}
