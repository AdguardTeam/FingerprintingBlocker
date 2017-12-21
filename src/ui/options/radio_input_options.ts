import { Action } from '../../notifier/BlockEvent'
import FakingMode from '../../storage/FakingModesEnum'

export const ACTION_OPTIONS = [
    { id: Action.ALLOW, label: "Allow" },
    { id: Action.FAKE, label: "Fake" },
    { id: Action.BLOCK, label: "Block" }
];
export const SHOW_OPTIONS = [
    { id: true, label: 'Show' },
    { id: false, label: 'Don\'t show' }
]
export const WHITELIST_OPTIONS = [
    { id: true, label: 'true' },
    { id: false, label: 'false' }
]
export const FAKING_MODE_OPTIONS = [
    { id: FakingMode.EVERY_TIME, label: "everytime" },
    { id: FakingMode.PER_SESSION, label: "per session"},
    { id: FakingMode.PER_DOMAIN, label: "per domain" },
    { id: FakingMode.CONSTANT, label: "constant" }
];
