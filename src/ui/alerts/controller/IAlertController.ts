import IStats from '../../../storage/IStats'
import { IAlertData } from '../message'

export default interface IAlertController {
    createOrUpdateAlert(alertData:IAlertData, stat:IStats):void
}
