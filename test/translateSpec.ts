import "bobril"; 
import * as translate from "../src/translate";

describe('translate', () => {
    it('unformat works', () => {
        expect(translate.unformatNumber("-1,234.56")).toBe(-1234.56);
    });
});
