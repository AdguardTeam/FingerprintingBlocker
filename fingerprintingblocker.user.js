// ==UserScript==
// @name AdGuard Fingerprint Blocker Dev
// @namespace AdGuard
// @description	Blocks Fingerprinting
// @version 1.0.0
// @license LGPL
// @license https://github.com/AdguardTeam/FingerprintingBlocker/blob/master/LICENSE
// @downloadURL https://AdguardTeam.github.io/FingerprintingBlocker/fingerprintingblocker
// @updateURL https://AdguardTeam.github.io/FingerprintingBlocker/fingerprintingblocker.meta.js
// @supportURL https://github.com/AdguardTeam/FingerprintingBlocker/issues
// @homepageURL https://github.com/AdguardTeam/FingerprintingBlocker
// @match http://*/*
// @match https://*/*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_listValues
// @grant unsafeWindow
// @require https://cdnjs.cloudflare.com/ajax/libs/preact/8.2.6/preact.min.js
// @run-at document-start
// ==/UserScript==
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/*
 * Patched, originally from:
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = new Uint8Array(256);
for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}
function encode(bytes) {
    var len = bytes.length, base64 = "";
    for (var i_1 = 0; i_1 < len; i_1 += 3) {
        base64 += chars[bytes[i_1] >> 2];
        base64 += chars[((bytes[i_1] & 3) << 4) | (bytes[i_1 + 1] >> 4)];
        base64 += chars[((bytes[i_1 + 1] & 15) << 2) | (bytes[i_1 + 2] >> 6)];
        base64 += chars[bytes[i_1 + 2] & 63];
    }
    if ((len % 3) === 2) {
        base64 = base64.substring(0, base64.length - 1) + "=";
    }
    else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + "==";
    }
    return base64;
}
function decode(str, bytes) {
    var len = str.length;
    var i, p = 0;
    var encoded1, encoded2, encoded3, encoded4;
    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[str.charCodeAt(i)];
        encoded2 = lookup[str.charCodeAt(i + 1)];
        encoded3 = lookup[str.charCodeAt(i + 2)];
        encoded4 = lookup[str.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
}

var TypeGuards = /** @class */ (function () {
    function TypeGuards() {
    }
    TypeGuards.toString = Object.prototype.toString;
    TypeGuards.isUndef = function (obj) {
        return typeof obj === 'undefined';
    };
    TypeGuards.isUint8Array = function (obj) {
        return TypeGuards.toString.call(obj) === '[object Uint8Array]';
    };
    TypeGuards.isFloat32Array = function (obj) {
        return TypeGuards.toString.call(obj) === '[object Float32Array]';
    };
    TypeGuards.isAudioBuffer = function (obj) {
        return TypeGuards.toString.call(obj) === '[object AudioBuffer]';
    };
    TypeGuards.isHTMLElement = function (el) {
        return 'offsetLeft' in el;
    };
    return TypeGuards;
}());

var AbstractSettingsStorage = /** @class */ (function () {
    function AbstractSettingsStorage() {
        this.STATS_PREFIX = 'stats#';
        this.GLOBAL_SETTINGS_KEY = 'settings';
        this.now = Date.now;
    }
    AbstractSettingsStorage.prototype.init = function () {
        this.load();
        return this;
    };
    AbstractSettingsStorage.prototype.setAction = function (action) {
        this.$action = action;
        this.save();
    };
    AbstractSettingsStorage.prototype.setNotify = function (notify) {
        this.$notify = notify;
        this.save();
    };
    AbstractSettingsStorage.prototype.setWhitelisted = function (whitelisted) {
        this.$whitelisted = whitelisted;
        this.save();
    };
    AbstractSettingsStorage.prototype.setFakingmode = function (fakingMode) {
        this.$fakingMode = fakingMode;
        this.save();
    };
    AbstractSettingsStorage.prototype.setUpdateInterval = function (updateInterval) {
        this.$updateInterval = updateInterval;
        this.save();
    };
    AbstractSettingsStorage.prototype.getSalt = function () {
        if (TypeGuards.isUndef(this.$salt) ||
            this.now() - this.$lastUpdated > this.$updateInterval) {
            // Update salt and save it
            this.updateSalt();
        }
        else if (TypeGuards.isUndef(this.sessionSalt)) {
            // Convert encoded salt string to Int32Array and cache it
            this.sessionSalt = new Int32Array(4);
            decode(this.$salt, new Uint8Array(this.sessionSalt.buffer));
        }
        return this.sessionSalt;
    };
    AbstractSettingsStorage.prototype.updateSalt = function () {
        this.sessionSalt = this.getRandomSalt();
        this.$salt = encode(new Uint8Array(this.sessionSalt.buffer));
        this.$lastUpdated = this.now();
        this.save();
    };
    AbstractSettingsStorage.prototype.getRandomSalt = function () {
        var buffer = new Uint8Array(new ArrayBuffer(16));
        (window.crypto || window.msCrypto).getRandomValues(buffer);
        return new Int32Array(buffer.buffer);
    };
    AbstractSettingsStorage.prototype.getTriggerLog = function () {
        if (TypeGuards.isUndef(this.triggerLog))
            this.loadStat();
        return this.triggerLog;
    };
    AbstractSettingsStorage.prototype.getStat = function () {
        if (TypeGuards.isUndef(this.stats))
            this.loadStat();
        return this.stats;
    };
    AbstractSettingsStorage.prototype.appendEvent = function (evt, domain) {
        if (TypeGuards.isUndef(this.triggerLog))
            this.loadStat();
        var entry = {
            date: this.now(),
            api: evt.api,
            type: evt.type,
            action: evt.action,
            stack: evt.stack
        };
        if (domain) {
            entry.domain = domain;
        }
        this.triggerLog.push(entry);
        switch (evt.api) {
            case 0 /* canvas */:
                this.stats.canvasBlockCount++;
                break;
            case 1 /* audio */:
                this.stats.audioBlockCount++;
                break;
        }
        this.saveStat();
    };
    AbstractSettingsStorage.prototype.enumerateDomains = function () {
        var _this = this;
        var keys = GM_listValues();
        return keys.filter(function (key) {
            return key !== _this.GLOBAL_SETTINGS_KEY &&
                key.indexOf(_this.STATS_PREFIX) !== 0;
        });
    };
    return AbstractSettingsStorage;
}());

var DomainSettingsStorage = /** @class */ (function (_super) {
    __extends(DomainSettingsStorage, _super);
    function DomainSettingsStorage(domain, globalSettings) {
        var _this = _super.call(this) || this;
        _this.domain = domain;
        _this.globalSettings = globalSettings;
        return _this;
    }
    DomainSettingsStorage.prototype.load = function () {
        var domainSettingsStringified = GM_getValue(this.domain);
        if (TypeGuards.isUndef(domainSettingsStringified)) {
            return;
        }
        var domainSettings = JSON.parse(domainSettingsStringified);
        this.$action = domainSettings.action;
        this.$notify = domainSettings.notify;
        this.$whitelisted = domainSettings.whitelisted;
        this.$fakingMode = domainSettings.fakingMode;
        this.$updateInterval = domainSettings.updateInterval;
        this.$salt = domainSettings.salt;
        this.$lastUpdated = domainSettings.lastUpdated;
    };
    DomainSettingsStorage.prototype.save = function () {
        var domainSettings = {};
        var hasSpecificSettings = false;
        if (!TypeGuards.isUndef(this.$action)) {
            hasSpecificSettings = true;
            domainSettings.action = this.$action;
        }
        if (!TypeGuards.isUndef(this.$notify)) {
            hasSpecificSettings = true;
            domainSettings.notify = this.$notify;
        }
        if (!TypeGuards.isUndef(this.$whitelisted)) {
            hasSpecificSettings = true;
            domainSettings.whitelisted = this.$whitelisted;
        }
        if (!TypeGuards.isUndef(this.$fakingMode)) {
            hasSpecificSettings = true;
            domainSettings.fakingMode = this.$fakingMode;
        }
        if (!TypeGuards.isUndef(this.$updateInterval)) {
            hasSpecificSettings = true;
            domainSettings.updateInterval = this.$updateInterval;
        }
        if (!TypeGuards.isUndef(this.$salt)) {
            hasSpecificSettings = true;
            domainSettings.salt = this.$salt;
            domainSettings.lastUpdated = this.$lastUpdated;
        }
        if (hasSpecificSettings) {
            GM_setValue(this.domain, JSON.stringify(domainSettings));
        }
    };
    DomainSettingsStorage.prototype.getAction = function () {
        return this.getActionIsModified() ? this.$action : this.globalSettings.getAction();
    };
    DomainSettingsStorage.prototype.getActionIsModified = function () {
        return !TypeGuards.isUndef(this.$action);
    };
    DomainSettingsStorage.prototype.getNotify = function () {
        return this.getNotifyIsModified() ? this.$notify : this.globalSettings.getNotify();
    };
    DomainSettingsStorage.prototype.getNotifyIsModified = function () {
        return !TypeGuards.isUndef(this.$notify);
    };
    DomainSettingsStorage.prototype.getWhitelisted = function () {
        return this.getWhitelistedIsModified() ? this.$whitelisted : this.globalSettings.getWhitelisted();
    };
    DomainSettingsStorage.prototype.getWhitelistedIsModified = function () {
        return !TypeGuards.isUndef(this.$whitelisted);
    };
    DomainSettingsStorage.prototype.getFakingMode = function () {
        return this.getFakingModeIsModified() ? this.$fakingMode : this.globalSettings.getFakingMode();
    };
    DomainSettingsStorage.prototype.getFakingModeIsModified = function () {
        return !TypeGuards.isUndef(this.$fakingMode);
    };
    DomainSettingsStorage.prototype.getUpdateInterval = function () {
        return this.getUpdateIntervalIsModified() ? this.$updateInterval : this.globalSettings.getUpdateInterval();
    };
    DomainSettingsStorage.prototype.getUpdateIntervalIsModified = function () {
        return !TypeGuards.isUndef(this.$updateInterval);
    };
    DomainSettingsStorage.prototype.getSalt = function () {
        var fakingMode = this.getFakingMode();
        if (fakingMode === 0 /* EVERY_TIME */) {
            return this.getRandomSalt();
        }
        if (fakingMode === 3 /* CONSTANT */) {
            return this.globalSettings.getSalt(); // Get default salt
        }
        if (fakingMode === 1 /* PER_SESSION */) {
            if (TypeGuards.isUndef(this.sessionSalt)) {
                this.sessionSalt = this.getRandomSalt();
            }
            return this.sessionSalt;
        }
        // In case of PER_DOMAIN, extract salt from `this.$salt`.
        return _super.prototype.getSalt.call(this);
    };
    DomainSettingsStorage.prototype.getSaltIsModified = function () {
        return !TypeGuards.isUndef(this.$salt);
    };
    DomainSettingsStorage.prototype.getAnythingIsModifiedByUser = function () {
        return this.getActionIsModified() ||
            this.getNotifyIsModified() ||
            this.getWhitelistedIsModified() ||
            this.getFakingModeIsModified() ||
            this.getUpdateIntervalIsModified();
    };
    DomainSettingsStorage.prototype.loadStat = function () {
        this.triggerLog = [];
        var statsStringified = GM_getValue(this.STATS_PREFIX + this.domain);
        if (!TypeGuards.isUndef(statsStringified)) {
            var stats = JSON.parse(statsStringified);
            this.stats = {
                canvasBlockCount: stats.canvas,
                audioBlockCount: stats.audio
            };
        }
        else {
            this.stats = {
                canvasBlockCount: 0,
                audioBlockCount: 0
            };
        }
    };
    DomainSettingsStorage.prototype.saveStat = function () {
        if (this.stats.canvasBlockCount === 0 && this.stats.audioBlockCount === 0) {
            return;
        }
        var stats = {
            canvas: this.stats.canvasBlockCount,
            audio: this.stats.audioBlockCount
        };
        GM_setValue(this.STATS_PREFIX + this.domain, JSON.stringify(stats));
    };
    return DomainSettingsStorage;
}(AbstractSettingsStorage));

