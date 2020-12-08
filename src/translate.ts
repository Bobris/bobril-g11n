import * as b from "bobril";
import * as moment from "moment";
import * as msgFormatParser from "./msgFormatParser";
import * as msgFormatter from "./msgFormatter";
import { jsonp } from "./jsonp";
import * as localeDataStorage from "./localeDataStorage";
import * as numberFormatter from "./numberFormatter";

export interface IG11NConfig {
    defaultLocale?: string;
    pathToTranslation?: (locale: string) => string | undefined;
    runScriptAsync?: (url: string) => Promise<void>;
}

export type DelayedMessage = [number | string, Object?];
export type SerializableDelayedMessage = [string, Object?];

let spyTranslationFunc: ((text: string) => string) | undefined;

interface IMessageFormat {
    (params?: Object): string;
}

function newMap(): any {
    return Object.create(null);
}

let cfg: IG11NConfig = {
    defaultLocale: "en-US",
    pathToTranslation: () => undefined,
    runScriptAsync: jsonp,
};

let loadedLocales: { [name: string]: boolean } = newMap();
export let registeredTranslations: { [name: string]: string[] } = newMap();
let initWasStarted = false;
let currentLocale = "";
let currentRules: localeDataStorage.ILocaleRules = localeDataStorage.getRules("en");
let currentUnformatter: ((val: string) => number) | undefined;
let currentTranslations: string[] = [];
let currentCachedFormat: IMessageFormat[] = [];
let stringCachedFormats: { [input: string]: IMessageFormat } = newMap();
let keysByTranslationId: string[] | undefined = undefined;
let key2TranslationId: Map<string, number> | undefined = undefined;

if ((<any>window).g11nPath) {
    cfg.pathToTranslation = (<any>window).g11nPath;
}

if ((<any>window).g11nLoc) {
    cfg.defaultLocale = (<any>window).g11nLoc;
}

function currentTranslationMessage(message: number): string {
    let text = currentTranslations[message];
    if (text === undefined) {
        throw new Error("message " + message + " is not defined");
    }
    return text;
}

function spyTranslatedString(translated: string) {
    if (spyTranslationFunc === undefined) return translated;

    return spyTranslationFunc(translated);
}

export function t(
    message: string | number | DelayedMessage | SerializableDelayedMessage,
    params?: Object,
    _translationHelp?: string
): string {
    if (currentLocale.length === 0) {
        throw new Error("before using t you need to wait for initialization of g11n");
    }
    let format: IMessageFormat | undefined;
    if (Array.isArray(message)) {
        if (typeof message[0] === "string") {
            return formatSerializedMessage(message as SerializableDelayedMessage);
        }
        return formatDelayedMessage(message);
    }
    if (typeof message === "number") {
        if (params == null) {
            return spyTranslatedString(currentTranslationMessage(message));
        }
        format = currentCachedFormat[message];
        if (format === undefined) {
            let ast = msgFormatParser.parse(currentTranslationMessage(message));
            if (msgFormatParser.isParserError(ast)) {
                throw new Error("message " + message + " in " + currentLocale + " has error: " + ast.msg);
            }
            format = msgFormatter.compile(currentLocale, ast);
            currentCachedFormat[message] = format;
        }
    } else {
        if (params == null) return spyTranslatedString(message);
        format = stringCachedFormats[message];
        if (format === undefined) {
            let ast = msgFormatParser.parse(message);
            if (msgFormatParser.isParserError(ast)) {
                throw new Error('message "' + message + '" has error: ' + ast.msg + " on position: " + ast.pos);
            }
            format = msgFormatter.compile(currentLocale, ast);
            stringCachedFormats[message] = format;
        }
    }
    return spyTranslatedString(format(params));
}

export function dt(message: string | number, params?: Object, _translationHelp?: string): DelayedMessage {
    if (params == undefined) return [message as number];
    return [message as number, params];
}

let lazyLoadKeys: Promise<void> | undefined = undefined;

export function loadSerializationKeys(): Promise<void> {
    if (lazyLoadKeys === undefined) {
        lazyLoadKeys = cfg.runScriptAsync!(cfg.pathToTranslation!("l10nkeys")!).then(invokeInvalidate);
    }
    return lazyLoadKeys;
}

export function serializationKeysLoaded(): boolean {
    return keysByTranslationId != undefined;
}

const HOP = {}.hasOwnProperty;

function serializeParams(params: Object | undefined): Object | undefined {
    if (params == undefined) return params;
    let needSerialization = false;
    for (const key in params) {
        if (HOP.call(params, key)) {
            const element = (params as any)[key];
            if (Array.isArray(element)) {
                needSerialization = true;
                break;
            }
        }
    }
    if (!needSerialization) return params;
    let res = {} as any;
    for (const key in params) {
        if (HOP.call(params, key)) {
            let element = (params as any)[key];
            if (Array.isArray(element)) {
                element = serializeMessage(element as DelayedMessage);
            }
            res[key] = element;
        }
    }
    return res;
}

