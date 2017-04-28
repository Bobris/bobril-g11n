"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RuntimeFunctionGenerator_1 = require("./RuntimeFunctionGenerator");
var escapeRegExpMatcher = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
function escapeRegExp(str) {
    return str.replace(escapeRegExpMatcher, "\\$&");
}
exports.escapeRegExp = escapeRegExp;
function buildFormatter(rules, format) {
    if (format == "0b" || format == "0 b") {
        var suffixes_1 = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var space_1 = format == "0 b" ? "\xa0" : "";
        return function (val) {
            var suffix = "";
            for (var power = 0; power <= suffixes_1.length; power++) {
                var min = Math.pow(1000, power);
                var max = Math.pow(1000, power + 1);
                if (val === 0 || val >= min && val < max) {
                    suffix += suffixes_1[power];
                    if (min > 0) {
                        val = val / min;
                    }
                    break;
                }
            }
            return val.toFixed(0) + space_1 + suffix;
        };
    }
    if (format.indexOf("%") >= 0) {
        var nested_1 = buildFormatter(rules, format.replace("%", ""));
        return function (val) {
            return nested_1(val * 100) + "%";
        };
    }
    var decOpt = false;
    if (format.indexOf("[.]") >= 0) {
        format = format.replace("[.]", ".");
        decOpt = true;
    }
    var negPar = false;
    if (/\(.+\)/.test(format)) {
        negPar = true;
    }
    var hasThousands = false;
    if (format.indexOf(",") >= 0) {
        hasThousands = true;
    }
    var maxDec = 0;
    var minDec = 0;
    var pos = format.indexOf(".");
    if (pos >= 0) {
        var inOpt = false;
        while (++pos < format.length) {
            var ch = format.charCodeAt(pos);
            if (ch == 48) {
                maxDec++;
                if (!inOpt)
                    minDec++;
            }
            else if (ch == 91) {
                inOpt = true;
            }
            else
                break;
        }
    }
    if (decOpt && minDec < 2) {
        decOpt = false;
        minDec = 0;
    }
    var g = new RuntimeFunctionGenerator_1.RuntimeFunctionGenerator();
    var arg = g.addArg(0);
    var loc = g.addLocal();
    var locBefore = g.addLocal();
    var locDec = g.addLocal();
    var locIsNeg = g.addLocal();
    g.addBody("var " + locIsNeg + "=false;if (" + arg + "<0) {" + locIsNeg + "=true; " + arg + "=-" + arg + ";};");
    g.addBody("var " + locBefore + "," + locDec + "=''," + loc + "=" + arg + ".toFixed(" + maxDec + ");");
    if (maxDec == 0) {
        g.addBody(locBefore + "=" + loc + ";");
    }
    else {
        g.addBody(locBefore + "=" + loc + ".substr(0," + loc + ".length-" + (maxDec + 1) + ");");
        g.addBody(locDec + "=" + loc + ".substr(" + loc + ".length-" + maxDec + ");");
        if (minDec < maxDec) {
            g.addBody(locDec + "=" + locDec + ".replace(/0{1," + (maxDec - minDec) + "}$/,'');");
        }
        if (decOpt) {
            g.addBody("if (" + locDec + "=='" + Array(minDec + 1).join('0') + "') " + locDec + "='';");
        }
        g.addBody("if (" + locDec + "!='') " + locDec + "='" + rules.dd + "'+" + locDec + ";");
    }
    if (hasThousands) {
        g.addBody(locBefore + "=" + locBefore + ".replace(/(\\d)(?=(\\d{3})+(?!\\d))/g,'$1" + rules.td + "');");
    }
    g.addBody(loc + "=" + locBefore + "+" + locDec + ";");
    if (negPar) {
        g.addBody("if (" + locIsNeg + ") " + loc + "='('+" + loc + "+')';");
    }
    else {
        g.addBody("if (" + locIsNeg + ") " + loc + "='-'+" + loc + ";");
    }
    g.addBody("return " + loc + ";");
    return g.build();
}
exports.buildFormatter = buildFormatter;
function buildUnformat(rules) {
    var tdMatcher = new RegExp(escapeRegExp(rules.td), "g");
    var dd = rules.dd;
    return function (val) {
        var coef = 1;
        var perctI = val.indexOf("%");
        if (perctI >= 0) {
            val = val.replace("%", "");
            coef = 0.01;
        }
        var openParI = val.indexOf("(");
        if (openParI >= 0) {
            var closeParI = val.indexOf(")");
            if (closeParI > openParI) {
                coef = -coef;
                val = val.substring(openParI + 1, closeParI);
            }
        }
        return parseFloat(val.replace(tdMatcher, "").replace(dd, ".")) * coef;
    };
}
exports.buildUnformat = buildUnformat;
