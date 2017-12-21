import IAnonymizer from "./IAnonymizer";
import { Apis, EventType } from "../notifier/BlockEvent";

export default interface IApiWrapper {
    $apply(window:Window):void
}
