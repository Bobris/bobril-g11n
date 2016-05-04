"use strict";
var msgFormatParser = require("../src/msgFormatParser");
var extractUsedParams = require("../src/extractUsedParams");
describe('Params Extractor', function () {
    function check(msg, result) {
        var ast = msgFormatParser.parse(msg);
        var params = extractUsedParams.extractUsedParams(ast);
        expect(params).toEqual(result);
    }
    it('all extract', function () {
        check('', []);
        check('Hello {a}!', ['a']);
        check('Hello {a} and {b}!', ['a', 'b']);
        check('Hello {b} and {a}!', ['a', 'b']);
        check('{arg, number}', ['arg']);
        check('{arg, time, relative}', ['arg']);
        check('{arg, date, custom, format: {D*M*Y} }', ['arg']);
        check('{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor', ['floor']);
        check("{gender_of_host, select,\n                female {{\n            \t    num_guests, plural, offset:1\n                    =0 {{host} does not give a party.}\n                    =1 {{host} invites {guest} to her party.}\n                    =2 {{host} invites {guest} and one other person to her party.}\n                    other {{host} invites {guest} and # other people to her party.}\n            \t}}\n                male {{\n            \t    num_guests, plural, offset:1\n                    =0 {{host} does not give a party.}\n                    =1 {{host} invites {guest} to his party.}\n                    =2 {{host} invites {guest} and one other person to his party.}\n                    other {{host} invites {guest} and # other people to his party.}\n                }}\n                other {{\n            \t    num_guests, plural, offset:1\n                    =0 {{host} does not give a party.}\n                    =1 {{host} invites {guest} to their party.}\n                    =2 {{host} invites {guest} and one other person to their party.}\n                    other {{host} invites {guest} and # other people to their party.}\n            \t}}\n            }", ['gender_of_host', 'guest', 'host', 'num_guests']);
    });
});
