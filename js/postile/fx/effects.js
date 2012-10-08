goog.provide('postile.fx.effects');

goog.require('postile.fx');
goog.require('postile.browser_compat');

postile.fx.effects.resizeIn = function(dom) {
    postile.fx.animate(function(i){
        postile.browser_compat.setCss(dom, 'transform', 'scale('+(1.25-0.25*i)+','+(1.25-0.25*i)+')', postile.fx.ease.cubic_ease_out);
        dom.style.opacity = i;
    }, 400);
};
