CHANGELOG
===

3.2.1
--

Fixes bug with unformating number in locales with . as thousands separator 

3.2.0
--

Reintroduce number format "0 b", but with nonbreakable space in output which makes more sence.

3.1.0
--

Added feature to turn on/off preview of translated texts. When turned on, texts that are translated will be encapsulated by user function.
To enable it run this in console:

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


3.0.0
--

Breaking change needs bobril-build 0.57+.

Removed dependency on numeral, make code shorter, but also faster. It has slightly less features, so if you missing some please add failing test.

2.3.0
--

Upgraded numeral version to 2.0.4
-

2.2.0
--

Fixes 
-

Compilation errors with TS 2.1.4. `setLocale` returns `Promise<void>` instead of `Promise<any>`

2.1.3
--

Fixes
-

Fixed tests. Now testable by Bobril-build.

2.1.2
--

Fixes
-

Fixed problem with en-gb date format treated as en only. The formated date for en-gb locale should now be DD/MM/YYYY

2.1.1
--

Fixes
-

Additional improvements for TS 2.0
 
2.1.0
--

New features
-

Compilable by TS 2.0 with most strict settings.

2.0.0
--

Breaking changes
-

Requires Bobril 4.44.0 or higher, but does not depend on it in package.json. Bobril needs to be required sooner than bobril-g11n.
When setLocale fails it will revoke returned promise. Additionaly it will try to revert to default locale before.

1.4.0
--

New features
-

Check plural and selectordinal selectors to be only in allowed list.

1.3.0
--

New features
-

Added 2 additional parameters to getMoment function.

1.2.0
--

Changed behaviour
-

Missing translation file just logs to console instead of crashing.
