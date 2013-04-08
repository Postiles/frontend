goog.provide('postile.dom');

goog.require('goog.dom.classes');

postile.dom.getDescendantByCondition = function(element, judge) {
    var cldn = element.children;
    var tried;
    for(var i in cldn) {
        if (judge(cldn[i])) {
            return cldn[i];
        } else {
            tried = postile.dom.getDescendantByCondition(cldn[i], judge);
            if (tried) { return tried; }
        }
    }
    return null;
}

postile.dom.getDescendantsByCondition = function(element, judge, to_return) {
    var cldn = element.children;
    if (!to_return) { to_return = new Array(); }
    for(var i in cldn) {
        if (judge(cldn[i])) {
            to_return.push(cldn[i]);
        } else {
            postile.dom.getDescendantsByCondition(cldn[i], judge, to_return);
        }
    }
    return to_return;
}

/**
 * Find the first node in element that has className in its classes,
 * or null if not found.
 * @return {Element}
 */
postile.dom.getDescendantByClass = function(element, className) {
    return postile.dom.getDescendantByCondition(element, function(el) {
        return goog.dom.classes.has(el, className);
    });
}

/**
 * Find the all nodes in element that has className in its classes,
 * or null if not found.
 * @return {Array<Element>}
 */
postile.dom.getDescendantsByClass = function(element, className) {
    return postile.dom.getDescendantsByCondition(element, function(el) {
        return goog.dom.classes.has(el, className);
    });
}

/**
 * Find the element that has the given id, or null if not found.
 * @return {Element}
 */
postile.dom.getDescendantById = function(element, id) {
    return this.getDescendantByCondition(element, function(el) { return el.id == id; });
}

