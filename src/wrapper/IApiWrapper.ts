import IAnonymizer from "./IAnonymizer";
import { Apis, EventType } from "../event/BlockEvent";

export default interface IApiWrapper {
    $apply(window:Window):void
}
