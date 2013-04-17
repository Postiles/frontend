goog.provide('postile.view.tutorial');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');

goog.require('postile.view');

postile.view.tutorial.TutorialView = function() {
    goog.base(this);

    postile.ui.load(this.container,
        postile.conf.staticResource(['tutorial.html']));
}

goog.inherits(postile.view.tutorial.TutorialView, postile.view.FullScreenView);

postile.view.tutorial.TutorialView.prototype.unloaded_stylesheets = [ 'tutorial.css' ];
