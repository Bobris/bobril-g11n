"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RuntimeFunctionGenerator_1 = require("./RuntimeFunctionGenerator");
var localeDataStorage = require("./localeDataStorage");
var numberFormatter = require("./numberFormatter");
var moment = require('moment');
window.moment = moment;
var numberFormatterCache = Object.create(null);
function getFormatter(locale, format) {
    var key = locale + '|' + format;
    var res = numberFormatterCache[key];
    if (res)
        return res;
    res = numberFormatter.buildFormatter(localeDataStorage.getRules(locale), format);
    numberFormatterCache[key] = res;
    return res;
}
function AnyFormatter(locale, type, style, options) {
    switch (type) {
        case 'number': {
            if (style === 'custom' && 'format' in options) {
                if (options.format === null)
                    return function (val, opt) { return getFormatter(locale, opt.format)(val); };
                return getFormatter(locale, options.format);
            }
            if (style === 'default') {
                return getFormatter(locale, '0,0.[0000]');
            }
            if (style === 'percent') {
                return getFormatter(locale, '0%');
            }
            if (style === 'bytes') {
                return getFormatter(locale, '0b');
            }
            break;
        }
        case 'date':
        case 'time': {
            if (style === 'relative') {
                if (options['noago'] === true) {
                    return function (val, _opt) { return moment(val).locale(locale).fromNow(true); };
                }
                if (options['noago'] === null) {
                    return function (val, opt) { return moment(val).locale(locale).fromNow(opt['noago']); };
                }
                return function (val, _opt) { return moment(val).locale(locale).fromNow(false); };
            }
            if (style === 'calendar') {
                return function (val, _opt) { return moment(val).locale(locale).calendar(); };
            }
            if (style === 'custom' && 'format' in options) {
                return function (val, opt) { return moment(val).locale(locale).format(opt.format); };
            }
            return function (val, _opt) { return moment(val).locale(locale).format(style); };
        }
    }
    throw new Error("bad type in AnyFormatter");
}
function compile(locale, msgAst) {
    if (typeof msgAst === 'string') {
        return function () { return msgAst; };
    }
    if (Array.isArray(msgAst)) {
        if (msgAst.length === 0)
            return function () { return ''; };
        var comp = new RuntimeFunctionGenerator_1.RuntimeFunctionGenerator();
        var argParams = comp.addArg(0);
        var argHash = comp.addArg(1);
        comp.addBody('return ');
        for (var i = 0; i < msgAst.length; i++) {
            if (i > 0)
                comp.addBody('+');
            var item = msgAst[i];
            if (typeof item === 'string') {
                comp.addBody(comp.addConstant(item));
            }
            else {
                comp.addBody(comp.addConstant(compile(locale, item)) + ("(" + argParams + "," + argHash + ")"));
            }
        }
        comp.addBody(';');
        return comp.build();
    }
    switch (msgAst.type) {
        case 'arg':
            return (function (name) { return function (params) { return params[name]; }; })(msgAst.id);
        case 'hash':
            return function (_params, hashArg) {
                if (hashArg === undefined)
                    return '#';
                return hashArg;
            };
        case 'format':
            var comp = new RuntimeFunctionGenerator_1.RuntimeFunctionGenerator();
            var argParams = comp.addArg(0);
            var localArg = comp.addLocal();
            comp.addBody("var " + localArg + "=" + argParams + "[" + comp.addConstant(msgAst.id) + "];");
            var type = msgAst.format.type;
            switch (type) {
                case 'plural':
                    {
                        var localArgOffset = comp.addLocal();
                        comp.addBody("var " + localArgOffset + "=" + localArg + "-" + msgAst.format.offset + ";");
                        var options = msgAst.format.options;
                        for (var i = 0; i < options.length; i++) {
                            var opt = options[i];
                            if (typeof opt.selector !== 'number')
                                continue;
                            var fn = comp.addConstant(compile(locale, opt.value));
                            comp.addBody("if (" + localArgOffset + "===" + opt.selector + ") return " + fn + "(" + argParams + ",''+" + localArgOffset + ");");
                        }
                        var localCase = comp.addLocal();
                        var pluralFn = comp.addConstant(localeDataStorage.getRules(locale).pluralFn);
                        comp.addBody("var " + localCase + "=" + pluralFn + "(" + localArgOffset + "," + (msgAst.format.ordinal ? 'true' : 'false') + ");");
                        for (var i = 0; i < options.length; i++) {
                            var opt = options[i];
                            if (typeof opt.selector !== 'string')
                                continue;
                            if (opt.selector === 'other')
                                continue;
                            var fn = comp.addConstant(compile(locale, opt.value));
                            comp.addBody("if (" + localCase + "===" + comp.addConstant(opt.selector) + ") return " + fn + "(" + argParams + ",''+" + localArgOffset + ");");
                        }
                        for (var i = 0; i < options.length; i++) {
                            var opt = options[i];
                            if (opt.selector !== 'other')
                                continue;
                            var fn = comp.addConstant(compile(locale, opt.value));
                            comp.addBody("return " + fn + "(" + argParams + ",''+" + localArgOffset + ");");
                        }
                        break;
                    }
                case 'select':
                    {
                        var options = msgAst.format.options;
                        for (var i = 0; i < options.length; i++) {
                            var opt = options[i];
                            if (typeof opt.selector !== 'string')
                                continue;
                            if (opt.selector === 'other')
                                continue;
                            var fn = comp.addConstant(compile(locale, opt.value));
                            comp.addBody("if (" + localArg + "===" + comp.addConstant(opt.selector) + ") return " + fn + "(" + argParams + "," + localArg + ");");
                        }
                        for (var i = 0; i < options.length; i++) {
                            var opt = options[i];
                            if (opt.selector !== 'other')
                                continue;
                            var fn = comp.addConstant(compile(locale, opt.value));
                            comp.addBody("return " + fn + "(" + argParams + "," + localArg + ");");
                        }
                        break;
                    }
                case 'number':
                case 'date':
                case 'time':
                    {
                        var style = msgAst.format.style || 'default';
                        var options = msgAst.format.options;
                        if (options) {
                            var opt = {};
                            var complex = false;
                            for (var i = 0; i < options.length; i++) {
                                if (typeof options[i].value === 'object') {
                                    complex = true;
                                    opt[options[i].key] = null;
                                }
                                else {
                                    var val = options[i].value;
                                    if (val === undefined)
                                        val = true;
                                    opt[options[i].key] = val;
                                }
                            }
                            var formatFn = comp.addConstant(AnyFormatter(locale, type, style, opt));
                            if (complex) {
                                var optConst = comp.addConstant(opt);
                                var optLocal = comp.addLocal();
                                var hashArg = comp.addArg(1);
                                comp.addBody("var " + optLocal + "=" + optConst + ";");
                                for (var i = 0; i < options.length; i++) {
                                    if (typeof options[i].value === 'object') {
                                        var fnConst = comp.addConstant(compile(locale, options[i].value));
                                        comp.addBody(optLocal + "[" + comp.addConstant(options[i].key) + "]=" + fnConst + "(" + argParams + "," + hashArg + ");");
                                    }
                                }
                                comp.addBody("return " + formatFn + "(" + localArg + "," + optLocal + ");");
                            }
                            else {
                                comp.addBody("return " + formatFn + "(" + localArg + "," + comp.addConstant(opt) + ");");
                            }
                        }
                        else {
                            var formatFn = comp.addConstant(AnyFormatter(locale, type, style, {}));
                            comp.addBody("return " + formatFn + "(" + localArg + ");");
                        }
                    }
            }
            return comp.build();
    }
    throw new Error("invalid AST in compile");
}
exports.compile = compile;
