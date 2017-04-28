"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("bobril"); // For Promise polyfill and b in window
var translate = require("../src/translate");
var numberFormatter = require("../src/numberFormatter");
describe('numberFormatter', function () {
    it('unformat works with . as thousands separator', function () {
        var rules = {
            pluralFn: function () { return ""; },
            td: ".",
            dd: ","
        };
        expect(numberFormatter.buildUnformat(rules)("-1.234,56")).toBe(-1234.56);
    });
});
describe('translate', function () {
    it('unformat works', function () {
        expect(translate.unformatNumber("-1,234.56")).toBe(-1234.56);
        expect(translate.unformatNumber("50%")).toBe(0.5);
        expect(translate.unformatNumber("(10%)")).toBe(-0.1);
    });
    describe('translations preview', function () {
        it('is not enabled by default', function () {
            expect(translate.spyTranslation()).toBeUndefined();
        });
        it('if enabled should encapsulate text with brackets', function () {
            translate.spyTranslation(function (t) { return "[" + t + "]"; });
            expect(translate.t("text to translate")).toBe("[text to translate]");
        });
        it('if disabled should leave the text as is', function () {
            translate.spyTranslation(null);
            expect(translate.t("text to translate")).toBe("text to translate");
        });
    });
});