var GlobalSettingsStorage = /** @class */ (function (_super) {
    __extends(GlobalSettingsStorage, _super);
    function GlobalSettingsStorage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GlobalSettingsStorage.prototype.load = function () {
        var globalSettingsStringified = GM_getValue(this.GLOBAL_SETTINGS_KEY);
        if (!TypeGuards.isUndef(globalSettingsStringified)) {
            var globalSettings = JSON.parse(globalSettingsStringified);
            this.$action = globalSettings.defaultAction;
            this.$notify = globalSettings.defaultNotify;
            this.$whitelisted = globalSettings.defaultWhitelisted;
            this.$fakingMode = globalSettings.defaultFakingMode;
            this.$updateInterval = globalSettings.defaultUpdateInterval;
            this.globalKey = globalSettings.iframeKey;
            this.$salt = globalSettings.defaultSalt;
            this.$lastUpdated = globalSettings.lastUpdated;
        }
        else {
            this.$action = GlobalSettingsStorage.DEFAULT_ACTION;
            this.$notify = GlobalSettingsStorage.DEFAULT_NOTIFY;
            this.$whitelisted = GlobalSettingsStorage.DEFAULT_WHITELISTED;
            this.$fakingMode = GlobalSettingsStorage.DEFAULT_FAKING_MODE;
            this.$updateInterval = GlobalSettingsStorage.DEFAULT_UPDATE_INTERVAL;
            this.$salt = encode(new Uint8Array(this.getRandomSalt().buffer));
            this.$lastUpdated = this.now();
            this.globalKey = encode(new Uint8Array(this.getRandomSalt().buffer));
            this.save();
        }
    };
    GlobalSettingsStorage.prototype.save = function () {
        var globalSettings = {
            defaultAction: this.$action,
            defaultNotify: this.$notify,
            defaultWhitelisted: this.$whitelisted,
            defaultFakingMode: this.$fakingMode,
            defaultUpdateInterval: this.$updateInterval,
            defaultSalt: this.$salt,
            lastUpdated: this.now(),
            iframeKey: this.globalKey
        };
        GM_setValue(this.GLOBAL_SETTINGS_KEY, JSON.stringify(globalSettings));
    };
    GlobalSettingsStorage.prototype.getAction = function () {
        return this.$action;
    };
    GlobalSettingsStorage.prototype.getNotify = function () {
        return this.$notify;
    };
    GlobalSettingsStorage.prototype.getWhitelisted = function () {
        return this.$whitelisted;
    };
    GlobalSettingsStorage.prototype.getFakingMode = function () {
        return this.$fakingMode;
    };
    GlobalSettingsStorage.prototype.getUpdateInterval = function () {
        return this.$updateInterval;
    };
    GlobalSettingsStorage.prototype.loadStat = function () {
        var _this = this;
        var domains = this.enumerateDomains();
        this.triggerLog = [];
        this.stats = domains.map(function (domain) {
            return GM_getValue(_this.STATS_PREFIX + domain);
        }).reduce(function (prev, current) {
            prev.canvasBlockCount += current.canvas;
            prev.audioBlockCount += current.audio;
        }, {
            canvasBlockCount: 0,
            audioBlockCount: 0
        });
    };
    GlobalSettingsStorage.prototype.saveStat = function () { }; // Does nothing
    GlobalSettingsStorage.prototype.getDomainStorage = function (domain) {
        if (TypeGuards.isUndef(this.domainStorageMap)) {
            this.domainStorageMap = Object.create(null);
        }
        var domainStorage = this.domainStorageMap[domain];
        if (TypeGuards.isUndef(domainStorage)) {
            domainStorage = this.domainStorageMap[domain] = new DomainSettingsStorage(domain, this);
            domainStorage.init();
        }
        return domainStorage;
    };
    // Default global settings
    GlobalSettingsStorage.DEFAULT_ACTION = 0 /* ALLOW */;
    GlobalSettingsStorage.DEFAULT_NOTIFY = true;
    GlobalSettingsStorage.DEFAULT_WHITELISTED = false;
    GlobalSettingsStorage.DEFAULT_FAKING_MODE = 2 /* PER_DOMAIN */;
    // Time interval for hash update, in milliseconds.
    GlobalSettingsStorage.DEFAULT_UPDATE_INTERVAL = 24 * 60 * 60 * 1000;
    return GlobalSettingsStorage;
}(AbstractSettingsStorage));

/// <reference path="../../node_modules/closure-library.ts/closure-library.d.ts/all.d.ts"/>
/**
 * This is a HACK for tsickle and closure compiler:
 *   1. Closure compiler does not support @define flags in ES6 module yet
 *      See {@link https://github.com/google/closure-compiler/issues/1601}
 *         - Using `goog.module.declareLegacyNamespace` as described in
 *           {@link https://github.com/angular/tsickle/issues/434}
 *   2. Typescript does not sees `goog` namespace, and if declared, tsickle will include it
 *      in externs, which will colide with declarations that closure compiler already have
 *         - Use a triple-slash directive to reference typings defined in `node_modules`
 *           directory, because tsickle won't generate externs from types included in `node_modules`
 *
 * Once closure compiler supports es6-module-scoped @define variables or tsickle supports converting
 * such variables into closure compiler acceptible form, we will be able to drop this workaround.
 */

/** @define {boolean} */
var PRINT_LOGS = true;
var prefix = '';
var win = window;
while (win.parent !== win) {
    win = win.parent;
    prefix += '-- ';
}
prefix += '[FingerprintingBlocker] ';
var loc = location.href;
var suffix = "    (at " + loc + ")";



function print(str, obj) {
    if (PRINT_LOGS) {
        console.log(prefix + ("" + str + suffix));
        if (obj !== undefined) {
            console.log('=============================');
            console.log(obj);
            console.log('=============================');
        }
    }
}
/**
 * Accepts a function, and returns a wrapped function that calls `call` and `callEnd`
 * automatically before and after invoking the function, respectively.
 * @param fn A function to wrap
 * @param message
 * @param cond optional argument, the function argument will be passed to `cond` function,  and
 * its return value will determine whether to call `call` and `callEnd`.
 */

function throwMessage(thrown) {
    if (PRINT_LOGS) {
        throw thrown;
    }
}
function debuggerPause() {
    if (PRINT_LOGS) {
        debugger;
    }
}

/**
 * A polyfill for the WeakMap that covers only the most basic usage.
 * Originally based on {@link https://github.com/Polymer/WeakMap}
 */
var counter = Date.now() % 1e9;
var defineProperty = Object.defineProperty;
var WeakMapPolyfill$1 = /** @class */ (function () {
    function WeakMapPolyfill() {
        this.$name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
    }
    WeakMapPolyfill.prototype.set = function (key, value) {
        var entry = key[this.$name];
        if (entry && entry[0] === key)
            entry[1] = value;
        else
            defineProperty(key, this.$name, { value: [key, value], writable: true });
        return this;
    };
    WeakMapPolyfill.prototype.get = function (key) {
        var entry;
        return (entry = key[this.$name]) && entry[0] === key ?
            entry[1] : undefined;
    };
    WeakMapPolyfill.prototype.delete = function (key) {
        var entry = key[this.$name];
        if (!entry)
            return false;
        var hasValue = entry[0] === key;
        entry[0] = entry[1] = undefined;
        return hasValue;
    };
    WeakMapPolyfill.prototype.has = function (key) {
        var entry = key[this.$name];
        if (!entry)
            return false;
        return entry[0] === key;
    };
    return WeakMapPolyfill;
}());
var nativeWeakMapSupport = typeof WeakMap === 'function';
/**
 * Firefox has a buggy WeakMap implementation as of 58. It won't accept
 * certain objects which are relatively recently added to the engine.
 * {@link https://bugzilla.mozilla.org/show_bug.cgi?id=1391116}
 * {@link https://bugzilla.mozilla.org/show_bug.cgi?id=1351501}
 * A similar error prevents using `AudioBuffer` as a key.
 */
var buggyWeakMapSupport = !nativeWeakMapSupport ? false : (function () {
    if (typeof DOMPoint !== 'function') {
        return false;
    }
    var key = new DOMPoint();
    var weakmap = new WeakMap();
    try {
        weakmap.set(key, undefined); // Firefox 58 throws here.
        return false;
    }
    catch (e) {
        print('Buggy WeakMap support');
        return true;
    }
})();
// To be used in AudioBufferCache
var NonBuggyWeakMap = nativeWeakMapSupport && !buggyWeakMapSupport ? WeakMap : WeakMapPolyfill$1;
var wm$1 = nativeWeakMapSupport ? WeakMap : WeakMapPolyfill$1;

var ProxyService = /** @class */ (function () {
    function ProxyService() {
        var _this = this;
        this.proxyToReal = new wm$1();
        this.realToProxy = new wm$1();
        this.invokeWithUnproxiedThis = function (target, __this, _arguments) {
            var unproxied = _this.proxyToReal.get(__this);
            if (typeof unproxied == 'undefined') {
                unproxied = __this;
            }
            return target.apply(unproxied, _arguments);
        };
    }
    ProxyService.prototype.copyProperty = function (orig, wrapped, prop) {
        var desc = Object.getOwnPropertyDescriptor(orig, prop);
        if (desc && desc.configurable) {
            desc.value = orig[prop];
            Object.defineProperty(wrapped, prop, desc);
        }
    };
    ProxyService.prototype.makeFunctionWrapper = function (orig, applyHandler) {
        var wrapped = function () { return applyHandler(orig, this, arguments); };
        this.copyProperty(orig, wrapped, 'name');
        this.copyProperty(orig, wrapped, 'length');
        this.proxyToReal.set(wrapped, orig);
        this.realToProxy.set(orig, wrapped);
        return wrapped;
    };
    ProxyService.prototype.wrapMethod = function (obj, prop, applyHandler) {
        if (obj.hasOwnProperty(prop)) {
            obj[prop] = this.makeFunctionWrapper(obj[prop], applyHandler);
        }
    };
    ProxyService.prototype.wrapAccessor = function (obj, prop, getterApplyHandler, setterApplyHandler) {
        var desc = Object.getOwnPropertyDescriptor(obj, prop);
        if (desc && desc.get && desc.configurable) {
            var getter = this.makeFunctionWrapper(desc.get, getterApplyHandler);
            var setter;
            if (desc.set) {
                setter = this.makeFunctionWrapper(desc.set, setterApplyHandler);
            }
            Object.defineProperty(obj, prop, {
                get: getter,
                set: setter,
                configurable: true,
                enumerable: desc.enumerable
            });
        }
    };
    ProxyService.prototype.$apply = function (window) {
        var functionPType = window.Function.prototype;
        this.wrapMethod(functionPType, 'toString', this.invokeWithUnproxiedThis);
        this.wrapMethod(functionPType, 'toSource', this.invokeWithUnproxiedThis);
    };
    return ProxyService;
}());

/**
 * Detects about:blank, about:srcdoc urls.
 */
var ABOUT_PROTOCOL = 'about:';
var reEmptyUrl = new RegExp('^' + ABOUT_PROTOCOL);
var isEmptyUrl = function (url) {
    return reEmptyUrl.test(url);
};

/**
 * There are certain browser quirks regarding how they treat non-string values
 * provided as arguments of `window.open`, and we can't rely on third-party scripts
 * playing nicely with it.
 * undefined --> 'about:blank'
 * null --> 'about:blank', except for Firefox, in which it is converted to 'null'.
 * false --> 'about:blank', except for Edge, in which it is converted to 'false'.
 * These behaviors are different from how anchor tag's href attributes behaves with non-string values.
 */

/**
 * Creates an object that implements properties of Location api.
 */
var createLocation = function (href) {
    var anchor = document.createElement('a');
    anchor.href = href;
    // https://gist.github.com/disnet/289f113e368f1bfb06f3
    if (anchor.host == "") {
        anchor.href = anchor.href;
    }
    return anchor;
};
/**
 * Determines whether 2 contexts A and B are in the same origin.
 * @param url_A absolute or relative url of the context A
 * @param location_B location object of the context B
 * @param domain_B `document.domain` of the context B
 */
var isSameOrigin = function (url_A, location_B, domain_B) {
    var location_A = createLocation(url_A);
    if (location_A.protocol === 'javascript:' || location_A.href === 'about:blank') {
        return true;
    }
    if (location_A.protocol === 'data:') {
        return false;
    }
    return location_A.hostname === domain_B && location_A.port === location_B.port && location_A.protocol === location_B.protocol;
};

var ChildContextInjector = /** @class */ (function () {
    function ChildContextInjector($window, proxyService, globalKey) {
        this.$window = $window;
        this.globalKey = globalKey;
        this.callbacks = [];
        this.onFrameLoad = this.onFrameLoad.bind(this);
        this.executeCodeOnGet = this.executeCodeOnGet.bind(this);
        // Initialize
        var iframePType = this.$window.HTMLIFrameElement.prototype;
        this.getContentWindow = Object.getOwnPropertyDescriptor(iframePType, 'contentWindow').get;
        this.getContentDocument = Object.getOwnPropertyDescriptor(iframePType, 'contentDocument').get;
        this.frameToDocument = new wm$1();
        proxyService.wrapAccessor(iframePType, 'contentWindow', this.executeCodeOnGet);
        proxyService.wrapAccessor(iframePType, 'contentDocument', this.executeCodeOnGet);
    }
    ChildContextInjector.prototype.executeCodeOnGet = function (_get, __this) {
        var prevDoc = this.frameToDocument.get(__this);
        if (TypeGuards.isUndef(prevDoc)) {
            // New iframe elements
            print("ChildContextInjector: attaching an event listener to a first met frame");
            __this.addEventListener('load', this.onFrameLoad);
            try {
                var contentWin = this.getContentWindow.call(__this);
                if (contentWin.location.protocol === ABOUT_PROTOCOL) {
                    print("ChildContextInjector: new child context encountered.", __this.outerHTML);
                    this.frameToDocument.set(__this, contentWin.document);
                    this.processChildWindow(contentWin);
                    /**
                     * {@link https://dev.w3.org/html5/spec-preview/history.html#navigate}
                     *
                     *    First, a new Window object must be created and associated with the Document, with one exception:
                     *    if the browsing context's only entry in its session history is the about:blank Document that was
                     *    added when the browsing context was created, and navigation is occurring with replacement enabled,
                     *    and that Document has the same origin as the new Document, then the Window object of that Document
                     *    must be used instead, and the document attribute of the Window object must be changed to point to
                     *    the new Document instead.
                     *
                     * This exception clause is applied when there is an iframe whose src attribute is set to be same-origin,
                     * and its `contentWindow` is accessed after the iframe is attached to the document very quickly,
                     * either synchronously or in the next microtask queue.
                     * Note that, how such uninitialized empty frames' origins are treated can be browser-dependent.
                     * In such cases, the `Window` object will reused by the newly loaded document, so we set a global flag
                     * in order to prevent userscripts loaded to the document from running, to avoid overriding DOM Apis
                     * twice.
                     */
                    var src = __this.src;
                    if (src && this.globalKey && isSameOrigin(src, this.$window.location, this.$window.document.domain)) {
                        print("ChildContextInjector: setting globalKey");
                        ChildContextInjector.setNonEnumerableValue(contentWin, this.globalKey, undefined);
                    }
                }
            }
            catch (e) {
                this.frameToDocument.set(__this, null);
            }
        }
        return _get.call(__this);
    };
    
    /**
     * This should be called when we are sure that `childWindow` is not subject to
     * CORS restrictions.
     */
    ChildContextInjector.prototype.processChildWindow = function (childWindow) {
        var callbacks = this.callbacks;
        for (var i = 0, l = callbacks.length; i < l; i++) {
            callbacks[i](childWindow);
        }
    };
    ChildContextInjector.prototype.onFrameLoad = function (evt) {
        var iframe = evt.target;
        try {
            var document_1 = this.getContentDocument.call(iframe);
            // If a loaded document has empty location, and it is different from the previous document,
            // We execute the callback again.
            if (document_1.location.protocol === ABOUT_PROTOCOL && this.frameToDocument.get(iframe) !== document_1) {
                print("ChildContextInjector: a content of an empty iframe has changed.");
                this.frameToDocument.set(iframe, document_1);
                this.processChildWindow(document_1.defaultView);
            }
        }
        catch (e) {
            this.frameToDocument.set(iframe, null);
        }
    };
    ChildContextInjector.setNonEnumerableValue = function (owner, prop, value) {
        Object.defineProperty(owner, prop, {
            value: value,
            configurable: true
        });
    };
    ChildContextInjector.prototype.registerCallback = function (callback) {
        this.callbacks.push(callback);
    };
    return ChildContextInjector;
}());

