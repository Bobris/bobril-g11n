import * as msgFormatParser from "../src/msgFormatParser";
import * as extractUsedParams from "../src/extractUsedParams";

describe('Params Extractor', () => {
    function check(msg: string, result: any) {
        let ast = msgFormatParser.parse(msg);
        let params = extractUsedParams.extractUsedParams(ast);
        expect(params).toEqual(result);
    }

    it('all extract', () => {
        check('', []);
        check('Hello {a}!', ['a']);
        check('Hello {a} and {b}!', ['a', 'b']);
        check('Hello {b} and {a}!', ['a', 'b']);
        check('{arg, number}', ['arg']);
        check('{arg, time, relative}', ['arg']);
        check('{arg, date, custom, format: {D*M*Y} }', ['arg']);
        check('{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor', ['floor']);
        check(`{gender_of_host, select,
                female {{
            	    num_guests, plural, offset:1
                    =0 {{host} does not give a party.}
                    =1 {{host} invites {guest} to her party.}
                    =2 {{host} invites {guest} and one other person to her party.}
                    other {{host} invites {guest} and # other people to her party.}
            	}}
                male {{
            	    num_guests, plural, offset:1
                    =0 {{host} does not give a party.}
                    =1 {{host} invites {guest} to his party.}
                    =2 {{host} invites {guest} and one other person to his party.}
                    other {{host} invites {guest} and # other people to his party.}
                }}
                other {{
            	    num_guests, plural, offset:1
                    =0 {{host} does not give a party.}
                    =1 {{host} invites {guest} to their party.}
                    =2 {{host} invites {guest} and one other person to their party.}
                    other {{host} invites {guest} and # other people to their party.}
            	}}
            }`, ['gender_of_host', 'guest', 'host', 'num_guests']);
    });
});
