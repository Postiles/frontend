goog.provide('postile.dom');

postile.dom.getDescendantByClass = function(element, className) {
    var cldn = element.children;
    var tried;
    for(var i in cldn) {
        if (cldn[i].className == className) { 
            return cldn[i];
        } else {
            tried = postile.dom.getDescendantByClass(className, cldn[i]);
            if (tried) { return tried; }
        }
    }
    return null;
}