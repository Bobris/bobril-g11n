"use strict";
var msgFormatParser = require("../src/msgFormatParser");
describe('Parser', function () {
    function check(msg, result) {
        var ast = msgFormatParser.parse(msg);
        expect(ast).toEqual(result);
    }
    it('all parse', function () {
        check('', '');
        check('Escape \\\\ \\# \\u0041 \\{ \\}', 'Escape \\ # \u0041 { }');
        check('Hello {a}!', ['Hello ', { type: 'arg', id: 'a' }, '!']);
        check('{arg, number}', { type: 'format', id: 'arg', format: { type: 'number', style: null, options: null } });
        check('{arg, time, relative}', { type: 'format', id: 'arg', format: { type: 'time', style: 'relative', options: [] } });
        check('{arg, date, custom, format: {D*M*Y} }', { type: 'format', id: 'arg', format: { type: 'date', style: 'custom', options: [{ key: 'format', value: 'D*M*Y' }] } });
        check('{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor', [{
                type: 'format', id: 'floor', format: {
                    type: 'plural', ordinal: true, offset: 0, options: [
                        { selector: 0, value: 'ground' },
                        { selector: 'one', value: [{ type: 'hash' }, 'st'] },
                        { selector: 'two', value: [{ type: 'hash' }, 'nd'] },
                        { selector: 'few', value: [{ type: 'hash' }, 'rd'] },
                        { selector: 'other', value: [{ type: 'hash' }, 'th'] }
                    ]
                }
            }, ' floor']);
        check("{gender_of_host, select,\n                female {{\n            \t    num_guests, plural, offset:1\n                    =0 {{host} does not give a party.}\n                    =1 {{host} invites {guest} to her party.}\n                    =2 {{host} invites {guest} and one other person to her party.}\n                    other {{host} invites {guest} and # other people to her party.}\n            \t}}\n                male {{\n            \t    num_guests, plural, offset:1\n                    =0 {{host} does not give a party.}\n                    =1 {{host} invites {guest} to his party.}\n                    =2 {{host} invites {guest} and one other person to his party.}\n                    other {{host} invites {guest} and # other people to his party.}\n                }}\n                other {{\n            \t    num_guests, plural, offset:1\n                    =0 {{host} does not give a party.}\n                    =1 {{host} invites {guest} to their party.}\n                    =2 {{host} invites {guest} and one other person to their party.}\n                    other {{host} invites {guest} and # other people to their party.}\n            \t}}\n            }", {
            type: 'format', id: 'gender_of_host', format: {
                type: 'select', options: [
                    {
                        selector: 'female', value: {
                            type: 'format', id: 'num_guests', format: {
                                type: 'plural', ordinal: false, offset: 1, options: [
                                    { selector: 0, value: [{ type: 'arg', id: 'host' }, ' does not give a party.'] },
                                    { selector: 1, value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' to her party.'] },
                                    { selector: 2, value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' and one other person to her party.'] },
                                    { selector: 'other', value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' and ', { type: 'hash' }, ' other people to her party.'] }
                                ]
                            }
                        }
                    }, {
                        selector: 'male', value: {
                            type: 'format', id: 'num_guests', format: {
                                type: 'plural', ordinal: false, offset: 1, options: [
                                    { selector: 0, value: [{ type: 'arg', id: 'host' }, ' does not give a party.'] },
                                    { selector: 1, value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' to his party.'] },
                                    { selector: 2, value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' and one other person to his party.'] },
                                    { selector: 'other', value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' and ', { type: 'hash' }, ' other people to his party.'] }
                                ]
                            }
                        }
                    }, {
                        selector: 'other', value: {
                            type: 'format', id: 'num_guests', format: {
                                type: 'plural', ordinal: false, offset: 1, options: [
                                    { selector: 0, value: [{ type: 'arg', id: 'host' }, ' does not give a party.'] },
                                    { selector: 1, value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' to their party.'] },
                                    { selector: 2, value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' and one other person to their party.'] },
                                    { selector: 'other', value: [{ type: 'arg', id: 'host' }, ' invites ', { type: 'arg', id: 'guest' }, ' and ', { type: 'hash' }, ' other people to their party.'] }
                                ]
                            }
                        }
                    }
                ]
            }
        });
    });
    function error(msg) {
        var ast = msgFormatParser.parse(msg);
        expect(typeof ast).toEqual("object");
        expect(ast.type).toEqual("error");
    }
    it('catch all errors', function () {
        error('{');
        error('{a');
        error('{a, invalid}');
        error('{floor, selectordinal, =0{ground} one{#st} bad{#nd} few{#rd} other{#th}}');
    });
});
