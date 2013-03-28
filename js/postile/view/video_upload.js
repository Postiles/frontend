goog.provide('postile.view.video_upload');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx.effects');
goog.require('postile.re');

postile.view.video_upload.VideoUpload = function(input_instance) {
	postile.view.PopView.call(this);
	
	this.container.id = 'upload_video_pop';
	postile.ui.load(this.container, postile.staticResource(['_upload_video.html']));
	console.log("video called");

	this.preview_button_el = postile.dom.getDescendantByClass(this.container, 'preview_button');
	this.lower_part_el = postile.dom.getDescendantByClass(this.container, 'upload_video_lower');
	this.user_input_el = postile.dom.getDescendantByClass(this.container, 'text');

    goog.events.listen(this.user_input_el, goog.events.EventType.KEYDOWN, function(e) {
//    	if(postile.brower_compact.is
		if(e.keyCode == 17 || e.keyCode == 91) { // control button
			goog.events.listen(this.user_input_el, goog.events.EventType.KEYUP, function(e) {
				if(e.keyCode == 86) {
					this.showPreview();
				}
			}.bind(this));
		}
	}.bind(this));

	goog.events.listen(this.preview_button_el, goog.events.EventType.CLICK, function(){
		this.showPreview();
	}.bind(this));

	this.container.style.top = '0px';
    this.container.style.left = '0px';
}

goog.inherits(postile.view.video_upload.VideoUpload, postile.view.PopView);
postile.view.video_upload.VideoUpload.prototype.unloaded_stylesheets = ['video_upload.css'];

postile.view.video_upload.VideoUpload.prototype.showPreview = function(){
	
	var user_input_url = this.user_input_el.value;

	var embedCode = postile.re.getEmbed(user_input_url);
	if(embedCode == 'invalid'){
		var submit_waiting = new postile.toast.Toast(2, "Please provide valid input.");
		return;
	}
	goog.dom.classes.add(this.lower_part_el, 'upload_video_lower_animation');

	this.video_preview_el = postile.dom.getDescendantByClass(this.container, 'video_preview');
	this.iframe = postile.dom.getDescendantByClass(this.video_preview_el,'iframe_preview');
	this.iframe.setAttribute('src', embedCode);

	console.log(this.video_preview_el);

	this.reset_button = postile.dom.getDescendantByClass(this.container, 'reset_button');
	this.cancel_button = postile.dom.getDescendantByClass(this.container, 'cancel_button');
	this.ok_button = postile.dom.getDescendantByClass(this.container, 'ok_button');

	goog.events.listen(this.reset_button, goog.events.EventType.CLICK, function(){
		goog.dom.classes.remove(this.lower_part_el, 'upload_video_lower_animation');		
		this.iframe.setAttribute('src', '');
	}.bind(this));
	goog.events.listen(this.cancel_button, goog.events.EventType.CLICK, function(){
		this.close();
	}.bind(this));
	goog.events.listen(this.ok_button, goog.events.EventType.CLICK, function(){
		// TODO create a post with this video
	}.bind(this));

}


postile.view.video_upload.VideoUpload.prototype.open = function(a){
	postile.view.PopView.prototype.open.call(this,a);
}
