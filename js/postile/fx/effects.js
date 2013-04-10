goog.provide('postile.fx.effects');

goog.require('postile.conf.useragent');
goog.require('postile.fx');

postile.fx.effects.resizeIn = function(dom) {
    dom.style.opcaity = 0;
    dom.style.display = 'block';
    return new postile.fx.Animate(function(i) {
        postile.conf.useragent.setCss(dom, 'transform', 'scale('+(1.25-0.25*i)+','+(1.25-0.25*i)+')');
        dom.style.opacity = i;
    }, 400, {
        ease: postile.fx.ease.cubic_ease_out,
        callback: function() {
            postile.conf.useragent.setCss(dom, 'transform', 'none');
        }
    });
};

postile.fx.effects.verticalExpand = function(dom) { // TODO: to be improved //? : is this still used now? maight be obliterated
    var th = dom.clientHeight;
    return new postile.fx.Animate(function(i) {
        dom.style.height = i*th + 'px';
    }, 500, {
        ease: postile.fx.ease.cubic_ease_out
    });
};

postile.fx.effects.flowDown = function(dom) {
    var th = dom.clientHeight;
    return new postile.fx.Animate(function(i) {
        postile.conf.useragent.setCss(dom, 'transform', 'translateY(-' + (1-i)*th + 'px)');
    }, 500, {
        ease: postile.fx.ease.cubic_ease_out
    });
}