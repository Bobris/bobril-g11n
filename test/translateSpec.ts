import "bobril"; // For Promise, endsWith polyfill and b in window
import * as translate from "../src/translate";
import * as numberFormatter from "../src/numberFormatter";

describe("numberFormatter", () => {
    it("unformat works with . as thousands separator", () => {
        let rules = {
            pluralFn() {
                return "";
            }, //stub
            td: ".",
            dd: ","
        };
        expect(numberFormatter.buildUnformat(rules)("-1.234,56")).toBe(-1234.56);
    });
});

describe("translate", () => {
    it("unformat works", () => {
        expect(translate.unformatNumber("-1,234.56")).toBe(-1234.56);
        expect(translate.unformatNumber("50%")).toBe(0.5);
        expect(translate.unformatNumber("(10%)")).toBe(-0.1);
    });

    describe("translations preview", () => {
        it("if enabled should encapsulate text with brackets", () => {
            expect(translate.spyTranslation()).toBeUndefined();
            translate.spyTranslation(t => `[${t}]`);
            expect(translate.t("text to translate")).toBe("[text to translate]");
        });

        it("if disabled should leave the text as is", () => {
            translate.spyTranslation(null);
            expect(translate.t("text to translate")).toBe("text to translate");
        });
    });
});
