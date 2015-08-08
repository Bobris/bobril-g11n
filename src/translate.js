var msgFormatParser = require("./msgFormatParser");
var msgFormatter = require('./msgFormatter');
var b = require('node_modules/bobril/index');
var jsonp_1 = require('./jsonp');
var localeDataStorage = require('./localeDataStorage');
var cfg = {};
var loadedLocales = Object.create(null);
var registeredTranslations = Object.create(null);
var initWasStarted = false;
var currentLocale = '';
var currentTranslations = [];
var currentCachedFormat = [];
var stringCachedFormats = Object.create(null);
function currentTranslationMessage(message) {
    var text = currentTranslations[message];
    if (text === undefined) {
        throw new Error('message ' + message + ' is not defined');
    }
    return text;
}
function t(message, params, translationHelp) {
    if (currentLocale.length === 0) {
        throw new Error('before using t you need to wait for initialization of g11n');
    }
    var format;
    if (typeof message === 'number') {
        if (params == null) {
            return currentTranslationMessage(message);
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
            return message;
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
    return format(params);
}
exports.t = t;
function initGlobalization(config) {
    if (initWasStarted) {
        throw new Error('initLocalization must be called only once');
    }
    cfg = config;
    initWasStarted = true;
    var prom = Promise.resolve(null);
    prom = prom.then(function () { return setLocale(config.defaultLocale || 'en'); });
    b.setBeforeInit(function (cb) {
        prom.then(cb);
    });
    return prom;
}
function setLocale(locale) {
    var prom = Promise.resolve(null);
    if (currentLocale === locale)
        return prom;
    if (!loadedLocales[locale]) {
        loadedLocales[locale] = true;
        var pathToTranslation = cfg.pathToTranslation;
        if (pathToTranslation) {
            prom = prom.then(function () {
                jsonp_1.jsonp(pathToTranslation(locale));
            });
        }
    }
    prom = prom.then(function () {
        currentLocale = locale;
        currentTranslations = registeredTranslations[locale];
        currentCachedFormat = [];
        currentCachedFormat.length = currentTranslations.length;
    });
    return prom;
}
function getLocale() {
    return currentLocale;
}
function registerTranslations(locale, pluralFn, msgs) {
    if (typeof pluralFn === 'function')
        localeDataStorage.setPluralRule(locale, pluralFn);
    if (Array.isArray(msgs))
        registeredTranslations[locale] = msgs;
    loadedLocales[locale] = true;
}
if (window)
    window['bobrilRegisterTranslations'] = registerTranslations;
