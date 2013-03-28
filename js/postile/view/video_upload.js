goog.provide('postile.view.video_upload');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx.effects');

postile.view.video_upload.VideoUpload = function(input_instance) {
	postile.view.PopView.call(this);
	
	this.container.id = 'upload_video_pop';
	postile.ui.load(this.container, postile.staticResource(['_upload_video.html']));
	console.log("video called");

	this.preview_button = postile.dom.getDescendantByClass(this.container, 'preview_button');
	this.lower_part = postile.dom.getDescendantByClass(this.container, 'upload_video_lower');

	goog.events.listen(this.preview_button, goog.events.EventType.CLICK, function(){
		goog.dom.classes.add( this.lower_part, 'upload_video_lower_animation');
	}.bind(this));
	this.container.style.top = '0px';
    this.container.style.left = '0px';
}

goog.inherits(postile.view.video_upload.VideoUpload, postile.view.PopView);
postile.view.video_upload.VideoUpload.prototype.unloaded_stylesheets = ['video_upload.css'];

postile.view.video_upload.VideoUpload.prototype.open = function(a){
	postile.view.PopView.prototype.open.call(this,a);
}
