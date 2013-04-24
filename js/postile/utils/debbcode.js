goog.provide('postile.debbcode');

goog.require('goog.string');
goog.require('postile.dom');
goog.require("postile.view.post_board.InternalLink");

/**
 * BBCode handling.
 *
 * Usage:
 *
 * 1. var html = parseBBcode(rawContent)
 * 2. el.innerHTML = html
 * 3. bbcodePostProcess(el)
 */

postile.parseBBcode = function(input) {
    input = goog.string.htmlEscape(input + '');
    input = input.replace(/\[(\/?(b|i|u))\]/g, "<$1>");
    input = input.replace(/\[url\]/g, "<span class=\"external_link\">");
    input = input.replace(/\[link\](\d+)\[\/link\]/g, "<img class=\"internal_link\" link-to-post-id=\"$1\" />");
    input = input.replace(/\[at\](\d+)\[\/at\]/g, "<span class=\"at_person\" contentEditable=\"false\" at-user=\"$1\"></span>");
    input = input.replace(/\[color=#([0-9a-f]{3})\]/g, "<span style=\"color: #$1;\">");
    input = input.replace(/\[\/(url|color)\]/g, "</span>");
    return goog.string.whitespaceEscape(input);
}

postile.bbcodePostProcess = function(el, opt_no_mouseevent) {
    var handleOneAtPerson = function(sel) { 
        postile.data_manager.getUserData(sel.getAttribute("at-user"), function(uData) {
            sel.setAttribute('at-user-name', uData.username);
            sel.innerHTML = '@' + uData.username;
        });
        sel.style.cursor = "pointer";
        if (!opt_no_mouseevent) {
            var profile = new postile.view.profile.ProfileView(sel.getAttribute("at-user"));
            goog.events.listen(sel, goog.events.EventType.CLICK, function() {
                profile.open(710);
            });
        }
    }
    var handleOneInternalLink = function(sel) {
        sel.src = postile.conf.imageResource(['link_icon.png']);
        if (!opt_no_mouseevent) {
            var htv = new postile.view.post_board.InternalLink(sel.getAttribute("link-to-post-id"));
            goog.events.listen(sel, goog.events.EventType.MOUSEOVER, function() {
                htv.open(sel, el.parentNode);
            });
        }
    }
    var atps = postile.dom.getDescendantsByClass(el, "at_person");
    for (var i in atps) {
        handleOneAtPerson(atps[i]);
    }
    var atps = postile.dom.getDescendantsByClass(el, "internal_link");
    for (var i in atps) {
        handleOneInternalLink(atps[i]);
    }
}
