goog.provide('postile.string');

postile.string.empty_regexp = /^\s*$/;

/*
see if a string contains only blanks
*/
postile.string.empty = function(input) {
    return postile.string.empty_regexp.test(input);
}

postile.string.stripString = function(input) {
    return goog.string.trim(input.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, ''));
}

postile.escapeString = function(input) {
    return goog.string.whitespaceEscape(goog.string.htmlEscape(input + ''));
}