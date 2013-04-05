goog.provide('postile.view.WelcomePage');

goog.require('postile.dom');
goog.require('postile.view');
goog.require('goog.events');

postile.view.WelcomePage = function() {
    var instance = this;
    goog.base(this);
    document.getElementById('dhost').value = postile.conf.dhost;
    document.getElementById('dport').value = postile.conf.dport;
    document.getElementById('faye').value = postile.conf.fayeLocation;
    document.getElementById('locale').value = goog.locale.getLocale();
    goog.events.listen(postile.dom.getDescendantById(this.container, "cng"), goog.events.EventType.CLICK, function() {
        instance.saveItm('dhost');
        instance.saveItm('dport');
        instance.saveItm('faye');
        instance.saveItm('locale');
        postile.conf.initDbgConfiguration();
        postile.router.dispatch('board/'+document.getElementById("board").value);
    });
}

goog.inherits(postile.view.WelcomePage, postile.view.FullScreenView);

postile.view.WelcomePage.prototype.saveItm = function(name) {
    var val = document.getElementById(name).value;
    if (val.length) {
        localStorage['postile_debug_'+name] = val;
    } else {
        delete localStorage['postile_debug_'+name];
    }
}

postile.view.WelcomePage.prototype.html_segment = postile.conf.staticResource(['welcome.html']);