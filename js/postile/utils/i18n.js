goog.provide('postile.i18n');

goog.require('goog.locale');
goog.require('postile.locale.en');

postile._ = function(text) {
    return postile.locale[goog.locale.getLocale()].text[text] || postile.locale['en'].text[text];
}

postile.date = function(tz_time_string, formatting) {
    return postile.locale[goog.locale.getLocale()].date[formatting](new Date(Date.parse(tz_time_string))) || tz_time_string;
}