var canvasApiName = [
    'HTMLCanvasElement#toDataURL',
    'HTMLCanvasElement#toBlob',
    'HTMLCanvasElement#mozGetAsFile',
    'CanvasRenderingContext2D#getImageData',
    'WebGLRenderingContext#readPixels',
    'WebGL2RenderingContext#readPixels'
];
var audioApiName = [
    'AudioBuffer#getChannelData',
    'AnalyserNode#getFloatFrequencyData',
    'AnalyserNode#getFloatTimeDomainData',
    'AnalyserNode#getByteFrequencyData',
    'AnalyserNode#getByteTimeDomainData'
];
function getApiName(api, type) {
    switch (api) {
        case 0 /* canvas */:
            return canvasApiName[type];
        case 1 /* audio */:
            return audioApiName[type];
    }
}
var CanvasBlockEvent = /** @class */ (function () {
    function CanvasBlockEvent(type, action, stack, data) {
        this.type = type;
        this.action = action;
        this.stack = stack;
        this.data = data;
        this.api = 0 /* canvas */;
    }
    return CanvasBlockEvent;
}());
var AudioBlockEvent = /** @class */ (function () {
    function AudioBlockEvent(type, action, stack, data) {
        this.type = type;
        this.action = action;
        this.stack = stack;
        this.data = data;
        this.api = 1 /* audio */;
    }
    return AudioBlockEvent;
}());

var Notifier = /** @class */ (function () {
    function Notifier(messageHub, storage, alertController) {
        this.messageHub = messageHub;
        this.storage = storage;
        this.alertController = alertController;
        this.installAlertDataTransferrer();
    }
    Notifier.prototype.onBlock = function (evt) {
        // this.latestCanvas = evt.data;
        // delete non-transferrable object
        delete evt.data;
        if (this.storage.getNotify()) {
            // produces AlertData interface.
            var alertMessage = {
                domain: this.storage.domain,
                blockEvent: evt
            };
            this.transferAlertData(alertMessage);
        }
    };
    Notifier.prototype.installAlertDataTransferrer = function () {
        var _this = this;
        if (this.messageHub.isTop) {
            this.transferAlertData = function (data) {
                (typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout)(function () {
                    _this.storage.appendEvent(data.blockEvent);
                    var stat = _this.storage.getStat();
                    _this.alertController.createOrUpdateAlert(data, stat);
                });
            };
        }
        else {
            // Pass the message to the top.
            this.transferAlertData = function (data) {
                _this.messageHub.trigger(0, data, _this.messageHub.parent);
            };
        }
        this.messageHub.on(0, this.transferAlertData);
    };
    Notifier.prototype.dispatchBlockEvent = function (api, type, action, stack, data) {
        var event;
        if (api === 0 /* canvas */) {
            event = new CanvasBlockEvent(type, action, stack, data);
        }
        else {
            event = new AudioBlockEvent(type, action, stack, data);
        }
        this.onBlock(event);
    };
    return Notifier;
}());

var InterContextMessageHub = /** @class */ (function () {
    function InterContextMessageHub(window, parentInstance) {
        var _this = this;
        this.$window = window;
        var supported = this.supported = typeof WeakMap === 'function';
        var parent = this.parent = window.parent;
        var isTop = this.isTop = window.top === window;
        var isEmpty = isEmptyUrl(location.href);
        var channel = !isTop && supported ? new MessageChannel() : null;
        if (supported) {
            this.framePortMap = new WeakMap();
            // Listens for handshake messages
            window.addEventListener('message', function (evt) {
                _this.handshake(evt);
            });
            // Passes message port to parent context.
            if (parentInstance) {
                parentInstance.registerChildPort(window, channel.port1);
            }
            else if (!isTop) {
                print("sending message from " + window.location.href + " to parent...");
                print("readystate is: " + window.document.readyState);
                parent.postMessage(InterContextMessageHub.MAGIC, '*', [channel.port1]);
                this.parentPort = channel.port2;
                this.parentPort.onmessage = function (evt) { _this.onMessage(evt); };
            }
            this.typeCallbackMap = [];
        }
    }
    InterContextMessageHub.prototype.handshake = function (evt) {
        var _this = this;
        if (evt.data !== InterContextMessageHub.MAGIC) {
            // `MAGIC` indicates that this message is sent by the popupblocker from the child frame.
            return;
        }
        var source = evt.source;
        // From now on, propagation of event must be stopped.
        receivePort: {
            if (TypeGuards.isUndef(source)) {
                // evt.source can be undefiend when an iframe has been removed from the document before the message is received.
                break receivePort;
            }
            if (this.framePortMap.has(source)) {
                var frameData = this.framePortMap.get(source);
                if (frameData.locationObject === source.location) {
                    print("Received a port from a frame that we already met. This could be a bug");
                    debuggerPause();
                    break receivePort;
                }
                print("Received a port from a known frame, but location object has updated");
                // Such frames have already sent its message port, we do not accept additional ports.
            }
            // log.print('received a message from:', evt.source);
            var port = evt.ports[0]; // This is a port that a child frame sent.
            port.onmessage = function (evt) {
                _this.onMessage(evt);
            };
            this.framePortMap.set(source, {
                messagePort: port,
                locationObject: source.location
            });
        }
        evt.stopImmediatePropagation();
        evt.preventDefault();
    };
    InterContextMessageHub.prototype.registerChildPort = function (child, port) {
        print('MessageHub: registering child context directly..');
        this.framePortMap.set(child, {
            messagePort: port,
            locationObject: child.location
        });
    };
    InterContextMessageHub.prototype.onMessage = function (evt) {
        var data = evt.data;
        this.triggerCallback(data.type, data.data, evt.source);
    };
    InterContextMessageHub.prototype.triggerCallback = function (type, data, source) {
        var callback = this.typeCallbackMap[type];
        if (callback) {
            callback(data, source);
        }
    };
    InterContextMessageHub.prototype.on = function (type, callback) {
        if (!TypeGuards.isUndef(this.typeCallbackMap[type])) {
            throwMessage('Tried to re-assign a callback for an event type');
        }
        this.typeCallbackMap[type] = callback;
    };
    InterContextMessageHub.prototype.trigger = function (type, data, target, transferList) {
        if (!this.supported) {
            // if WeakMap is not supported, this method will only work when
            // the target is the same browsing context.
            if (target === this.$window) {
                this.triggerCallback(type, data, this.$window);
            }
            return;
        }
        var port;
        if (target === this.parent) {
            port = this.parentPort;
        }
        else {
            port = this.framePortMap.get(target).messagePort;
        }
        if (!port) {
            return;
        }
        var msgData = {
            type: type,
            data: data
        };
        port.postMessage(msgData, transferList);
    };
    InterContextMessageHub.MAGIC = 'fpb_handshake';
    return InterContextMessageHub;
}());

// https://gist.github.com/wellcaffeinated/5399067#gistcomment-1364265
var SIZE_64_KB = 65536; // This equals to the size of 128 * 128 canvas.
var SIZE_64_MB = 67108864;
/**
 * Returns `Math.ceil(log_2(num))` for positive integer `num`.
 */
function ln2(num) {
    var i = 0;
    for (num--; num !== 0; i++) {
        num = num >> 1;
    }
    return i;
}
function nextValidHeapSize(realSize) {
    if (!realSize || realSize <= SIZE_64_KB) {
        return SIZE_64_KB;
    }
    else if (realSize <= SIZE_64_MB) {
        return 1 << ln2(realSize);
    }
    else {
        return SIZE_64_MB * Math.ceil(realSize / SIZE_64_MB);
    }
}
/**
 * Polyfill of Math.imul for IE.
 */
function imul(a, b) {
    var ah = (a >>> 16) & 0xffff;
    var al = a & 0xffff;
    var bh = (b >>> 16) & 0xffff;
    var bl = b & 0xffff;
    // the shift by 0 fixes the sign on the high part
    // the final |0 converts the unsigned value into a signed value
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
}

var BufferManager = /** @class */ (function () {
    function BufferManager() {
    }
    BufferManager.prototype.getModule = function (size, stdlib, asmModule) {
        if (!this.buffer || size > this.buffer.byteLength) {
            var bufferSize = nextValidHeapSize(size);
            this.buffer = new ArrayBuffer(bufferSize);
        }
        if (!stdlib.Math.imul) {
            stdlib.Math.imul = imul;
        }
        return asmModule(stdlib, null, this.buffer);
    };
    BufferManager.getInstance = function () {
        if (!this.instance) {
            this.instance = new BufferManager();
        }
        return this.instance;
    };
    return BufferManager;
}());

function crop(data, x, y, w, h, orig_w, orig_h, translated) {
    for (var origOffset = (y * orig_w + x) << 2, targetOffset = 0, counter = 0; counter < h; counter++, origOffset += (orig_w << 2), targetOffset += (w << 2)) {
        translated.set(data.subarray(origOffset, origOffset + (w << 2)), targetOffset);
    }
}
var CanvasProcessor = /** @class */ (function () {
    function CanvasProcessor(storage, $window) {
        this.storage = storage;
        this.$window = $window;
        this.bufferManager = BufferManager.getInstance();
        // Stores native methods here, which will be overridden later.
        this.getContext = HTMLCanvasElement.prototype.getContext;
        this.getImageData = CanvasRenderingContext2D.prototype.getImageData;
    }
    CanvasProcessor.prototype.createImageData = function (w, h) {
        try {
            return new ImageData(w, h);
        }
        catch (e) {
            // IE does not support ImageData constructor.
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            return this.getImageData.call(this.getContext.call(canvas, '2d'), 0, 0, w, h);
        }
    };
    CanvasProcessor.prototype.initialize2DNoiser = function (size) {
        if (!this.noiseApplyer2D || size > this.bufferManager.buffer.byteLength) {
            var init_start = performance.now();
            this.noiseApplyer2D = this.bufferManager.getModule(size, this.$window, bitmapNoiseApplier);
            var init_end = performance.now();
            print("Initializing noiser took " + (init_end - init_start) + " ms.");
        }
    };
    /**
     * Beware: this does _not_ apply noise to pixels on 4 borders.
     */
    CanvasProcessor.prototype.addNoiseToBitmap = function (writeBuffCb, sx, // x-coord in which `data` is extracted from
        sy, // y-coord in which `data` is extracted from
        width, // width of `data`
        height, // height of `data`
        origWidth, // width of a data from which `data` is extracted
        origHeight // height of a data from which `data` is extracted
    ) {
        var dataSize = (width * height) << 2;
        var bufferSize = dataSize + CanvasProcessor.DATA_OFFSET;
        this.initialize2DNoiser(bufferSize);
        writeBuffCb(new Uint8Array(this.bufferManager.buffer));
        var h = this.storage.getSalt();
        var start = performance.now();
        var result = this.noiseApplyer2D._apply_noise(CanvasProcessor.DATA_OFFSET, sx, sy, width, height, origWidth, origHeight, h[0], h[1], h[2], h[3]);
        var end = performance.now();
        print("Total " + result + " values have been modified.");
        print("Elapsed: " + (end - start) + " ms.");
        print("Canvas size was " + width + " * " + height);
        return {
            $data: new Uint8Array(this.bufferManager.buffer, CanvasProcessor.DATA_OFFSET, dataSize),
            $result: result //this.resultBuffer32[0]
        };
    };
    CanvasProcessor.prototype.addNoiseToFloatArray = function (data, sx, sy, width, height) {
        // Just a stub
        return;
    };
    CanvasProcessor.prototype.clone2DCanvasWithNoise = function (canvas, contextType) {
        // ToDo: make this type safe
        var w = canvas.width, h = canvas.height;
        var context; // A canvas rendering context, to read ImageData from.
        var cloned2dCanvas;
        if (contextType === '2d') {
            context = this.getContext.call(canvas, '2d');
        }
        else {
            var cloned2dCanvas_1 = document.createElement('canvas');
            cloned2dCanvas_1.width = w;
            cloned2dCanvas_1.height = h;
            context = this.getContext.call(cloned2dCanvas_1, '2d');
            context.drawImage(canvas, 0, 0, w, h);
        }
        var imageData = this.getImageData.call(context, -1, -1, w + 2, h + 2);
        var data = imageData.data;
        var _a = this.addNoiseToBitmap(function (buffView) { buffView.set(data); }, -1, -1, w + 2, h + 2, w, h), noiseApplied = _a.$data, $result = _a.$result;
        if ($result) {
            imageData.data.set(noiseApplied);
            cloned2dCanvas = cloned2dCanvas || document.createElement('canvas');
            cloned2dCanvas.width = w;
            cloned2dCanvas.height = h;
            this.getContext.call(cloned2dCanvas, '2d').putImageData(imageData, 1, 1, 0, 0, w, h);
            return {
                $data: cloned2dCanvas,
                $result: $result
            };
        }
        else {
            return {
                $data: canvas,
                $result: $result
            };
        }
    };
    CanvasProcessor.DATA_OFFSET = 0;
    return CanvasProcessor;
}());

