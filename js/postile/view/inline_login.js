goog.provide('postile.view.inline_login');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');


postile.view.inline_login.InlineLogin = function(instance){
	postile.view.TipView.call(this);

	// indication of invalid email and password
	// this.incorrect_el = goog.dom.getElement('incorrect-alert');
	postile.ui.load(this.container, postile.conf.staticResource(['_inline_login.html']));
	this.container.id = 'inline_login';
    this.container.style.top = '0px';
    this.container.style.left = '0px';
}

goog.inherits(postile.view.inline_login.InlineLogin, postile.view.TipView);

postile.view.inline_login.InlineLogin.prototype.unloaded_stylesheets = ['inline_login.css'];

postile.view.inline_login.InlineLogin.prototype.open = function(a, b){
	postile.view.TipView.prototype.open.call(this,a,b);
}

postile.view.inline_login.InlineLogin.prototype.login = function(email, password){
	postile.user.login(email, password, function(data) {
    	window.location.reload();
    }, function(e) {
        this.incorrect_el.style.visibility = 'visible';
    }.bind(this));
}
