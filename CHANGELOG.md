# CHANGELOG

## 5.0.3

Fix bug which forced whole Bobril to be included.

## 5.0.2

Make it compatible with noUncheckedIndexedAccess.

## 5.0.1

Fixed jsonp return type to be compatible with TS 4.1.x

## 5.0.0

Needs TypeScript 3.7+, directly depends on Bobril. Support formatting of elements of virtual dom.

```tsx
f("Hello {1}{world}{/1}", { 1: (p: b.IBobrilChildren) => <b>{p}</b>, world: "World" });
f("Simple {1/}", { 1: () => <App /> });

// Next thing also needs support in bobril-build
<T hint="translation hint" param1={42}>
    Answer is <strong>{t("{param1}")}</strong>!
</T>;
```

## 4.4.1

Fix regression with number/boolean parameters.

## 4.4.0

DelayedMessages and SerializedMessages are now more useful. They are automatically expanded in any message parameters during formatting. Function `f` was expanded to support formatting of DelayedMessages and SerializedMessages. `serializeMessage` now does recursive serialization including parameters.

```js
console.log(f(dt("Blabla {aparam}", { aparam: dt("hello") })));

let sendToServer = serializeMessage(dt(""));
console.log(f(receivedFromServerFromDifferentVersion));
```

`formatSerializedMessage` and `formatDelayedMessage` are obsolete and should be replaced by `f`.

Note: Needs to be used with Bobril 8.16.0 which polyfills `String.endsWith`

## 4.3.1

Made compatible with TypeScript 3.1.1

## 4.3.0

New feature of DelayedMessages and SerializedMessages. Allows transferring messages between different applications. Allows to run without Bobril and customize running scripts from url to be able to run on without browser.

## 4.2.0

New feature relativepast how to format relative time. It is same as relative just it never display future time.

## 4.1.0

Compare locale in case insensitive way.

## 4.0.0

Global moment has set current locale. So you are free to use it, but even better is just use
getMoment.

## 3.3.4

Simplified typings and Moment import.

## 3.3.2

Remove empty files from tsconfig.json

## 3.3.1

Remove nonsense JSX from tsconfig.json

## 3.3.0

Improved upon previous fix by using and exporting useful escapeRegExp function.

## 3.2.1

Fixes bug with unformating number in locales with . as thousands separator

## 3.2.0

Reintroduce number format "0 b", but with nonbreakable space in output which makes more sence.

## 3.1.0

Added feature to turn on/off preview of translated texts. When turned on, texts that are translated
will be encapsulated by user function. To enable it run this in console:

```
    b.spyTr(function(t){return "["+t+"]"});
```

To disable it run this in console:

```
    b.spyTr(null);
```

To check if enabled run this in console:

```
    b.spyTr()!==undefined
```

## 3.0.0

Breaking change needs bobril-build 0.57+.

Removed dependency on numeral, make code shorter, but also faster. It has slightly less features, so
if you missing some please add failing test.

## 2.3.0

## Upgraded numeral version to 2.0.4

## 2.2.0

## Fixes

Compilation errors with TS 2.1.4. `setLocale` returns `Promise<void>` instead of `Promise<any>`

## 2.1.3

## Fixes

Fixed tests. Now testable by Bobril-build.

## 2.1.2

## Fixes

Fixed problem with en-gb date format treated as en only. The formated date for en-gb locale should
now be DD/MM/YYYY

## 2.1.1

## Fixes

Additional improvements for TS 2.0

## 2.1.0

## New features

Compilable by TS 2.0 with most strict settings.

## 2.0.0

## Breaking changes

Requires Bobril 4.44.0 or higher, but does not depend on it in package.json. Bobril needs to be
required sooner than bobril-g11n. When setLocale fails it will revoke returned promise. Additionally
it will try to revert to default locale before.

## 1.4.0

## New features

Check plural and selectordinal selectors to be only in allowed list.

## 1.3.0

## New features

Added 2 additional parameters to getMoment function.

## 1.2.0

## Changed behavior

Missing translation file just logs to console instead of crashing.
