goog.provide('postile.view.video_upload');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx.effects');

postile.view.video_upload.VideoUpload = function(input_instance) {
	postile.view.PopView.call(this);
	


	this.open(300); 
}

goog.inherits(postile.view.video_upload.VideoUpload, postile.view.PopView);
postile.view.video_upload.VideoUpload.prototype.unloaded_stylesheets = ['video_upload.css'];

