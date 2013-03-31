/*confirm_delete.js for confirm delete the post selected */

goog.provide('postile.view.confirm_delete');

goog.require('goog.dom');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.fx.effects');

postile.view.confirm_delete.ConfirmDelete = function(input_instance) {
	var instance = input_instance;

	postile.view.TipView.call(this);
	postile.ui.load(this.container, postile.conf.staticResource(['_confirm_delete.html']));
	this.container.className = 'confirm_delete';
	this.container.style.top = '-2px';
	this.container.style.left = '22px';

	var self = this;
	var bt_delete = this.container.lastChild.lastChild;
	var bt_cancel = bt_delete.previousSibling;
	
	goog.events.listen(bt_delete, goog.events.EventType.CLICK, function(){
        instance.removeFromBoard();
    });
    goog.events.listen(bt_cancel, goog.events.EventType.CLICK, function(){
        self.close();
    });

}

goog.inherits(postile.view.confirm_delete.ConfirmDelete, postile.view.TipView);
postile.view.confirm_delete.ConfirmDelete.prototype.unloaded_stylesheets = ['confirm_delete.css'];
