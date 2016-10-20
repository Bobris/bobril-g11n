CHANGELOG
===

2.1.3

Fixes
--

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
