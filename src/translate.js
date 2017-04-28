"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../typings/moment/moment-node.d.ts" />
var msgFormatParser = require("./msgFormatParser");
var msgFormatter = require("./msgFormatter");
var jsonp_1 = require("./jsonp");
var localeDataStorage = require("./localeDataStorage");
var numberFormatter = require("./numberFormatter");
var spyTranslationFunc;
function newMap() {
    return Object.create(null);
}
var cfg = {
    defaultLocale: "en-US",
    pathToTranslation: function () { return undefined; }
};
var loadedLocales = newMap();
var registeredTranslations = newMap();
var initWasStarted = false;
var currentLocale = '';
var currentRules = localeDataStorage.getRules("en");
var currentUnformatter;
var currentTranslations = [];
var currentCachedFormat = [];
var stringCachedFormats = newMap();
var momentInstance;
if (window.g11nPath) {
    cfg.pathToTranslation = window.g11nPath;
}
if (window.g11nLoc) {
    cfg.defaultLocale = window.g11nLoc;
}
function currentTranslationMessage(message) {
    var text = currentTranslations[message];
    if (text === undefined) {
        throw new Error('message ' + message + ' is not defined');
    }
    return text;
}
function spyTranslatedString(translated) {
    if (spyTranslationFunc === undefined)
        return translated;
    return spyTranslationFunc(translated);
}
function t(message, params, _translationHelp) {
    if (currentLocale.length === 0) {
        throw new Error('before using t you need to wait for initialization of g11n');
    }
    var format;
    if (typeof message === 'number') {
        if (params == null) {
            return spyTranslatedString(currentTranslationMessage(message));
        }
        format = currentCachedFormat[message];
        if (format === undefined) {
            var ast = msgFormatParser.parse(currentTranslationMessage(message));
            if (ast.type === 'error') {
                throw new Error('message ' + message + ' in ' + currentLocale + ' has error: ' + ast.msg);
            }
            format = msgFormatter.compile(currentLocale, ast);
            currentCachedFormat[message] = format;
        }
    }
    else {
        if (params == null)
            return spyTranslatedString(message);
        format = stringCachedFormats[message];
        if (format === undefined) {
            var ast = msgFormatParser.parse(message);
            if (ast.type === 'error') {
                throw new Error('message "' + message + '" has error: ' + ast.msg + ' on position: ' + ast.pos);
            }
            format = msgFormatter.compile(currentLocale, ast);
            stringCachedFormats[message] = format;
        }
    }
    return spyTranslatedString(format(params));
}
exports.t = t;
function f(message, params) {
    return t(message, params);
}
exports.f = f;
var initPromise = Promise.resolve(null);
initPromise = initPromise.then(function () { return setLocale(cfg.defaultLocale); });
b.setBeforeInit(function (cb) {
    initPromise.then(cb, cb);
});
function initGlobalization(config) {
    if (initWasStarted) {
        throw new Error('initLocalization must be called only once');
    }
    Object.assign(cfg, config);
    initWasStarted = true;
    if (currentLocale.length !== 0) {
        if (!loadedLocales[currentLocale]) {
            currentLocale = "";
        }
        return setLocale(cfg.defaultLocale);
    }
    return initPromise;
}
exports.initGlobalization = initGlobalization;
function setLocale(locale) {
    var prom = Promise.resolve();
    if (currentLocale === locale)
        return prom;
    if (!loadedLocales[locale]) {
        var pathToTranslation = cfg.pathToTranslation;
        if (pathToTranslation) {
            var p_1 = pathToTranslation(locale);
            if (p_1) {
                prom = prom.then(function () { return jsonp_1.jsonp(p_1); }).catch(function (e) {
                    console.warn(e);
                    if (locale != cfg.defaultLocale)
                        return setLocale(cfg.defaultLocale).then(function () { return Promise.reject(e); });
                    return undefined;
                });
            }
        }
    }
    prom = prom.then(function () {
        currentLocale = locale;
        currentRules = localeDataStorage.getRules(locale);
        currentTranslations = registeredTranslations[locale] || [];
        currentUnformatter = undefined;
        currentCachedFormat = [];
        currentCachedFormat.length = currentTranslations.length;
        stringCachedFormats = newMap();
        momentInstance = window.moment().locale(currentLocale);
        b.ignoreShouldChange();
    });
    return prom;
}
exports.setLocale = setLocale;
function getLocale() {
    return currentLocale;
}
exports.getLocale = getLocale;
function getMoment(init, init2, init3) {
    if (init !== undefined) {
        return window.moment(init, init2, init3).locale(currentLocale);
    }
    return momentInstance.clone();
}
exports.getMoment = getMoment;
function unformatNumber(str) {
    if (currentUnformatter === undefined) {
        currentUnformatter = numberFormatter.buildUnformat(currentRules);
    }
    return currentUnformatter(str);
}
exports.unformatNumber = unformatNumber;
function registerTranslations(locale, localeDefs, msgs) {
    if (Array.isArray(localeDefs)) {
        localeDataStorage.setRules(locale, localeDefs);
    }
    if (Array.isArray(msgs))
        registeredTranslations[locale] = msgs;
    loadedLocales[locale] = true;
}
exports.registerTranslations = registerTranslations;
function spyTranslation(spyFn) {
    if (spyFn === undefined)
        return spyTranslationFunc;
    if (spyFn === null) {
        spyTranslationFunc = undefined;
    }
    else {
        spyTranslationFunc = spyFn;
    }
    return spyTranslationFunc;
}
exports.spyTranslation = spyTranslation;
if (window) {
    window['bobrilRegisterTranslations'] = registerTranslations;
    window['b'].spyTr = spyTranslation;
}
