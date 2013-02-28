goog.provide('postile.i18n');

goog.require('goog.locale');
goog.require('postile.locale');

postile._ = function(text) {
    return postile.locale[goog.LOCALE][text] ? postile.locale[goog.LOCALE][text] : postile.locale['en'][text]; 
}