var CanvasModeTracker = /** @class */ (function () {
    function CanvasModeTracker(proxyService) {
        this.proxyService = proxyService;
        this.canvasModeMap = new wm$1();
        this.trackCanvasContextStatus = this.trackCanvasContextStatus.bind(this);
    }
    CanvasModeTracker.prototype.trackCanvasContextStatus = function (orig, __this, _arguments) {
        var context = orig.apply(__this, _arguments);
        if (context !== null) {
            this.canvasModeMap.set(__this, _arguments[0]);
        }
        return context;
    };
    CanvasModeTracker.prototype.getCanvasMode = function (canvas) {
        return this.canvasModeMap.get(canvas);
    };
    CanvasModeTracker.prototype.$apply = function (window) {
        this.proxyService.wrapMethod(window.HTMLCanvasElement.prototype, 'getContext', this.trackCanvasContextStatus);
    };
    return CanvasModeTracker;
}());

var AudioProcessor = /** @class */ (function () {
    function AudioProcessor(storage, $window) {
        this.storage = storage;
        this.$window = $window;
        this.addNoiseToFloatFrequencyData = this.methodFactory('_noise_to_frequency', false);
        this.addNoiseToFloatTimeDomainData = this.methodFactory('_noise_to_byte_frequency', false);
        this.addNoiseToByteFrequencyData = this.methodFactory('_noise_to_byte_frequency', true);
        this.addNoiseToByteTimeDomainData = this.methodFactory('_noise_to_byte_time_domain', true);
        this.bufferManager = BufferManager.getInstance();
    }
    AudioProcessor.prototype.initializeNoiser = function (size) {
        if (!this.audioNoiseApplyer || size > this.bufferManager.buffer.byteLength) {
            var init_start = performance.now();
            this.audioNoiseApplyer = this.bufferManager.getModule(size, this.$window, audioNoiseApplier);
            var init_end = performance.now();
            print("initializing audio noiser took " + (init_end - init_start) + " ms.");
        }
    };
    AudioProcessor.prototype.methodFactory = function (exportedFnName, byte) {
        var _this = this;
        return function (writeBuffCb, size) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var byteLength = size;
            if (!byte) {
                byteLength <<= 2;
            }
            _this.initializeNoiser(byteLength);
            var buff = _this.bufferManager.buffer;
            var buffView = (byte ? new Uint8Array(buff, 0, size) : new Float32Array(buff, 0, size));
            writeBuffCb(buffView);
            var h = _this.storage.getSalt();
            var start = performance.now();
            // Avoid using spread operator, prevent closure compiler emitting useless symbol polyfill.
            // this.audioNoiseApplyer[exportedFnName]
            //   (AudioProcessor.DATA_OFFSET, size, ...(<number[]>args), h[0], h[1], h[2], h[3]);
            var moduleArg = [AudioProcessor.DATA_OFFSET, size];
            Array.prototype.push.apply(moduleArg, args);
            moduleArg.push(h[0], h[1], h[2], h[3]);
            _this.audioNoiseApplyer[exportedFnName].apply(null, moduleArg);
            var end = performance.now();
            print("Calling asm.js function took " + (end - start) + "ms.");
            return buffView;
        };
    };
    AudioProcessor.DATA_OFFSET = 0;
    return AudioProcessor;
}());

var original = function (orig, __this, _arguments) {
    return orig.apply(__this, _arguments);
};

var AudioBufferCache = /** @class */ (function () {
    function AudioBufferCache(proxyService) {
        this.proxyService = proxyService;
        this.channelDataCache = new NonBuggyWeakMap();
        this.trackOutputAudioBuffer = this.trackOutputAudioBuffer.bind(this);
    }
    AudioBufferCache.prototype.trackOutputAudioBuffer = function (orig, __this, _arguments) {
        var buffer = original(orig, __this, _arguments);
        if (TypeGuards.isAudioBuffer(buffer)) {
            if (!this.channelDataCache.has(buffer)) {
                this.channelDataCache.set(buffer, undefined);
            }
        }
        return buffer;
    };
    AudioBufferCache.prototype.shouldBeProcessed = function (buffer) {
        return this.channelDataCache.has(buffer);
    };
    AudioBufferCache.prototype.getProcessedChannelData = function (buffer, channel) {
        var cached = this.channelDataCache.get(buffer);
        if (TypeGuards.isUndef(cached)) {
            return undefined;
        }
        return cached[channel];
    };
    AudioBufferCache.prototype.setProcessedChannelData = function (buffer, channel, data) {
        var cached = this.channelDataCache.get(buffer);
        if (TypeGuards.isUndef(cached)) {
            cached = [];
            this.channelDataCache.set(buffer, cached);
        }
        cached[channel] = data;
    };
    AudioBufferCache.prototype.$apply = function (window) {
        this.proxyService.wrapAccessor(window.AudioProcessingEvent.prototype, 'inputBuffer', this.trackOutputAudioBuffer);
        if (TypeGuards.isUndef(window.OfflineAudioContext)) {
            return;
        }
        this.proxyService.wrapAccessor(window.OfflineAudioCompletionEvent.prototype, 'renderedBuffer', this.trackOutputAudioBuffer);
    };
    return AudioBufferCache;
}());

/**
 * @todo Use stack 'boundary' function
 */
function getStack() {
    if ('captureStackTrace' in Error) {
        // https://github.com/v8/v8/wiki/Stack-Trace-API
        var prevLimit = Error['stackTraceLimit'];
        Error['stackTraceLimit'] = Infinity;
        var dummyErrorObj = Object.create(null);
        Error['captureStackTrace'](dummyErrorObj, getStack);
        Error['stackTraceLimit'] = prevLimit;
        return dummyErrorObj.stack;
    }
    var error = new Error();
    try {
        throw error;
    }
    catch (e) {
        return e.stack;
    }
}

var Notify = /** @class */ (function () {
    function Notify(returned, notify) {
        if (notify === void 0) { notify = true; }
        this.returned = returned;
        this.notify = notify;
    }
    Notify.prototype.shouldNotify = function () {
        return this.notify;
    };
    return Notify;
}());

var AbstractAnonymizer = /** @class */ (function () {
    function AbstractAnonymizer(storage, notifier) {
        this.storage = storage;
        this.notifier = notifier;
    }
    AbstractAnonymizer.prototype.onAllow = function (orig, _this, _arguments) {
        return new Notify(original(orig, _this, _arguments));
    };
    AbstractAnonymizer.prototype.getCombinedHandler = function (api, type, domain) {
        var _this = this;
        return function (orig, __this, _arguments) {
            var stack = getStack();
            var action = _this.storage.getAction();
            var dispatch = function () {
                _this.notifier.dispatchBlockEvent(api, type, action, stack);
            };
            var doOriginal = function () {
                return original(orig, __this, _arguments);
            };
            var execResult;
            switch (action) {
                case 0 /* ALLOW */:
                    if (_this.onAllow) {
                        execResult = _this.onAllow(orig, __this, _arguments);
                        if (execResult.shouldNotify()) {
                            dispatch();
                        }
                        return execResult.returned;
                    }
                    dispatch();
                    return doOriginal();
                case 2 /* BLOCK */:
                    execResult = _this.onBlock(orig, __this, _arguments);
                    if (execResult.shouldNotify()) {
                        dispatch();
                    }
                    return execResult.returned;
                case 1 /* FAKE */:
                    execResult = _this.onFake(orig, __this, _arguments);
                    if (execResult.shouldNotify()) {
                        dispatch();
                    }
                    return execResult.returned;
            }
        };
    };
    return AbstractAnonymizer;
}());

var CanvasApiAnonymizer = /** @class */ (function (_super) {
    __extends(CanvasApiAnonymizer, _super);
    function CanvasApiAnonymizer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CanvasApiAnonymizer.prototype.getCombinedHandler = function (api, type, domain) {
        var _this = this;
        var handler = _super.prototype.getCombinedHandler.call(this, api, type, domain);
        return function (orig, __this, _arguments) {
            var canvas = _this.getData(orig, __this, _arguments);
            if (canvas.width * canvas.height < CanvasApiAnonymizer.MIN_CANVAS_SIZE_TO_BLOCK) {
                print("Allowing canvas readout for a canvas smaller than the minimum size...");
                return original(orig, __this, _arguments);
            }
            return handler(orig, __this, _arguments);
        };
    };
    CanvasApiAnonymizer.MIN_CANVAS_SIZE_TO_BLOCK = 256;
    return CanvasApiAnonymizer;
}(AbstractAnonymizer));

var PixelFakeResult = /** @class */ (function () {
    function PixelFakeResult(returned, modPixelCount) {
        this.returned = returned;
        this.modPixelCount = modPixelCount;
    }
    PixelFakeResult.prototype.shouldNotify = function () {
        if (this.modPixelCount < PixelFakeResult.MIN_MODIFIED_BYTES_COUNT) {
            print("Modified pixel count is less than the minimum.");
            return false;
        }
        return true;
    };
    PixelFakeResult.MIN_MODIFIED_BYTES_COUNT = 512;
    return PixelFakeResult;
}());

var CanvasElementMethodsAnonymizer = /** @class */ (function (_super) {
    __extends(CanvasElementMethodsAnonymizer, _super);
    function CanvasElementMethodsAnonymizer(storage, notifier, canvasProcessor, canvasModeTracker) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.canvasProcessor = canvasProcessor;
        _this.canvasModeTracker = canvasModeTracker;
        return _this;
    }
    CanvasElementMethodsAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var contextType = this.canvasModeTracker.getCanvasMode(__this);
        var result = 0;
        var fakedCanvas = __this;
        if (contextType) {
            var _a = this.canvasProcessor.clone2DCanvasWithNoise(__this, contextType), $data = _a.$data, $result = _a.$result;
            fakedCanvas = $data;
            result = $result;
        }
        return new PixelFakeResult(original(orig, fakedCanvas, _arguments), result);
    };
    CanvasElementMethodsAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        // Creates an empty canvas having the same dimension.
        if (!this.emptyCanvas) {
            this.emptyCanvas = document.createElement('canvas');
        }
        this.emptyCanvas.width = __this.width;
        this.emptyCanvas.height = __this.height;
        return new PixelFakeResult(original(orig, this.emptyCanvas, _arguments), Number.MAX_SAFE_INTEGER);
    };
    CanvasElementMethodsAnonymizer.prototype.getData = function (orig, __this, _arguments) {
        return __this;
    };
    return CanvasElementMethodsAnonymizer;
}(CanvasApiAnonymizer));

