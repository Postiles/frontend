goog.provide('postile.debbcode');

goog.require('goog.string');
goog.require('postile.dom');

postile.parseBBcode = function(input) {
    input = goog.string.htmlEscape(input + '');
    input = input.replace(/\[(\/?(b|i|u))\]/g, "<$1>");
    input = input.replace(/\[url\]/g, "<span class=\"external_link\">");
    input = input.replace(/\[link\](\d+)\[\/link\]/g, "<img class=\"internal_link\" link-to-post-id=\"$1\" />");
    input = input.replace(/\[at\](\d+)\[\/at\]/g, "<span class=\"at_person\" at-user=\"$1\"></span>");
    input = input.replace(/\[color=#([0-9a-f]{3})\]/g, "<span style=\"color: #$1;\">");
    input = input.replace(/\[\/(url|color)\]/g, "</span>");
    return goog.string.whitespaceEscape(input);
}

postile.bbcodePostProcess = function(el) {
    var handleOneAtPerson = function(sel) { 
        postile.data_manager.getUserData(sel.getAttribute("at-user"), function(uData) {
            sel.innerHTML = '@' + uData.username;
        });
        sel.contentEditable = false;
    }
    var handleOneInternalLink = function(el) {
        el.src = postile.conf.imageResource(['link_icon.png']);
        goog.events.listen(el, goog.events.EventType.MOUSEOVER, function() {
            alert("This is a link.");
        });
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