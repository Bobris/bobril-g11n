# bobril-g11n

Bobril Globalization extension

[![npm version](https://badge.fury.io/js/bobril-g11n.svg)](https://badge.fury.io/js/bobril-g11n)

Changelog: https://github.com/Bobris/Bobril-g11n/blob/master/CHANGELOG.md

install from npm:

	npm install bobril-g11n --save

It is expected to be used together with bobril-build to handle all code and translation generation.
Internally uses moment.js, numeral.js, CLDR. Inspired by formatjs.io.
Uses very similar message format. Though I was not satisfied with Intl polyfill.
Message parse for speed and size written in hand optimized code instead of Pegjs.

Usage in TypeScript:

	import * as b from 'bobril';
	import * as g from 'bobril-g11n';
	
	g.initGlobalization({
		pathToTranslation(locale:string):string { return 'tr/'+locale+'.js'; }
	});
	
	b.init(()=>{
		return { tag:'div', children: g.t('Hello {who}!', { who: 'World' }) };
	});

With bobril-build, you don't need to call `g.initGlobalization` at all. It will correctly set path to translation by defining global method `g11nPath`. Just make sure to not call `t` before bobril will call init factory.

With if you don't need translation to different language just format text with current locale use function `f` like this:

	let modified = Date.now() - 100000; // only sample in reality you would get this from server or whatever
	let displayThisInTableCell = g.f('{modified, time, relative}', { modified });

Function `getMoment()` will give you instance of moment library with locally set current locale.

Set different locale - it will asynchronously download translation file and automatically invalidate Bobril view including ignoring shouldChange results, so your bobflux implementation does not need to care about current locale change.

	g.setLocale('cs-CZ');

This is one of examples how to make really human readable messages:

	g.t('{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}', { numPhotos: 1 });