var ImgDataAccessAnonymizer = /** @class */ (function (_super) {
    __extends(ImgDataAccessAnonymizer, _super);
    function ImgDataAccessAnonymizer(storage, notifier, canvasProcessor) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.canvasProcessor = canvasProcessor;
        return _this;
    }
    ImgDataAccessAnonymizer.prototype.hasEnoughPixelCount = function (_arguments) {
        var sw = _arguments[2];
        var sh = _arguments[3];
        return CanvasApiAnonymizer.MIN_CANVAS_SIZE_TO_BLOCK < sw * sh << 2;
    };
    ImgDataAccessAnonymizer.prototype.onAllow = function (orig, __this, _arguments) {
        var notify = this.hasEnoughPixelCount(_arguments);
        return new Notify(original(orig, __this, _arguments), notify);
    };
    ImgDataAccessAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var sx = _arguments[0];
        var sy = _arguments[1];
        var sw = _arguments[2];
        var sh = _arguments[3];
        var origWidth = __this.canvas.width;
        var origHeight = __this.canvas.height;
        // Noiser requires +-1 more pixels for each of 4 directions to deterministically apply noises.
        var tempImageData = orig.apply(__this, [sx - 1, sy - 1, sw + 2, sh + 2]);
        var _a = this.canvasProcessor.addNoiseToBitmap(function (buffView) { buffView.set(tempImageData.data); }, sx - 1, sy - 1, sw + 2, sh + 2, origWidth, origHeight), $data = _a.$data, $result = _a.$result;
        var imageData = this.canvasProcessor.createImageData(sw, sh);
        // Convert dimension of the obtained imageData.
        crop($data, 1, 1, sw, sh, sw + 2, sh + 2, imageData.data);
        return new PixelFakeResult(imageData, $result);
    };
    ImgDataAccessAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        var sw = _arguments[2];
        var sh = _arguments[3];
        var notify = this.hasEnoughPixelCount(_arguments);
        var returned = notify ? this.canvasProcessor.createImageData(sw, sh) : original(orig, __this, _arguments);
        return new Notify(returned, notify);
    };
    ImgDataAccessAnonymizer.prototype.getData = function (orig, __this, _arguments) {
        return __this.canvas;
    };
    return ImgDataAccessAnonymizer;
}(CanvasApiAnonymizer));

var ReadPixelAnonymizer = /** @class */ (function (_super) {
    __extends(ReadPixelAnonymizer, _super);
    function ReadPixelAnonymizer(storage, notifier, canvasProcessor) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.canvasProcessor = canvasProcessor;
        return _this;
    }
    ReadPixelAnonymizer.prototype.hasEnoughPixelCount = function (_arguments) {
        var sw = _arguments[2];
        var sh = _arguments[3];
        return CanvasApiAnonymizer.MIN_CANVAS_SIZE_TO_BLOCK < sw * sh << 2;
    };
    ReadPixelAnonymizer.prototype.onAllow = function (orig, __this, _arguments) {
        return new Notify(original(orig, __this, _arguments), this.hasEnoughPixelCount(_arguments));
    };
    ReadPixelAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var sx = _arguments[0];
        var sy = _arguments[1];
        var sw = _arguments[2];
        var sh = _arguments[3];
        var format = _arguments[4];
        var type = _arguments[5];
        var pixels = _arguments[6];
        var origWidth = __this.canvas.width;
        var origHeight = __this.canvas.height;
        switch (type) {
            case __this.UNSIGNED_BYTE: {
                if (TypeGuards.isUint8Array(pixels)) {
                    var writeToProcessorBuff = function (buffView) {
                        orig.call(__this, sx - 1, sy - 1, sw + 2, sh + 2, format, type, buffView);
                    };
                    var _a = this.canvasProcessor.addNoiseToBitmap(writeToProcessorBuff, sx - 1, sy - 1, sw + 2, sh + 2, origWidth, origHeight), $data = _a.$data, $result = _a.$result;
                    crop($data, 1, 1, sw, sh, sw + 2, sh + 2, pixels);
                    return new PixelFakeResult(undefined, $result);
                }
            }
            case __this.UNSIGNED_SHORT_5_6_5:
            case __this.UNSIGNED_SHORT_5_5_5_1:
            case __this.UNSIGNED_SHORT_4_4_4_4:
                print('called WebGL(2)RenderingContext#readPixels with a type whose faking is not supported.');
            default:
                original(orig, __this, _arguments);
                return new PixelFakeResult(undefined, 0);
        }
    };
    ReadPixelAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        if (this.hasEnoughPixelCount(_arguments)) {
            return new Notify(original(orig, __this, _arguments), false);
        }
        var sw = _arguments[2];
        var sh = _arguments[3];
        var pixels;
        if (typeof _arguments[6] === 'number') {
            
        }
        else {
            pixels = _arguments[6];
            
        }
        var outLen = sw * sh << 2;
        if (outLen > pixels.length) {
            outLen = pixels.length;
        }
        while (outLen--) {
            pixels[outLen] = 0;
        }
        return new Notify(undefined);
    };
    ReadPixelAnonymizer.prototype.getData = function (orig, __this, _arguments) {
        return __this.canvas;
    };
    return ReadPixelAnonymizer;
}(CanvasApiAnonymizer));

/**
 * It is possible that
 */
var ChannelDataAnonymizer = /** @class */ (function (_super) {
    __extends(ChannelDataAnonymizer, _super);
    function ChannelDataAnonymizer(storage, notifier, processor, channelDataCache) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.processor = processor;
        _this.channelDataCache = channelDataCache;
        return _this;
    }
    ChannelDataAnonymizer.prototype.onAllow = function (orig, __this, _arguments) {
        var ret = original(orig, __this, _arguments);
        var shouldNotify = false;
        label: {
            var channel = _arguments[0];
            if (typeof channel !== 'number') {
                break label;
            }
            if (!this.channelDataCache.shouldBeProcessed(__this)) {
                break label;
            }
            var cached = this.channelDataCache.getProcessedChannelData(__this, channel);
            if (!TypeGuards.isUndef(cached)) {
                // Do not show notification if we have already shown a notification
                // for a given audiobuffer and a channel.
                break label;
            }
            var dummy = new Float32Array(0);
            this.channelDataCache.setProcessedChannelData(__this, channel, dummy);
            shouldNotify = true;
            break label;
        }
        return new Notify(ret, shouldNotify);
    };
    ChannelDataAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var ret = original(orig, __this, _arguments);
        label: {
            var channel = _arguments[0];
            if (typeof channel !== 'number') {
                break label;
            }
            if (!this.channelDataCache.shouldBeProcessed(__this)) {
                break label;
            }
            var cached = this.channelDataCache.getProcessedChannelData(__this, channel);
            if (!TypeGuards.isUndef(cached)) {
                ret = cached;
                break label; // Do not show notification when we are using a cached response.
            }
            var anonymized = this.processor.addNoiseToFloatTimeDomainData(function (buffView) {
                buffView.set(ret);
            }, ret.byteLength >> 2);
            this.channelDataCache.setProcessedChannelData(__this, channel, anonymized);
            ret = anonymized;
            return new Notify(ret); // Show notification
        }
        return new Notify(ret, false);
    };
    ChannelDataAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        var ret;
        label: {
            var channel = _arguments[0];
            if (typeof channel !== 'number') {
                break label;
            }
            if (!this.channelDataCache.shouldBeProcessed(__this)) {
                break label;
            }
            var cached = this.channelDataCache.getProcessedChannelData(__this, channel);
            if (!TypeGuards.isUndef(cached)) {
                return new Notify(cached, false);
            }
            var emptyBuffer = new Float32Array(__this.length);
            this.channelDataCache.setProcessedChannelData(__this, channel, emptyBuffer);
            ret = emptyBuffer;
            return new Notify(ret);
        }
        return new Notify(original(orig, __this, _arguments), false);
    };
    ChannelDataAnonymizer.prototype.getData = function () { };
    return ChannelDataAnonymizer;
}(AbstractAnonymizer));

var ByteFrequencyAnonymizer = /** @class */ (function (_super) {
    __extends(ByteFrequencyAnonymizer, _super);
    function ByteFrequencyAnonymizer(storage, notifier, processor) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.processor = processor;
        return _this;
    }
    ByteFrequencyAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isUint8Array(targetBuff)) {
            var anonymized = this.processor.addNoiseToByteFrequencyData(function (buffView) {
                orig.call(__this, buffView);
            }, __this.frequencyBinCount, __this.minDecibels, __this.maxDecibels);
            targetBuff.set(anonymized.subarray(0, targetBuff.length));
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    ByteFrequencyAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isUint8Array(targetBuff)) {
            /** @todo */
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    ByteFrequencyAnonymizer.prototype.getData = function () { };
    return ByteFrequencyAnonymizer;
}(AbstractAnonymizer));

var ByteTimeDomainAnonymizer = /** @class */ (function (_super) {
    __extends(ByteTimeDomainAnonymizer, _super);
    function ByteTimeDomainAnonymizer(storage, notifier, processor) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.processor = processor;
        return _this;
    }
    ByteTimeDomainAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isUint8Array(targetBuff)) {
            var anonymized = this.processor.addNoiseToByteTimeDomainData(function (buffView) {
                orig.call(__this, buffView);
            }, __this.fftSize);
            targetBuff.set(anonymized.subarray(0, targetBuff.length));
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    ByteTimeDomainAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isUint8Array(targetBuff)) {
            /** @todo */
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    ByteTimeDomainAnonymizer.prototype.getData = function () { };
    return ByteTimeDomainAnonymizer;
}(AbstractAnonymizer));

var FloatFrequencyAnonymizer = /** @class */ (function (_super) {
    __extends(FloatFrequencyAnonymizer, _super);
    function FloatFrequencyAnonymizer(storage, notifier, processor) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.processor = processor;
        return _this;
    }
    FloatFrequencyAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isFloat32Array(targetBuff)) {
            var anonymized = this.processor.addNoiseToFloatFrequencyData(function (buffView) {
                orig.call(__this, buffView);
            }, __this.frequencyBinCount);
            targetBuff.set(anonymized.subarray(0, targetBuff.length));
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    FloatFrequencyAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isFloat32Array(targetBuff)) {
            /** @todo */
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    FloatFrequencyAnonymizer.prototype.getData = function () { };
    return FloatFrequencyAnonymizer;
}(AbstractAnonymizer));

var FloatTimeDomainAnonymizer = /** @class */ (function (_super) {
    __extends(FloatTimeDomainAnonymizer, _super);
    function FloatTimeDomainAnonymizer(storage, notifier, processor) {
        var _this = _super.call(this, storage, notifier) || this;
        _this.processor = processor;
        return _this;
    }
    FloatTimeDomainAnonymizer.prototype.onFake = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isFloat32Array(targetBuff)) {
            var anonymized = this.processor.addNoiseToFloatTimeDomainData(function (buffView) {
                orig.call(__this, buffView);
            }, __this.fftSize);
            targetBuff.set(anonymized.subarray(0, targetBuff.length));
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    FloatTimeDomainAnonymizer.prototype.onBlock = function (orig, __this, _arguments) {
        var targetBuff = _arguments[0];
        if (TypeGuards.isFloat32Array(targetBuff)) {
            /** @todo */
        }
        else {
            original(orig, __this, _arguments);
        }
        return new Notify(undefined);
    };
    FloatTimeDomainAnonymizer.prototype.getData = function () { };
    return FloatTimeDomainAnonymizer;
}(AbstractAnonymizer));

var ApiWrapper = /** @class */ (function () {
    function ApiWrapper(proxyService, storage, notifier, canvasProcessor, canvasModeTracker, audioProcessor, audioBufferCache) {
        this.proxyService = proxyService;
        this.storage = storage;
        this.notifier = notifier;
        this.canvasProcessor = canvasProcessor;
        this.canvasModeTracker = canvasModeTracker;
        this.audioProcessor = audioProcessor;
        this.audioBufferCache = audioBufferCache;
    }
    ApiWrapper.prototype.anonymize = function (anonymizer, owner, prop, api, type, domain) {
        this.proxyService.wrapMethod(owner, prop, anonymizer.getCombinedHandler(api, type, domain));
    };
    ApiWrapper.prototype.wrapCanvasApis = function (window) {
        var domain = window.location.hostname;
        var canvasElementMethodsAnonymizer = new CanvasElementMethodsAnonymizer(this.storage, this.notifier, this.canvasProcessor, this.canvasModeTracker);
        var canvasPType = window.HTMLCanvasElement.prototype;
        this.anonymize(canvasElementMethodsAnonymizer, canvasPType, 'toDataURL', 0 /* canvas */, 0 /* TO_DATA_URL */, domain);
        this.anonymize(canvasElementMethodsAnonymizer, canvasPType, 'toBlob', 0 /* canvas */, 1 /* TO_BLOB */, domain);
        this.anonymize(canvasElementMethodsAnonymizer, canvasPType, 'mozGetAsFile', 0 /* canvas */, 2 /* MOZ_GET_AS_FILE */, domain);
        var imgDataAccessAnonymizer = new ImgDataAccessAnonymizer(this.storage, this.notifier, this.canvasProcessor);
        this.anonymize(imgDataAccessAnonymizer, window.CanvasRenderingContext2D.prototype, 'getImageData', 0 /* canvas */, 3 /* GET_IMAGE_DATA */, domain);
        var readPixelAnonymizer = new ReadPixelAnonymizer(this.storage, this.notifier, this.canvasProcessor);
        var webgl = window.WebGLRenderingContext;
        var webgl2 = window.WebGL2RenderingContext;
        if (webgl) {
            this.anonymize(readPixelAnonymizer, webgl.prototype, 'readPixels', 0 /* canvas */, 4 /* READ_PIXELS */, domain);
        }
        if (webgl2) {
            this.anonymize(readPixelAnonymizer, webgl2.prototype, 'readPixels', 0 /* canvas */, 5 /* READ_PIXELS_2 */, domain);
        }
    };
    ApiWrapper.prototype.wrapAudioApis = function (window) {
        if (!window.AudioContext) {
            return;
        }
        var domain = window.location.hostname;
        var channelDataAnonymizer = new ChannelDataAnonymizer(this.storage, this.notifier, this.audioProcessor, this.audioBufferCache);
        this.anonymize(channelDataAnonymizer, window.AudioBuffer.prototype, 'getChannelData', 1 /* audio */, 0 /* GET_CHANNEL_DATA */, domain);
        var analyserNodePType = window.AnalyserNode.prototype;
        var byteFrequencyAnonymizer = new ByteFrequencyAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(byteFrequencyAnonymizer, analyserNodePType, 'getByteFrequencyData', 1 /* audio */, 3 /* GET_BYTE_FREQUENCY_DATA */, domain);
        var byteTimeDomainAnonymizer = new ByteTimeDomainAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(byteTimeDomainAnonymizer, analyserNodePType, 'getByteTimeDomainData', 1 /* audio */, 4 /* GET_BYTE_TIME_DOMAIN_DATA */, domain);
        var floatFrequencyAnonymizer = new FloatFrequencyAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(floatFrequencyAnonymizer, analyserNodePType, 'getFloatFrequencyData', 1 /* audio */, 1 /* GET_FLOAT_FREQUENCY_DATA */, domain);
        var floatTimeDomainAnonymizer = new FloatTimeDomainAnonymizer(this.storage, this.notifier, this.audioProcessor);
        this.anonymize(floatTimeDomainAnonymizer, analyserNodePType, 'getFloatTimeDomainData', 1 /* audio */, 2 /* GET_FLOAT_TIME_DOMAIN_DATA */, domain);
    };
    ApiWrapper.prototype.$apply = function (window) {
        this.canvasModeTracker.$apply(window);
        this.wrapCanvasApis(window);
        this.audioBufferCache.$apply(window);
        this.wrapAudioApis(window);
    };
    return ApiWrapper;
}());

