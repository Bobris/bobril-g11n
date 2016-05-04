"use strict";
var translate = require("../src/translate");
describe('translate', function () {
    it('unformat works', function () {
        expect(translate.unformatNumber("-1,234.56")).toBe(-1234.56);
    });
});
