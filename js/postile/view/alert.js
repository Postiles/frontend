goog.provide('postile.view.Alert');

goog.require('postile.dom');
goog.require('postile.view');

postile.view.Alert = function() {
    goog.base(this);
    this.container.style.width = '500px';

	postile.ui.load(this.container, postile.conf.staticResource(['_alert.html']));

    this.addCloseButton(this.container);
}

goog.inherits(postile.view.Alert, postile.view.PopView);

postile.view.Alert.prototype.unloaded_stylesheets = ['_alert.css'];

