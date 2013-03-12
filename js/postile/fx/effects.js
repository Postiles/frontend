goog.provide('postile.fx.effects');

goog.require('postile.fx');
goog.require('postile.browser_compat');

postile.fx.effects.resizeIn = function(dom) {
    dom.style.opcaity = 0;
    dom.style.display = 'block';
    return new postile.fx.Animate(function(i){
        postile.browser_compat.setCss(dom, 'transform', 'scale('+(1.25-0.25*i)+','+(1.25-0.25*i)+')');
        dom.style.opacity = i;
    }, 400, postile.fx.ease.cubic_ease_out, function() { postile.browser_compat.setCss(dom, 'transform', 'none'); });
};

postile.fx.effects.verticalExpand = function(dom) { //TODO: to be improved
    var th = dom.clientHeight;
    return new postile.fx.Animate(function(i){
        postile.browser_compat.setCss(dom, 'height', i*th + 'px');
    }, 500, postile.fx.ease.cubic_ease_out);
}

postile.fx.effects.rotateOn = function(dom) {
    return new postile.fx.Animate(function(i){
        postile.browser_compat.setCss(dom, 'transform', 'rotate('+Math.floor(i*360)+'deg)');
    }, 800, null);
}