var h = preact.h;
var Component = preact.Component;
var render = preact.render;

var bind = Function.prototype.bind;
function trustedEventListener(listener, __this) {
    return function (evt) {
        if (evt.isTrusted) {
            listener.call(__this, evt);
            evt.preventDefault();
        }
    };
}

var SupportedLocales = { "en": { "allow": "Allow", "fake": "Fake", "block": "Block", "popup.detected": "Detected", "popup.faked": "Faked", "popup.blocked": "Blocked", "popup.fp_attempt": "FP attempt", "popup.allow_expl": "Fingerprinting blocker will only notify you about possible fingerprinting attempts.", "popup.allow_confirm": "Fingerprint will be \"allowed\" for the current domain.", "popup.fake_confirm": "Fingerprint will be \"faked\" for the current domain.", "popup.block_confirm": "Fingerprint will be \"blocked\" for the current domain.", "popup.fake_expl": "Fingerprinting blocker will automatically mix noise to the fingerprinting data. More settings for noise generation is available in the settings page.", "popup.block_expl": "Fingerprinting blocker will provide empty data, as if browser api is not supported. Warning: this option is more likelihood of breaking page.", "popup.fp_attempt_detected": "Fingerprinting attempts detected:", "popup.choose_action": "Choose action:", "popup.notify_about_attempts": "Notify about detected fingerprinting attempts", "popup.notify_expl": "If you chose not to show notifications, you can change this settings via the settings page.", "popup.confirm": "Confirm", "popup.cancel": "Cancel", "popup.details": "Details...", "popup.detected_expl": "Detected a possible fingerprinting attempt. This may be used to uniquely identify your computer.", "popup.applied_action": "Applied action:" } };
var defaultLocale = 'en';
var currentLocale = null;
if (typeof AdguardSettings !== 'undefined') {
    var locale = AdguardSettings.locale;
    if (SupportedLocales[locale]) {
        currentLocale = locale;
    }
}
if (!currentLocale || !SupportedLocales[currentLocale]) {
    var lang = navigator.language;
    if (!SupportedLocales[lang]) {
        var i$1 = lang.indexOf('-');
        if (i$1 !== -1) {
            lang = lang.slice(0, i$1);
        }
    }
    currentLocale = lang;
}
if (!currentLocale || !SupportedLocales[currentLocale]) {
    currentLocale = defaultLocale;
}
var getMessage = function (messageId) {
    var message = SupportedLocales[currentLocale][messageId];
    if (!message) {
        message = SupportedLocales[defaultLocale][messageId];
    }
    return message;
};
/**
 * @param htmlSafe indicates that strings that are to be replaced with should be escaped
 * so that they can used as a value of `innerHTML` without allowing remote code execution
 * or breaking html structure.
 */

var FirstTimeNotification = /** @class */ (function (_super) {
    __extends(FirstTimeNotification, _super);
    function FirstTimeNotification(props) {
        var _this = _super.call(this, props) || this;
        _this.onDetailsClick = trustedEventListener(_this.onDetailsClick, _this);
        return _this;
    }
    FirstTimeNotification.prototype.actionChangerFactory = function (action) {
        var _this = this;
        return trustedEventListener(function (evt) {
            _this.props.storage.setAction(action);
            _this.props.fetchStorageUpdate();
            _this.props.toPage(2 /* SAVE_SUCCESS */);
            _this.props.toPage(0 /* FIRST_TIME */, 4000);
        }, this);
    };
    FirstTimeNotification.prototype.onDetailsClick = function () {
        this.props.toPage(3 /* DETAILS */);
    };
    FirstTimeNotification.prototype.render = function (props) {
        return (h("div", { class: "popup__text popup__text--summary" },
            getMessage("popup.detected_expl"),
            h("div", { class: "popup__actions" },
                h("a", { href: "", class: "popup__link popup__link--action", onClick: this.actionChangerFactory(0 /* ALLOW */) }, getMessage("allow")),
                h("a", { href: "", class: "popup__link popup__link--action", onClick: this.actionChangerFactory(2 /* BLOCK */) }, getMessage("block")),
                h("a", { href: "", class: "popup__link popup__link--action", onClick: this.actionChangerFactory(1 /* FAKE */) }, getMessage("fake")),
                h("a", { href: "", class: "popup__link popup__link--action", onClick: this.onDetailsClick }, getMessage("popup.details")))));
    };
    return FirstTimeNotification;
}(Component));

var Collapsed = /** @class */ (function (_super) {
    __extends(Collapsed, _super);
    function Collapsed(props) {
        var _this = _super.call(this, props) || this;
        _this.onExpandClick = trustedEventListener(_this.onExpandClick, _this);
        return _this;
    }
    Collapsed.prototype.getMsg = function () {
        switch (this.props.latestEvent.action) {
            case 0 /* ALLOW */:
                return getMessage("popup.detected");
            case 1 /* FAKE */:
                return getMessage("popup.faked");
            case 2 /* BLOCK */:
                return getMessage("popup.blocked");
        }
    };
    Collapsed.prototype.onExpandClick = function (evt) {
        this.props.toPage(3 /* DETAILS */);
    };
    Collapsed.prototype.render = function (props) {
        if (!props.latestEvent) {
            return null;
        }
        return (h("div", { class: "popup__text" },
            h("div", { class: "popup__text--min" },
                h("div", { class: "popup__text-blocked" }, getMessage("popup.fp_attempt")),
                h("div", { class: "popup__actions" },
                    h("a", { href: "", class: "popup__link popup__link--expand", onClick: this.onExpandClick }, this.getMsg())))));
    };
    return Collapsed;
}(Component));

var SaveSuccess = /** @class */ (function (_super) {
    __extends(SaveSuccess, _super);
    function SaveSuccess(props) {
        var _this = _super.call(this, props) || this;
        _this.onDetailsClick = trustedEventListener(_this.onDetailsClick, _this);
        return _this;
    }
    SaveSuccess.prototype.onDetailsClick = function () {
        this.props.toPage(3 /* DETAILS */);
    };
    SaveSuccess.prototype.render = function (props) {
        return (h("div", { class: "popup__text" },
            h("div", null,
                h("p", null,
                    getMessage("popup.applied_action"),
                    h("em", null, SaveSuccess.actionName[props.action])),
                h("p", null, SaveSuccess.appliedActionText[props.action])),
            h("a", { href: "", class: "popup__link", onClick: this.onDetailsClick }, getMessage("popup.details"))));
    };
    SaveSuccess.actionName = [
        getMessage("allow"),
        getMessage("fake"),
        getMessage("block")
    ];
    SaveSuccess.appliedActionText = [
        getMessage("popup.allow_confirm"),
        getMessage("popup.fake_confirm"),
        getMessage("popup.block_confirm")
    ];
    return SaveSuccess;
}(Component));

var Details = /** @class */ (function (_super) {
    __extends(Details, _super);
    function Details(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            chosenAction: props.action,
            chosenNotify: props.notify
        };
        _this.onStatNumberClick = trustedEventListener(_this.onStatNumberClick, _this);
        _this.onActionSelection = trustedEventListener(_this.onActionSelection, _this);
        _this.onNotifyCheckboxClick = trustedEventListener(_this.onNotifyCheckboxClick, _this);
        _this.onConfirm = trustedEventListener(_this.onConfirm, _this);
        _this.onSave = trustedEventListener(_this.onSave, _this);
        return _this;
    }
    Details.prototype.onStatNumberClick = function (evt) {
        this.props.toPage(4 /* TRIGGER_LOG */);
    };
    Details.prototype.onActionSelection = function (evt) {
        this.setState({
            chosenAction: parseInt(evt.currentTarget.value, 10)
        });
    };
    Details.prototype.onNotifyCheckboxClick = function (evt) {
        this.setState({
            chosenNotify: evt.currentTarget.checked
        });
    };
    Details.prototype.onConfirm = function (evt) {
        this.props.storage.setAction(this.state.chosenAction);
        this.props.storage.setNotify(this.state.chosenNotify);
        this.props.fetchStorageUpdate();
        this.onSave(evt);
    };
    Details.prototype.onSave = function (evt) {
        this.props.toPage(2 /* SAVE_SUCCESS */);
        this.props.toPage(3 /* DETAILS */, 5000);
    };
    Details.prototype.getActionExplanation = function (action) {
        switch (action) {
            case 0 /* ALLOW */:
                return getMessage("popup.allow_expl");
            case 1 /* FAKE */:
                return getMessage("popup.fake_expl");
            case 2 /* BLOCK */:
                return getMessage("popup.block_expl");
        }
    };
    Details.prototype.componentDidMount = function () {
        this.props.onUpdate();
    };
    Details.prototype.componentDidUpdate = function () {
        this.props.onUpdate();
    };
    Details.prototype.render = function (props, state) {
        var domain = props.storage.domain;
        var currentStats = props.storage.getStat();
        return (h("div", { class: "popup__text" },
            h("div", { class: "popup__text--domain" }, domain),
            h("div", { class: "popup__text--paragraph" },
                getMessage("popup.fp_attempt_detected"),
                h("a", { href: "", class: "popup__link", onClick: this.onStatNumberClick }, currentStats.canvasBlockCount + currentStats.audioBlockCount)),
            h("div", { class: "popup__row" },
                h("div", null, getMessage("popup.choose_action")),
                h("select", { value: String(state.chosenAction), onChange: this.onActionSelection },
                    h("option", { value: String(0 /* ALLOW */) }, getMessage("allow")),
                    h("option", { value: String(1 /* FAKE */) }, getMessage("fake")),
                    h("option", { value: String(2 /* BLOCK */) }, getMessage("block"))),
                h("div", { class: "popup__text--paragraph" }, this.getActionExplanation(state.chosenAction))),
            h("div", { class: "popup__row" },
                h("label", null,
                    h("input", { type: "checkbox", checked: state.chosenNotify, onClick: this.onNotifyCheckboxClick }),
                    getMessage("popup.notify_about_attempts")),
                h("div", { class: "popup__text--paragraph" }, getMessage("popup.notify_expl"))),
            h("div", null,
                h("button", { class: "popup__button", onClick: this.onConfirm }, getMessage("popup.confirm")),
                h("button", { class: "popup__button", onClick: this.onSave }, getMessage("popup.cancel")))));
    };
    return Details;
}(Component));

var SEC = 1000;
var MIN = SEC * 60;
var HOUR = MIN * 60;
var DAY = HOUR * 24;
var TriggerLogView = /** @class */ (function (_super) {
    __extends(TriggerLogView, _super);
    function TriggerLogView(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            selected: 0
        };
        _this.onSelectionChange = trustedEventListener(_this.onSelectionChange, _this);
        _this.onBackBtnClick = trustedEventListener(_this.onBackBtnClick, _this);
        return _this;
    }
    TriggerLogView.prototype.onBackBtnClick = function () {
        this.props.toPage(3 /* DETAILS */);
    };
    TriggerLogView.prototype.onSelectionChange = function (evt) {
        var value = parseInt(evt.currentTarget.value, 10);
        this.setState({
            selected: value
        });
    };
    TriggerLogView.prototype.getElapsedTimeRepresentation = function (date) {
        var now = Date.now();
        var elapsed = now - date;
        if (elapsed < SEC) {
            return "+" + elapsed + "ms";
        }
        if (elapsed < MIN) {
            return "+" + Math.round(elapsed / SEC) + "s";
        }
        if (elapsed < HOUR) {
            return "+" + Math.round(elapsed / MIN) + "m";
        }
        if (elapsed < DAY) {
            return "+" + Math.round(elapsed / HOUR) + "h";
        }
        return "+" + Math.round(elapsed / DAY) + "d";
    };
    TriggerLogView.prototype.render = function (props, state) {
        var _this = this;
        var triggerLog = props.storage.getTriggerLog();
        return (h("div", { class: "popup__text" },
            h("div", null,
                h("div", { class: "popup__back", onClick: this.onBackBtnClick }, "back"),
                h("select", { value: String(state.selected), onChange: this.onSelectionChange }, triggerLog.map(function (entry, index) {
                    return h("option", { value: String(index) },
                        _this.getElapsedTimeRepresentation(entry.date) + ' ',
                        h("div", { class: "popup__text-api" }, getApiName(entry.api, entry.type)));
                }))),
            h("div", null,
                h("textarea", { class: "popup__stack", rows: 10, cols: 45 }, triggerLog[state.selected].stack))));
    };
    return TriggerLogView;
}(Component));

