goog.provide('postile.view.Share');

postile.view.Share = function(url, title) {
    postile.view.PopView.call(this);
    postile.ui.load(this.container, postile.conf.staticResource(['share.html']));
    goog.dom.classes.add(this.container, 'share');
    this.hdr = postile.dom.getDescendantByClass(this.container, "header");
    this.url = postile.dom.getDescendantByClass(this.container, "url");
    this.hdr.innerHTML = title;
    this.url.value = url;
    goog.events.listen(this.url, goog.events.EventType.CLICK, function() {
        this.select();
    });
    (function() {    
        if (window.addthis) {
            window.addthis = null;
            window._adr = null;
            window._atc = null;
            window._atd = null;
            window._ate = null;
            window._atr = null;
            window._atw = null
        }
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = "//s7.addthis.com/js/300/addthis_widget.js#pubid=xa-518e698772e1aa30";
        document.body.appendChild(script);
    })();
}

goog.inherits(postile.view.Share, postile.view.PopView);

postile.view.Share.prototype.unloaded_stylesheets = ['share.css'];