export function serializeMessage(message: DelayedMessage): SerializableDelayedMessage {
    if (keysByTranslationId === undefined) throw new Error("Make sure to await loadSerializationKeys");
    let m = message[0];
    if (typeof m == "string") {
        if (message.length === 1) {
            if (key2TranslationId!.has(m) || m.endsWith("\t0")) return message as SerializableDelayedMessage;
            return [m + "\t0"];
        }
        if (key2TranslationId!.has(m) || m.endsWith("\t1")) return message as SerializableDelayedMessage;
        return [m + "\t1", serializeParams(message[1])];
    }
    let key = keysByTranslationId[m]!;
    if (message.length == 1) return [key];
    return [key, serializeParams(message[1])];
}

export function formatDelayedMessage(message: DelayedMessage): string {
    return t(message[0], message[1]);
}

export function deserializeMessage(message: SerializableDelayedMessage): DelayedMessage {
    let id: string | number | undefined = undefined;
    if (!serializationKeysLoaded()) {
        loadSerializationKeys();
    } else {
        id = key2TranslationId!.get(message[0]);
    }
    if (id === undefined) {
        id = message[0];
        id = id.substr(0, id.lastIndexOf("\t"));
    }
    if (message.length === 1) {
        return [id];
    }
    return [id, message[1]];
}

export function formatSerializedMessage(message: SerializableDelayedMessage): string {
    return formatDelayedMessage(deserializeMessage(message));
}

export function f(message: DelayedMessage | SerializableDelayedMessage): string;
export function f(message: string, params: Object): string;
export function f(message: string): string;
export function f(message: string | DelayedMessage | SerializableDelayedMessage, params?: Object): string {
    if (typeof message !== "object" && params === undefined) return message;
    return t(message, params);
}

let initPromise = Promise.resolve<any>(null);
initPromise = initPromise.then(() => setLocale(cfg.defaultLocale!));
if (b != null && b.setBeforeInit != null) {
    b.setBeforeInit((cb: (_: any) => void) => {
        initPromise.then(cb, cb);
    });
}

export function initGlobalization(config?: IG11NConfig): Promise<void> {
    if (initWasStarted) {
        throw new Error("initLocalization must be called only once");
    }
    Object.assign(cfg, config);
    initWasStarted = true;
    if (currentLocale.length !== 0) {
        if (!loadedLocales[currentLocale]) {
            currentLocale = "";
        }
        return setLocale(cfg.defaultLocale!);
    }
    return initPromise;
}

export function setLocale(locale: string): Promise<void> {
    let prom = Promise.resolve();
    if (currentLocale === locale) return prom;
    var lcLocale = locale.toLowerCase();
    if (!loadedLocales[lcLocale]) {
        let pathToTranslation = cfg.pathToTranslation;
        if (pathToTranslation) {
            let p = pathToTranslation(locale);
            if (p) {
                prom = prom
                    .then(() => cfg.runScriptAsync!(p!))
                    .catch((e) => {
                        console.warn(e);
                        if (locale != cfg.defaultLocale)
                            return setLocale(cfg.defaultLocale!).then(() => Promise.reject(e) as Promise<void>);
                        return undefined;
                    });
            }
        }
    }
    prom = prom.then(() => {
        currentLocale = locale;
        currentRules = localeDataStorage.getRules(lcLocale);
        currentTranslations = registeredTranslations[lcLocale] || [];
        currentUnformatter = undefined;
        currentCachedFormat = [];
        currentCachedFormat.length = currentTranslations.length;
        stringCachedFormats = newMap();
        moment.locale(currentLocale);
        invokeInvalidate();
    });
    return prom;
}

function invokeInvalidate() {
    if (b != null && b.ignoreShouldChange != null) b.ignoreShouldChange();
}

export function getLocale(): string {
    return currentLocale;
}

export const getMoment = moment;

export function unformatNumber(str: string): number {
    if (currentUnformatter === undefined) {
        currentUnformatter = numberFormatter.buildUnformat(currentRules);
    }
    return currentUnformatter(str);
}

export function registerTranslations(locale: string, localeDefs: any[], msgs: string[]): void {
    if (locale == "") {
        keysByTranslationId = msgs;
        key2TranslationId = new Map<string, number>();
        for (let i = 0; i < msgs.length; i++) {
            key2TranslationId.set(msgs[i]!, i);
        }
        return;
    }
    locale = locale.toLowerCase();
    if (Array.isArray(localeDefs)) {
        localeDataStorage.setRules(locale, localeDefs);
    }
    if (Array.isArray(msgs)) registeredTranslations[locale] = msgs;
    loadedLocales[locale] = true;
}

export function spyTranslation(spyFn?: ((text: string) => string) | null): ((text: string) => string) | undefined {
    if (spyFn === undefined) return spyTranslationFunc;
    if (spyFn === null) {
        spyTranslationFunc = undefined;
    } else {
        spyTranslationFunc = spyFn;
    }
    return spyTranslationFunc;
}

if (window) {
    (<any>window)["bobrilRegisterTranslations"] = registerTranslations;
    if ((<any>window)["b"] != null) (<any>window)["b"].spyTr = spyTranslation;
}

export function T(data?: b.IFragmentData | Record<string, any>) {
    return data;
}