var Alert = /** @class */ (function (_super) {
    __extends(Alert, _super);
    function Alert(props) {
        var _this = _super.call(this, props) || this;
        var storage = props.storage;
        var pageToShow = storage.getAnythingIsModifiedByUser() ? 1 /* COLLAPSED */ : 0;
        _this.state = {
            action: storage.getAction(),
            notify: storage.getNotify(),
            latestEvent: null,
            currentPage: pageToShow
        };
        _this.toPage = bind.call(_this.toPage, _this);
        _this.fetchStorageUpdate();
        _this.fetchStorageUpdate = bind.call(_this.fetchStorageUpdate, _this);
        return _this;
    }
    Alert.prototype.fetchStorageUpdate = function () {
        var storage = this.props.storage;
        this.setState({
            action: storage.getAction(),
            notify: storage.getNotify()
        });
    };
    /**
     * Navigates the alert to a different page(state).
     * If an optional argument
     */
    Alert.prototype.toPage = function (index, timeout) {
        if (!TypeGuards.isUndef(this.toPageTimer)) {
            clearTimeout(this.toPageTimer);
            this.toPageTimer = undefined;
        }
        if (timeout) {
            this.toPageTimer = setTimeout(this.toPage, timeout, index);
            // `this.toPage` is already bound to `this` in the constructor
        }
        else {
            this.setState({
                currentPage: index
            });
        }
    };
    // Contains a logic for switching component according to the current page(state).
    Alert.prototype.renderMainPane = function () {
        // Passing props one by one in order to avoid using object rest operator
        // which will be converted to Object.assign, which requires a polyfill.
        // This also reduces a number of property copies.
        var storage = this.props.storage;
        var latestEvent = this.state.latestEvent;
        var currentAction = this.state.action;
        var currentNotify = this.state.notify;
        var toPage = this.toPage;
        var fetchStorageUpdate = this.fetchStorageUpdate;
        var onUpdate = this.props.onUpdate;
        var currentPage = this.state.currentPage;
        switch (currentPage) {
            case 0 /* FIRST_TIME */:
                return h(FirstTimeNotification, { storage: storage, toPage: toPage, fetchStorageUpdate: fetchStorageUpdate });
            case 1 /* COLLAPSED */:
                return h(Collapsed, { latestEvent: latestEvent, toPage: toPage });
            case 2 /* SAVE_SUCCESS */:
                return h(SaveSuccess, { action: currentAction, toPage: toPage });
            case 3 /* DETAILS */:
                return h(Details, { storage: storage, action: currentAction, notify: currentNotify, latestEvent: latestEvent, toPage: toPage, fetchStorageUpdate: fetchStorageUpdate, onUpdate: onUpdate });
            case 4 /* TRIGGER_LOG */:
                return h(TriggerLogView, { storage: storage, toPage: toPage });
        }
    };
    Alert.prototype.componentDidMount = function () {
        this.props.onUpdate();
    };
    Alert.prototype.componentDidUpdate = function () {
        this.props.onUpdate();
    };
    Alert.prototype.componentWillUnmount = function () {
        if (!TypeGuards.isUndef(this.toPageTimer)) {
            clearTimeout(this.toPageTimer);
            this.toPageTimer = undefined;
        }
    };
    Alert.prototype.render = function (props, state) {
        var _this = this;
        return (h("div", null,
            h("div", { class: "popup", ref: function (el) { _this.rootNode = el; } },
                h("div", { class: "popup__logo" }),
                this.renderMainPane()),
            h("button", { class: "popup__close", onClick: function () { _this.props.onClose(); } })));
    };
    Alert.STYLE = "body{font-family:\"Gotham Pro\",\"Helvetica Neue\",Helvetica,Arial,sans-serif;margin:0}.popup{position:fixed;top:0;right:0;width:400px;padding:15px 35px 15px 20px;font-size:13px;white-space:nowrap;background-color:#fff;border:1px solid #d6d6d6;box-shadow:0 2px 5px 0 rgba(0,0,0,.2)}.popup__text--min{width:80px}.popup--detail{padding:8px 38px 8px 14px}.popup--detail .popup__text{font-size:11px;line-height:1.2}.popup--detail .popup__close{top:50%;transform:translateY(-50%)}.popup__logo{display:inline-block;vertical-align:middle;width:30px;height:30px;margin-right:12px;background-repeat:no-repeat;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNS4zIDI1LjkiPjxwYXRoIGZpbGw9IiM2OGJjNzEiIGQ9Ik0xMi43IDBDOC43IDAgMy45LjkgMCAzYzAgNC40LS4xIDE1LjQgMTIuNyAyM0MyNS40IDE4LjQgMjUuMyA3LjQgMjUuMyAzIDIxLjQuOSAxNi42IDAgMTIuNyAweiIvPjxwYXRoIGZpbGw9IiM2N2IyNzkiIGQ9Ik0xMi42IDI1LjlDLS4xIDE4LjQgMCA3LjQgMCAzYzMuOS0yIDguNy0zIDEyLjYtM3YyNS45eiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMi4yIDE3LjNMMTkuOCA3YS45OS45OSAwIDAgMC0xLjMuMWwtNi40IDYuNi0yLjQtMi45Yy0xLjEtMS4zLTIuNy0uMy0zLjEgMGw1LjYgNi41Ii8+PC9zdmc+)}.popup__text{display:inline-block;vertical-align:middle;font-size:13px;line-height:1.6}.popup__text--summary{word-wrap:break-word;white-space:normal}.popup__text--paragraph{word-wrap:break-word;white-space:normal;font-weight:lighter}.popup__text-blocked{overflow:hidden;text-overflow:ellipsis}.popup__label{font-weight:lighter;margin-right:5px}.popup__label-detail,.popup__label-inline{display:inline}.popup__detail-textarea{width:100%}.popup__detail-button{display:inline}.popup__link{display:inline-block;vertical-align:middle;color:#66b574;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.popup__link--url{max-width:130px;vertical-align:bottom}.popup__link--action{margin-right:5px}.popup__link--allow{max-width:215px;margin-right:5px}.popup__text--domain{font-size:20px}.popup__row:not(:first-of-type){padding:11px 0}.popup__count{font-size:20px;display:inline-block;margin-right:5px}.popup__count--canvas{color:#f90}.popup__count--audio{color:#5d7c9b}.popup__close{position:absolute;top:10px;width:15px;height:15px;border:0;background-color:#fff;background-repeat:no-repeat;-webkit-appearance:none;appearance:none;cursor:pointer;opacity:.3}.popup__close{right:10px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMC41IDIwLjUiPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xMS4zIDEwLjNsOS05Yy4zLS4zLjMtLjggMC0xLjFzLS44LS4zLTEuMSAwbC05IDktOS05QzEtLjEuNS0uMS4yLjJzLS4zLjggMCAxLjFsOSA5LTkgOWMtLjMuMy0uMy44IDAgMS4xLjEuMS4zLjIuNS4ycy40LS4xLjUtLjJsOS05IDkgOWMuMS4xLjMuMi41LjJzLjQtLjEuNS0uMmMuMy0uMy4zLS44IDAtMS4xbC04LjktOXoiLz48L3N2Zz4=)}.popup__back{display:inline;width:15px;height:15px;border:0;background-color:#fff;background-repeat:no-repeat;-webkit-appearance:none;appearance:none;cursor:pointer;opacity:.3}.popup__stack{white-space:pre}";
    return Alert;
}(Component));

var px = 'px';
var AlertController = /** @class */ (function () {
    function AlertController(storage) {
        this.storage = storage;
        this.timerPrevented = false;
    }
    AlertController.prototype.createOrUpdateAlert = function (alertData, stat) {
        var _this = this;
        print("AlertController: creating alert");
        var domain = alertData.domain;
        var event = alertData.blockEvent;
        if (this.alertInstance !== undefined) {
            if (this.alertInstance.props.storage.domain !== domain) {
                return;
            }
            this.alertInstance.setState({
                latestEvent: event
            });
            this.scheduleDestroy();
        }
        else if (this.pendingDomain) {
            if (this.pendingDomain !== domain) {
                return;
            }
            this.pendingEvent = event;
            this.pendingStat = stat;
        }
        else {
            this.pendingDomain = domain;
            this.pendingEvent = event;
            this.pendingStat = stat;
            var iframe_1 = this.iframe = document.createElement('iframe');
            iframe_1.addEventListener('load', function () {
                var doc = iframe_1.contentDocument;
                _this.appendStyle(doc);
                var storage = _this.storage.getDomainStorage(domain);
                render(h(Alert, { storage: storage, onClose: function () { _this.destroy(); }, ref: function (inst) { _this.alertInstance = inst; }, onUpdate: function () {
                        _this.updateIframeDimension();
                    } }), doc.body);
                _this.alertInstance.setState({
                    latestEvent: _this.pendingEvent
                });
                _this.pendingDomain = undefined;
                _this.pendingEvent = undefined;
                _this.pendingStat = undefined;
                // Attaches event listeners
                var onInteraction = function (evt) {
                    if (evt.isTrusted) {
                        _this.timerPrevented = true;
                        _this.cancelDestroy();
                        doc.removeEventListener('mousedown', onInteraction);
                    }
                };
                doc.addEventListener('mousedown', onInteraction, true);
                doc.addEventListener('mouseover', function (evt) {
                    evt.isTrusted && _this.$onMouseOver();
                }, true);
                doc.addEventListener('mouseout', function (evt) {
                    evt.isTrusted && _this.$onMouseOut();
                }, true);
                _this.scheduleDestroy();
                // Without this, the background of the iframe will be white in IE11
                doc.body.setAttribute('style', 'background-color:transparent;');
            });
            // Applies iframe styles
            applyStyle(iframe_1, AlertController.BASE_IFRAME_STYLE);
            applyStyle(iframe_1, AlertController.HIDDEN_IFRAME_STYLE);
            requestAnimationFrame(function () {
                applyStyle(iframe_1, AlertController.VISIBLE_IFRAME_STYLE);
            });
            // Appends the iframe
            document.documentElement.appendChild(iframe_1);
        }
        this.lastUpdate = Date.now();
    };
    AlertController.prototype.appendStyle = function (doc) {
        var style = doc.createElement('style');
        style.appendChild(doc.createTextNode(Alert.STYLE));
        doc.head.appendChild(style);
    };
    AlertController.prototype.updateIframeDimension = function () {
        var el = this.alertInstance.rootNode;
        if (el) {
            var height = el.scrollHeight + 4;
            var width = el.scrollWidth + 9;
            this.iframe.style['height'] = height + px;
            this.iframe.style['width'] = width + px;
        }
    };
    AlertController.prototype.destroy = function () {
        var _this = this;
        var iframe = this.iframe;
        applyStyle(iframe, AlertController.HIDDEN_IFRAME_STYLE);
        setTimeout(function () {
            _this.iframe = undefined;
            _this.alertInstance = undefined;
            document.documentElement.removeChild(iframe);
        }, 400);
    };
    AlertController.prototype.scheduleDestroy = function () {
        var _this = this;
        if (this.timerPrevented) {
            return;
        }
        clearTimeout(this.timer);
        this.timer = setTimeout(function () {
            _this.destroy();
        }, AlertController.TIMEOUT);
    };
    AlertController.prototype.cancelDestroy = function () {
        clearTimeout(this.timer);
        this.timer = undefined;
    };
    AlertController.prototype.$onMouseOver = function () {
        if (!this.timerPrevented) {
            this.cancelDestroy();
        }
    };
    AlertController.prototype.$onMouseOut = function () {
        var _this = this;
        if (!this.timerPrevented) {
            var pastDue = this.lastUpdate + AlertController.TIMEOUT - Date.now();
            var minTimeout = AlertController.MIN_TIMEOUT;
            var timeout = pastDue > minTimeout ? pastDue : minTimeout;
            this.timer = setTimeout(function () {
                _this.destroy();
            }, timeout);
        }
    };
    AlertController.STYLE_CONST = {
        bottom_offset: 10,
        right_offset: 10
    };
    AlertController.BASE_IFRAME_STYLE = {
        "position": "fixed",
        "bottom": AlertController.STYLE_CONST.bottom_offset + px,
        "border": "none",
        "z-index": String(-1 - (1 << 31)),
    };
    AlertController.HIDDEN_IFRAME_STYLE = {
        "right": "-100%",
        "opacity": "0",
        "transform": "translate3d(0,0,0)",
        "transition": "right .4s, opacity .4s",
        "transitionTimingFunction": "cubic-bezier(.25,.8,.25,1),cubic-bezier(.25,.8,.25,1)"
    };
    AlertController.VISIBLE_IFRAME_STYLE = {
        "right": AlertController.STYLE_CONST.right_offset + px,
        "opacity": "1"
    };
    AlertController.TIMEOUT = 8000;
    AlertController.MIN_TIMEOUT = 1000;
    return AlertController;
}());
function applyStyle(element, styleMap) {
    for (var styleProp in styleMap) {
        element.style[styleProp] = styleMap[styleProp];
    }
}

