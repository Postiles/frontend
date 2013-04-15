goog.provide('postile.view.signup');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');

postile.view.signup.SignupView = function() {
    var instance = this;
    postile.view.FullScreenView.call(this);
    postile.ui.load(this.container,
                    postile.conf.staticResource(['signup_pg1.html']));
    this.btn_next = goog.dom.getElement('btn');
    goog.events.listen(this.btn_next,goog.events.EventType.CLICK,
                       this.next.bind(this));
}

goog.inherits(postile.view.signup.SignupView, postile.view.FullScreenView);

postile.view.signup.SignupView.prototype.next = function() {
    this.container.innerHTML = "";
    postile.ui.load(this.container,
                    postile.conf.staticResource(['signup_pg2.html']));
}


postile.view.signup.SignupView.prototype.unloaded_stylesheets = ['signup.css'];


