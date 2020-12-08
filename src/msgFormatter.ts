import * as moment from "moment";
import { RuntimeFunctionGenerator } from "./RuntimeFunctionGenerator";
import * as localeDataStorage from "./localeDataStorage";
import * as numberFormatter from "./numberFormatter";
import { MsgAst } from "./msgFormatParser";
import { f } from "./translate";
import { isString, isArray } from "bobril";

(<any>window).moment = moment;

var numberFormatterCache: { [locale_format: string]: (val: number) => string } = Object.create(null);

function getFormatter(locale: string, format: string): (val: number) => string {
    const key = locale + "|" + format;
    let res = numberFormatterCache[key];
    if (res) return res;
    res = numberFormatter.buildFormatter(localeDataStorage.getRules(locale), format);
    numberFormatterCache[key] = res;
    return res;
}

function noFuture(m: moment.Moment): moment.Moment {
    if (m.toDate() > new Date()) return moment(new Date());
    return m;
}

function AnyFormatter(
    locale: string,
    type: string,
    style: string,
    options: Object
): (value: any, options: Object) => string {
    switch (type) {
        case "number": {
            if (style === "custom" && "format" in options) {
                if ((options as any).format === null)
                    return (val, opt) => {
                        return getFormatter(locale, (opt as any).format)(val);
                    };
                return getFormatter(locale, (options as any).format);
            }
            if (style === "default") {
                return getFormatter(locale, "0,0.[0000]");
            }
            if (style === "percent") {
                return getFormatter(locale, "0%");
            }
            if (style === "bytes") {
                return getFormatter(locale, "0b");
            }
            break;
        }
        case "date":
        case "time": {
            if (style === "relative") {
                if ((<any>options)["noago"] === true) {
                    return (val, _opt) => {
                        return moment(val).locale(locale).fromNow(true);
                    };
                }
                if ((<any>options)["noago"] === null) {
                    return (val, opt) => {
                        return moment(val)
                            .locale(locale)
                            .fromNow((<any>opt)["noago"]);
                    };
                }
                return (val, _opt) => {
                    return moment(val).locale(locale).fromNow(false);
                };
            }
            if (style === "relativepast") {
                if ((<any>options)["noago"] === true) {
                    return (val, _opt) => {
                        return noFuture(moment(val)).locale(locale).fromNow(true);
                    };
                }
                if ((<any>options)["noago"] === null) {
                    return (val, opt) => {
                        return noFuture(moment(val))
                            .locale(locale)
                            .fromNow((<any>opt)["noago"]);
                    };
                }
                return (val, _opt) => {
                    return noFuture(moment(val)).locale(locale).fromNow(false);
                };
            }
            if (style === "calendar") {
                return (val, _opt) => {
                    return moment(val).locale(locale).calendar();
                };
            }
            if (style === "custom" && "format" in options) {
                return (val, opt) => {
                    return moment(val)
                        .locale(locale)
                        .format((<any>opt).format);
                };
            }
            return (val, _opt) => {
                return moment(val).locale(locale).format(style);
            };
        }
    }
    throw new Error("bad type in AnyFormatter");
}

