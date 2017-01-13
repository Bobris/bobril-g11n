"use strict";
if (!Object.assign) {
    Object.assign = function assign(target) {
        var _sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _sources[_i - 1] = arguments[_i];
        }
        var totalArgs = arguments.length;
        for (var i = 1; i < totalArgs; i++) {
            var source = arguments[i];
            if (source == null)
                continue;
            var keys = Object.keys(source);
            var totalKeys = keys.length;
            for (var j = 0; j < totalKeys; j++) {
                var key = keys[j];
                target[key] = source[key];
            }
        }
        return target;
    };
}
var numeral = require('numeral');
var moment = require('moment');
var msgFormatParser = require("../src/msgFormatParser");
var msgFormatter = require("../src/msgFormatter");
describe('modules', function () {
    it('numeral works', function () {
        expect(numeral(0).format()).toBe('0');
    });
    it('moment works', function () {
        expect(moment(new Date(2000, 0, 1)).format('LTS')).toBe('12:00:00 AM');
    });
});
describe('Formatter', function () {
    function check(msg, params, result, locale) {
        if (locale === void 0) { locale = 'en-US'; }
        var ast = msgFormatParser.parse(msg);
        var fn = msgFormatter.compile(locale, ast);
        expect(fn(params)).toBe(result);
    }
    it('basic compile', function () {
        check('Hello {a}!', { a: 'World' }, 'Hello World!');
    });
    it('ordinal', function () {
        check('{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor', { floor: 0 }, 'ground floor');
        check('{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor', { floor: 3 }, '3rd floor');
        check('{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor', { floor: 1000 }, '1000th floor');
    });
    it('plural', function () {
        check('{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}', { numPhotos: 0 }, 'no photos');
        check('{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}', { numPhotos: 1 }, 'one photo');
        check('{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}', { numPhotos: 2 }, '2 photos');
    });
    it('select', function () {
        check('{gender, select, female {woman} male {man} other {person}}', { gender: 'female' }, 'woman');
        check('{gender, select, female {woman} male {man} other {person}}', { gender: 'male' }, 'man');
        check('{gender, select, female {woman} male {man} other {person}}', { gender: 'unknown' }, 'person');
    });
    it('number', function () {
        check('{arg, number}', { arg: 0 }, '0');
        check('{arg, number}', { arg: 1000 }, '1,000');
        check('{arg, number}', { arg: 1.234 }, '1.234');
        check('{arg, number, percent}', { arg: 0.23 }, '23%');
        check('{arg, number, custom, format:{0,0.0}}', { arg: 123456.78 }, '123,456.8');
        check('{arg, number, custom, format:{0,0.0[00]}}', { arg: 123456.78 }, '123,456.78');
        check('{arg, number, custom, format:{0,0.0[00]}}', { arg: 12 }, '12.0');
        check('{arg, number, custom, format:{0,0.0[00]}}', { arg: 12.1111 }, '12.111');
        check('{arg, number, custom, format:{0.0}}', { arg: 123456.78 }, '123456.8');
        check('{arg, number, custom, format:{0}}', { arg: 123456.78 }, '123457');
        check('{arg, number, custom, format:{-0}}', { arg: -1 }, '-1');
        check('{arg, number, custom, format:{(0)}}', { arg: -1 }, '(1)');
        check('{arg, number, custom, format:{0%}}', { arg: 0.5 }, '50%');
        check('{arg, number, bytes}', { arg: 1000 }, '1KB');
        check('{arg, number, bytes}', { arg: 999 }, '999B');
        check('{arg, number, bytes}', { arg: 1001 }, '1KB');
        check('{arg, number, bytes}', { arg: 999999 }, '1000KB');
        check('{arg, number, bytes}', { arg: 1000000 }, '1MB');
        check('{arg, number, custom, format:{0b}}', { arg: 1 }, '1B');
    });
    it('date', function () {
        check('{a, date, dddd}', { a: new Date(2000, 0, 2) }, 'Sunday');
        check('{a, date, lll}', { a: new Date(2000, 0, 2) }, 'Jan 2, 2000 12:00 AM');
        check('{a, date, LLLL}', { a: new Date(2000, 0, 2) }, 'Sunday, January 2, 2000 12:00 AM');
        check('{a, date, custom, format:{DD MM}}', { a: new Date(2000, 0, 2) }, '02 01');
        check('{a, date, custom, format:{{myformat}} }', { a: new Date(2000, 0, 2), myformat: 'ddd' }, 'Sun');
    });
    it('calendar', function () {
        check('{a, date, calendar}', { a: moment(Date.now()).add(1, 'd').hour(10).minute(30).second(0) }, 'Tomorrow at 10:30 AM');
    });
    it('relative', function () {
        check('{a, time, relative}', { a: Date.now() - 1000 }, 'a few seconds ago');
        check('{a, time, relative}', { a: Date.now() - 100000 }, '2 minutes ago');
        check('{a, time, relative}', { a: Date.now() + 10000000 }, 'in 3 hours');
        check('{a, time, relative, noago}', { a: Date.now() + 100000 }, '2 minutes');
    });
});
