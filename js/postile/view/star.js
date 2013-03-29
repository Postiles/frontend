goog.provide('postile.view.star');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');

postile.view.star.Star = function(input_instance) {
    var instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.conf.staticResource(['_star.html']));
    this.container.id = 'star_pup_up';
    console.log("notification called");
    this.container.style.top = '0px';
    this.container.style.left = '0px';
}

goog.inherits(postile.view.star.Star, postile.view.TipView);
postile.view.star.Star.prototype.unloaded_stylesheets = ['star.css'];
