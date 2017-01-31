import 'bobril'; // For Promise polyfill
import * as translate from "../src/translate";

describe('translate', () => {
    it('unformat works', () => {
        expect(translate.unformatNumber("-1,234.56")).toBe(-1234.56);
        expect(translate.unformatNumber("50%")).toBe(0.5);
        expect(translate.unformatNumber("(10%)")).toBe(-0.1);
    });

    describe('translations preview', () => {
        it('is not enabled by default', () => {
            expect(translate.getTranslationPreview()).toBeFalsy();
        });

        it('if enabled should encapsulate text with brackets', () => {
            translate.setTranslationPreview(true);
            expect(translate.t("text to translate")).toBe("[text to translate]");
        });

        it('if disabled should leave the text as is', () => {
            translate.setTranslationPreview(false);
            expect(translate.t("text to translate")).toBe("text to translate");
        });
    });
});
