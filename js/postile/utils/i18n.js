goog.provide('postile.i18n');

goog.require('goog.locale');
goog.require('postile.locale');

postile._ = function(text) {
    return postile.locale[goog.locale.getLocale()][text] || postile.locale['en'][text];
}