goog.provide('postile.debbcode');

goog.require('goog.string');

postile.parseBBcode = function(input) {
    input = goog.string.htmlEscape(input + '');
    input = input.replace(/\[(\/?(b|i|u))\]/g, "<$1>");
    input = input.replace(/\[url\]/g, "<span class=\"external_link\">");
    input = input.replace(/\[link\](\d+)\[\/link\]/g, "<span class=\"internal_link\" link-target=\"$1\">");
    input = input.replace(/\[at\](\d+)\[\/at\]/g, "<span class=\"at_person\" at-person=\"$1\">");
    input = input.replace(/\[color=#([0-9a-f]{3})\]/g, "<span style=\"color: #$1;\">");
    input = input.replace(/\[\/(url|color)\]/g, "</span>");
    return goog.string.whitespaceEscape(input);
}