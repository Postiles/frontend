/*confirm_delete.js for confirm delete the post selected */

goog.provide('postile.view.confirm_delete');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('postile.fx.effects');

postile.view.confirm_delete.ConfirmDelete = function() {
	postile.view.TipView.call(this);
	postile.ui.load(this.container, postile.staticResource(['confirm_delete.html']));
	this.container.className = 'confirm_delete';
	console.log("confirm delete loaded");

    goog.dom.appendChild(document.body, this.container);
}

goog.inherits(postile.view.confirm_delete.ConfirmDelete, postile.view.TipView);
postile.view.confirm_delete.ConfirmDelete.prototype.unloaded_stylesheets = ['confirm_delete.css'];

console.log();