export function compile(locale: string, msgAst: MsgAst): (params?: Object, hashArg?: string) => string {
    if (isString(msgAst)) {
        return () => msgAst;
    }
    if (isArray(msgAst)) {
        if (msgAst.length === 0) return () => "";
        let comp = new RuntimeFunctionGenerator();
        let argParams = comp.addArg(0);
        let argHash = comp.addArg(1);
        comp.addBody("return ");
        for (let i = 0; i < msgAst.length; i++) {
            if (i > 0) comp.addBody("+");
            let item = msgAst[i]!;
            if (typeof item === "string") {
                comp.addBody(comp.addConstant(item));
            } else {
                comp.addBody(comp.addConstant(compile(locale, item)) + `(${argParams},${argHash})`);
            }
        }
        comp.addBody(";");
        return <(params?: Object, hashArg?: string) => string>comp.build();
    }
    switch (msgAst.type) {
        case "arg":
            return ((name: string) => (params?: Object) => f((<any>params)[name]))(msgAst.id);
        case "hash":
            return (_params, hashArg) => {
                if (hashArg === undefined) return "#";
                return hashArg;
            };
        case "concat": {
            const vals = msgAst.values;
            if (vals.length === 0) return () => "";
            let comp = new RuntimeFunctionGenerator();
            let argParams = comp.addArg(0);
            let argHash = comp.addArg(1);
            comp.addBody("return [");
            for (let i = 0; i < vals.length; i++) {
                if (i > 0) comp.addBody(",");
                let item = vals[i]!;
                if (isString(item)) {
                    comp.addBody(comp.addConstant(item));
                } else {
                    comp.addBody(comp.addConstant(compile(locale, item)) + `(${argParams},${argHash})`);
                }
            }
            comp.addBody("];");
            return <(params?: Object, hashArg?: string) => string>comp.build();
        }
        case "el":
            if (msgAst.value != undefined) {
                return ((id: number, valueFactory: (params?: Object, hashArg?: string) => any) => (
                    params?: Object,
                    hashArg?: string
                ) => (<any>params)[id](valueFactory(params, hashArg)))(msgAst.id, compile(locale, msgAst.value));
            }
            return ((id: number) => (params?: Object) => (<any>params)[id]())(msgAst.id);
        case "format":
            let comp = new RuntimeFunctionGenerator();
            let argParams = comp.addArg(0);
            let localArg = comp.addLocal();
            comp.addBody(`var ${localArg}=${argParams}[${comp.addConstant(msgAst.id)}];`);
            let type = msgAst.format.type;
            switch (type) {
                case "plural": {
                    let localArgOffset = comp.addLocal();
                    comp.addBody(`var ${localArgOffset}=${localArg}-${msgAst.format.offset};`);
                    let options = msgAst.format.options;
                    for (let i = 0; i < options.length; i++) {
                        let opt = options[i];
                        if (typeof opt.selector !== "number") continue;
                        let fn = comp.addConstant(compile(locale, opt.value));
                        comp.addBody(
                            `if (${localArgOffset}===${opt.selector}) return ${fn}(${argParams},''+${localArgOffset});`
                        );
                    }
                    let localCase = comp.addLocal();
                    let pluralFn = comp.addConstant(localeDataStorage.getRules(locale).pluralFn);
                    comp.addBody(
                        `var ${localCase}=${pluralFn}(${localArgOffset},${msgAst.format.ordinal ? "true" : "false"});`
                    );
                    for (let i = 0; i < options.length; i++) {
                        let opt = options[i];
                        if (typeof opt.selector !== "string") continue;
                        if (opt.selector === "other") continue;
                        let fn = comp.addConstant(compile(locale, opt.value));
                        comp.addBody(
                            `if (${localCase}===${comp.addConstant(
                                opt.selector
                            )}) return ${fn}(${argParams},''+${localArgOffset});`
                        );
                    }
                    for (let i = 0; i < options.length; i++) {
                        let opt = options[i];
                        if (opt.selector !== "other") continue;
                        let fn = comp.addConstant(compile(locale, opt.value));
                        comp.addBody(`return ${fn}(${argParams},''+${localArgOffset});`);
                    }
                    break;
                }
                case "select": {
                    let options = msgAst.format.options;
                    for (let i = 0; i < options.length; i++) {
                        let opt = options[i];
                        if (typeof opt.selector !== "string") continue;
                        if (opt.selector === "other") continue;
                        let fn = comp.addConstant(compile(locale, opt.value));
                        comp.addBody(
                            `if (${localArg}===${comp.addConstant(
                                opt.selector
                            )}) return ${fn}(${argParams},${localArg});`
                        );
                    }
                    for (let i = 0; i < options.length; i++) {
                        let opt = options[i];
                        if (opt.selector !== "other") continue;
                        let fn = comp.addConstant(compile(locale, opt.value));
                        comp.addBody(`return ${fn}(${argParams},${localArg});`);
                    }
                    break;
                }
                case "number":
                case "date":
                case "time": {
                    let style = msgAst.format.style || "default";
                    let options = msgAst.format.options;
                    if (options) {
                        let opt = {};
                        let complex = false;
                        for (let i = 0; i < options.length; i++) {
                            if (typeof options[i].value === "object") {
                                complex = true;
                                (<any>opt)[options[i].key] = null;
                            } else {
                                let val = options[i].value;
                                if (val === undefined) val = true;
                                (<any>opt)[options[i].key] = val;
                            }
                        }
                        let formatFn = comp.addConstant(AnyFormatter(locale, type, style, opt));
                        if (complex) {
                            let optConst = comp.addConstant(opt);
                            let optLocal = comp.addLocal();
                            let hashArg = comp.addArg(1);
                            comp.addBody(`var ${optLocal}=${optConst};`);
                            for (let i = 0; i < options.length; i++) {
                                if (typeof options[i].value === "object") {
                                    let fnConst = comp.addConstant(compile(locale, options[i].value));
                                    comp.addBody(
                                        `${optLocal}[${comp.addConstant(
                                            options[i].key
                                        )}]=${fnConst}(${argParams},${hashArg});`
                                    );
                                }
                            }
                            comp.addBody(`return ${formatFn}(${localArg},${optLocal});`);
                        } else {
                            comp.addBody(`return ${formatFn}(${localArg},${comp.addConstant(opt)});`);
                        }
                    } else {
                        let formatFn = comp.addConstant(AnyFormatter(locale, type, style, {}));
                        comp.addBody(`return ${formatFn}(${localArg});`);
                    }
                }
            }
            return <(params?: Object, hashArg?: string) => string>comp.build();
    }
    throw new Error("invalid AST in compile");
}
