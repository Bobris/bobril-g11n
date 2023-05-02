import * as moment from "moment";
import * as msgFormatParser from "../src/msgFormatParser";
import * as msgFormatter from "../src/msgFormatter";

describe("modules", () => {
    it("moment works", () => {
        expect(moment(new Date(2000, 0, 1)).format("LTS")).toBe("12:00:00 AM");
    });
});

[false, true].forEach((interpret) => {
    describe("Formatter " + (interpret ? "interpret" : "compile"), () => {
        function check(msg: string, params: Object, result: any, locale: string = "en-US") {
            let ast = msgFormatParser.parse(msg);
            let fn = msgFormatter.compile(locale, ast, interpret);
            expect(fn(params)).toEqual(result);
        }

        it("basic compile", () => {
            check("Hello {a}!", { a: "World" }, "Hello World!");
        });

        it("ordinal", () => {
            check(
                "{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor",
                { floor: 0 },
                "ground floor"
            );
            check(
                "{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor",
                { floor: 3 },
                "3rd floor"
            );
            check(
                "{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor",
                { floor: 1000 },
                "1000th floor"
            );
        });

        it("plural", () => {
            check("{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}", { numPhotos: 0 }, "no photos");
            check("{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}", { numPhotos: 1 }, "one photo");
            check("{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}", { numPhotos: 2 }, "2 photos");
        });

        it("select", () => {
            check("{gender, select, female {woman} male {man} other {person}}", { gender: "female" }, "woman");
            check("{gender, select, female {woman} male {man} other {person}}", { gender: "male" }, "man");
            check("{gender, select, female {woman} male {man} other {person}}", { gender: "unknown" }, "person");
        });

        it("number", () => {
            check("{arg, number}", { arg: 0 }, "0");
            check("{arg, number}", { arg: 1000 }, "1,000");
            check("{arg, number}", { arg: 1.234 }, "1.234");
            check("{arg, number, percent}", { arg: 0.23 }, "23%");
            check("{arg, number, custom, format:{0,0.0}}", { arg: 123456.78 }, "123,456.8");
            check("{arg, number, custom, format:{0,0.0[00]}}", { arg: 123456.78 }, "123,456.78");
            check("{arg, number, custom, format:{0,0.0[00]}}", { arg: 12 }, "12.0");
            check("{arg, number, custom, format:{0,0.0[00]}}", { arg: 12.1111 }, "12.111");
            check("{arg, number, custom, format:{0.0}}", { arg: 123456.78 }, "123456.8");
            check("{arg, number, custom, format:{0}}", { arg: 123456.78 }, "123457");
            check("{arg, number, custom, format:{-0}}", { arg: -1 }, "-1");
            check("{arg, number, custom, format:{(0)}}", { arg: -1 }, "(1)");
            check("{arg, number, custom, format:{0%}}", { arg: 0.5 }, "50%");
            check("{arg, number, bytes}", { arg: 1000 }, "1KB");
            check("{arg, number, bytes}", { arg: 999 }, "999B");
            check("{arg, number, bytes}", { arg: 1001 }, "1KB");
            check("{arg, number, bytes}", { arg: 999999 }, "1000KB");
            check("{arg, number, bytes}", { arg: 1000000 }, "1MB");
            check("{arg, number, custom, format:{0b}}", { arg: 1 }, "1B");
            check("{arg, number, custom, format:{0 b}}", { arg: 1 }, "1\xA0B");
        });

        it("date", () => {
            check("{a, date, dddd}", { a: new Date(2000, 0, 2) }, "Sunday");
            check("{a, date, lll}", { a: new Date(2000, 0, 2) }, "Jan 2, 2000 12:00 AM");
            check("{a, date, LLLL}", { a: new Date(2000, 0, 2) }, "Sunday, January 2, 2000 12:00 AM");
            check("{a, date, custom, format:{DD MM}}", { a: new Date(2000, 0, 2) }, "02 01");
            check("{a, date, custom, format:{{myformat}} }", { a: new Date(2000, 0, 2), myformat: "ddd" }, "Sun");
        });

        it("calendar", () => {
            check(
                "{a, date, calendar}",
                {
                    a: moment(Date.now()).add(1, "d").hour(10).minute(30).second(0),
                },
                "Tomorrow at 10:30 AM"
            );
        });

        it("relative", () => {
            check("{a, time, relative}", { a: Date.now() - 1000 }, "a few seconds ago");
            check("{a, time, relative}", { a: Date.now() - 100000 }, "2 minutes ago");
            check("{a, time, relative}", { a: Date.now() + 10000000 }, "in 3 hours");
            check("{a, time, relative, noago}", { a: Date.now() + 100000 }, "2 minutes");
        });

        it("relativepast", () => {
            check("{a, time, relativepast}", { a: Date.now() - 1000 }, "a few seconds ago");
            check("{a, time, relativepast}", { a: Date.now() - 100000 }, "2 minutes ago");
            check("{a, time, relativepast}", { a: Date.now() + 10000000 }, "a few seconds ago");
            check("{a, time, relativepast, noago}", { a: Date.now() + 100000 }, "a few seconds");
        });

        it("element", () => {
            check("{1/}", { 1: () => ({}) }, {});
            check("a{1}{b}{/1}c", { 1: (p: any) => ({ tag: "b", children: p }), b: "bold" }, [
                "a",
                { tag: "b", children: "bold" },
                "c",
            ]);
        });
    });
});
