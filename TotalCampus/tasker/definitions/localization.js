// Localization — picks the language for each request.
//
// 📚 Frontend · Going multilingual — text wrapped in `@(...)` in a view is
//    translated server-side before the page is sent. `LOCALIZE` decides WHICH
//    language to use, per request:
//      1. the logged-in user's preference ($.user.language), else
//      2. an explicit ?language=xx in the URL, else
//      3. the app default (config: language), else English (the @() text itself).
//
// Translations live in /resources/{language}.resource — generate the template
// with the CLI:  `total5 translate`  (then translate the values).

LOCALIZE($ => ($.user ? $.user.language : '') || $.query.language || CONF.language || '');