var window$1 = unsafeWindow.window;
var globalSettings = new GlobalSettingsStorage().init();
var domainSettings = globalSettings.getDomainStorage(location.hostname);
var globalKey = globalSettings.globalKey;
// globalKey is used to indicate that the userscript has been run
// from the parent context which has the same origin.
// See ChildContextInjector implementation.
if (!window$1.hasOwnProperty(globalKey)) {
    var proxyService_1 = new ProxyService();
    var messageHub_1 = new InterContextMessageHub(window$1);
    var alertController = new AlertController(globalSettings);
    var notifier = new Notifier(messageHub_1, domainSettings, alertController);
    var canvasProcessor = new CanvasProcessor(domainSettings, window$1);
    var canvasModeTracker = new CanvasModeTracker(proxyService_1);
    var audioProcessor = new AudioProcessor(domainSettings, window$1);
    var audioBufferCache = new AudioBufferCache(proxyService_1);
    var apiWrapper_1 = new ApiWrapper(proxyService_1, domainSettings, notifier, canvasProcessor, canvasModeTracker, audioProcessor, audioBufferCache);
    var main_1 = function (window) {
        // ChildContextInjector is dependent on the context, and it needs to
        // be initialized on each context.
        var injector = new ChildContextInjector(window, proxyService_1, globalKey);
        injector.registerCallback(inIframe_1);
        proxyService_1.$apply(window);
        apiWrapper_1.$apply(window);
    };
    var inIframe_1 = function (window) {
        main_1(window);
        // Establishes a bridging message channel,
        // won't directly assign callbacks to this instance.
        new InterContextMessageHub(window, messageHub_1);
    };
    main_1(window$1);
}
else {
    delete window$1[globalKey];
}
// Expose for the settings page.
if (location.href === 'https://adguardteam.github.io/FingerprintingBlocker/settings.html') {
    window$1['GM_getValue'] = GM_getValue;
    window$1['GM_setValue'] = GM_setValue;
    window$1['GM_listValues'] = GM_listValues;
    window$1['preact'] = preact;
}

var audioNoiseApplier = function(global, env, buffer) {
 "use asm";
 var a = new global.Int8Array(buffer);
 var d = new global.Uint8Array(buffer);
 var g = new global.Float32Array(buffer);
 var R = global.Math.imul;
 function ca(b, c, e, f, g, h) {
  b = b | 0;
  c = c | 0;
  e = e | 0;
  f = f | 0;
  g = g | 0;
  h = h | 0;
  var i = 0, j = 0, k = 0, l = 0, m = 0;
  if ((c | 0) > 0) l = 0; else return;
  do {
   j = l << 1 & 126;
   do if (j >>> 0 <= 95) {
    if (j >>> 0 > 63) {
     i = 1 << j + -64 & g;
     break;
    }
    if (j >>> 0 > 31) {
     i = 1 << j + -32 & f;
     break;
    } else {
     i = 1 << j & e;
     break;
    }
   } else i = 1 << j + -96 & h; while (0);
   k = (i | 0) != 0;
   i = j | 1;
   do if (i >>> 0 <= 95) {
    if (i >>> 0 > 63) {
     i = 1 << i + -64 & g;
     break;
    }
    if (i >>> 0 > 31) {
     i = 1 << i + -32 & f;
     break;
    } else {
     i = 1 << i & e;
     break;
    }
   } else i = 1 << i + -96 & h; while (0);
   if (k ^ (i | 0) != 0) {
    j = b + l | 0;
    i = d[j >> 0] | 0;
    m = (R(R(i + -128 | 0, i) | 0, i | -256) | 0) / 16777216 | 0;
    a[j >> 0] = (k ? m : 0 - m | 0) + i;
   }
   l = l + 1 | 0;
  } while ((l | 0) != (c | 0));
  return;
 }
 function aa(a, b, c, d, e, f) {
  a = a | 0;
  b = b | 0;
  c = c | 0;
  d = d | 0;
  e = e | 0;
  f = f | 0;
  var h = 0, i = 0, j = 0, k = 0, l = 0.0, m = 0.0;
  if ((b | 0) > 0) k = 0; else return;
  do {
   i = k << 1 & 126;
   do if (i >>> 0 <= 95) {
    if (i >>> 0 > 63) {
     h = 1 << i + -64 & e;
     break;
    }
    if (i >>> 0 > 31) {
     h = 1 << i + -32 & d;
     break;
    } else {
     h = 1 << i & c;
     break;
    }
   } else h = 1 << i + -96 & f; while (0);
   j = (h | 0) != 0;
   h = i | 1;
   do if (h >>> 0 <= 95) {
    if (h >>> 0 > 63) {
     h = 1 << h + -64 & e;
     break;
    }
    if (h >>> 0 > 31) {
     h = 1 << h + -32 & d;
     break;
    } else {
     h = 1 << h & c;
     break;
    }
   } else h = 1 << h + -96 & f; while (0);
   if (j ^ (h | 0) != 0) {
    i = a + (k << 2) | 0;
    m = +g[i >> 2];
    l = (m + 1.0) * m * (m + -1.0) * .0009765625;
    g[i >> 2] = m + (j ? l : -l);
   }
   k = k + 1 | 0;
  } while ((k | 0) != (b | 0));
  return;
 }
 function ba(b, c, e, f, g, h, i, j) {
  b = b | 0;
  c = c | 0;
  e = e | 0;
  f = f | 0;
  g = g | 0;
  h = h | 0;
  i = i | 0;
  j = j | 0;
  var k = 0, l = 0;
  if ((c | 0) > 0) l = 0; else return;
  do {
   f = l << 1 & 126;
   do if (f >>> 0 <= 95) {
    if (f >>> 0 > 63) {
     e = 1 << f + -64 & i;
     break;
    }
    if (f >>> 0 > 31) {
     e = 1 << f + -32 & h;
     break;
    } else {
     e = 1 << f & g;
     break;
    }
   } else e = 1 << f + -96 & j; while (0);
   k = (e | 0) != 0;
   e = f | 1;
   do if (e >>> 0 <= 95) {
    if (e >>> 0 > 63) {
     e = 1 << e + -64 & i;
     break;
    }
    if (e >>> 0 > 31) {
     e = 1 << e + -32 & h;
     break;
    } else {
     e = 1 << e & g;
     break;
    }
   } else e = 1 << e + -96 & j; while (0);
   if (k ^ (e | 0) != 0) {
    f = b + l | 0;
    a[f >> 0] = (d[f >> 0] | 0) + (k ? 1 : 255);
   }
   l = l + 1 | 0;
  } while ((l | 0) != (c | 0));
  return;
 }
 function $(a, b, c, d, e, f) {
  a = a | 0;
  b = b | 0;
  c = c | 0;
  d = d | 0;
  e = e | 0;
  f = f | 0;
  var h = 0, i = 0, j = 0, k = 0, l = 0;
  if ((b | 0) > 0) k = 0; else return;
  do {
   i = k << 1 & 126;
   do if (i >>> 0 <= 95) {
    if (i >>> 0 > 63) {
     h = 1 << i + -64 & e;
     break;
    }
    if (i >>> 0 > 31) {
     h = 1 << i + -32 & d;
     break;
    } else {
     h = 1 << i & c;
     break;
    }
   } else h = 1 << i + -96 & f; while (0);
   j = (h | 0) != 0;
   h = i | 1;
   do if (h >>> 0 <= 95) {
    if (h >>> 0 > 63) {
     h = 1 << h + -64 & e;
     break;
    }
    if (h >>> 0 > 31) {
     h = 1 << h + -32 & d;
     break;
    } else {
     h = 1 << h & c;
     break;
    }
   } else h = 1 << h + -96 & f; while (0);
   if (j ^ (h | 0) != 0 ? (l = a + (k << 2) | 0, j) : 0) g[l >> 2] = +g[l >> 2] + 0.0;
   k = k + 1 | 0;
  } while ((k | 0) != (b | 0));
  return;
 }
 return {
  _noise_to_frequency: $,
  _noise_to_byte_time_domain: ca,
  _noise_to_byte_frequency: ba,
  _noise_to_time_domain: aa
 };
}
var bitmapNoiseApplier = function(global, env, buffer) {
 "use asm";
 var a = new global.Int8Array(buffer);
 var d = new global.Uint8Array(buffer);
 var R = global.Math.imul;
 function $(b, c, e, f, g, h, i, j, k, l, m) {
  b = b | 0;
  c = c | 0;
  e = e | 0;
  f = f | 0;
  g = g | 0;
  h = h | 0;
  i = i | 0;
  j = j | 0;
  k = k | 0;
  l = l | 0;
  m = m | 0;
  var n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0;
  J = 0 - e | 0;
  J = (J | 0) > 0 ? J : 0;
  D = i - e | 0;
  D = (D | 0) > (g | 0) ? g : D;
  C = 0 - c | 0;
  C = (C | 0) > 0 ? C : 0;
  B = h - c | 0;
  B = (B | 0) > (f | 0) ? f : B;
  if (!((J | 0) < (D | 0) & (C | 0) <= (B | 0))) {
   l = 0;
   return l | 0;
  }
  F = (C | 0) < (B | 0);
  G = B + -1 | 0;
  H = D + -1 | 0;
  I = f << 2;
  E = J;
  g = 0;
  do {
   if (F) {
    x = R(E, f) | 0;
    y = (E | 0) == (J | 0);
    z = (E | 0) == (H | 0);
    A = (R(E + e | 0, h) | 0) + c | 0;
    w = C;
    do {
     i = w + x << 2;
     u = (w | 0) == (G | 0);
     v = A + w << 2;
     a : do if ((w | 0) == (C | 0)) {
      t = 0;
      while (1) {
       s = b + i | 0;
       r = a[s >> 0] | 0;
       b : do switch (r << 24 >> 24) {
       case 0:
       case -1:
        break;
       default:
        {
         if (u) q = 0; else q = (d[b + (i + 4) >> 0] | 0) - (r & 255) | 0;
         if (y) n = 0; else n = (d[b + (i - I) >> 0] | 0) - (r & 255) | 0;
         if (z) o = 0; else o = (d[b + (i + I) >> 0] | 0) - (r & 255) | 0;
         p = o + n | 0;
         n = t + v & 127;
         do if (n >>> 0 <= 95) {
          if (n >>> 0 > 63) {
           n = 1 << n + -64 & l;
           break;
          }
          if (n >>> 0 > 31) {
           n = 1 << n + -32 & k;
           break;
          } else {
           n = 1 << n & j;
           break;
          }
         } else n = 1 << n + -96 & m; while (0);
         n = (n | 0) != 0;
         if (p | q) {
          g = g + 1 | 0;
          if ((q | 0) > 0) {
           a[s >> 0] = (r & 255) + (n & 1);
           break b;
          }
          if ((q | 0) < 0) {
           a[s >> 0] = (r & 255) - (n & 1);
           break b;
          }
          o = n & 1;
          n = r & 255;
          if ((p | 0) > 0) {
           a[s >> 0] = n + o;
           break b;
          } else {
           a[s >> 0] = n - o;
           break b;
          }
         }
        }
       } while (0);
       t = t + 1 | 0;
       if ((t | 0) == 4) break a; else i = i + 1 | 0;
      }
     } else {
      s = 0;
      while (1) {
       r = b + i | 0;
       n = a[r >> 0] | 0;
       c : do switch (n << 24 >> 24) {
       case 0:
       case -1:
        break;
       default:
        {
         q = n & 255;
         if (u) n = 0; else n = (d[b + (i + 4) >> 0] | 0) - q | 0;
         p = n + ((d[b + (i + -4) >> 0] | 0) - q) | 0;
         if (y) n = 0; else n = (d[b + (i - I) >> 0] | 0) - q | 0;
         if (z) o = 0; else o = (d[b + (i + I) >> 0] | 0) - q | 0;
         o = o + n | 0;
         n = s + v & 127;
         do if (n >>> 0 <= 95) {
          if (n >>> 0 > 63) {
           n = 1 << n + -64 & l;
           break;
          }
          if (n >>> 0 > 31) {
           n = 1 << n + -32 & k;
           break;
          } else {
           n = 1 << n & j;
           break;
          }
         } else n = 1 << n + -96 & m; while (0);
         n = (n | 0) != 0;
         if (o | p) {
          g = g + 1 | 0;
          if ((p | 0) > 0) {
           a[r >> 0] = q + (n & 1);
           break c;
          }
          if ((p | 0) < 0) {
           a[r >> 0] = q - (n & 1);
           break c;
          }
          n = n & 1;
          if ((o | 0) > 0) {
           a[r >> 0] = q + n;
           break c;
          } else {
           a[r >> 0] = q - n;
           break c;
          }
         }
        }
       } while (0);
       s = s + 1 | 0;
       if ((s | 0) == 4) break a; else i = i + 1 | 0;
      }
     } while (0);
     w = w + 1 | 0;
    } while ((w | 0) < (B | 0));
   }
   E = E + 1 | 0;
  } while ((E | 0) < (D | 0));
  return g | 0;
 }
 return {
  _apply_noise: $
 };
}
