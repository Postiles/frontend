goog.provide('postile.string');

postile.string.empty_regexp = /^\s*$/;

/*
see if a string contains only blanks
*/
postile.string.empty = function(input) {
    return postile.string.empty_regexp.test(input);
}