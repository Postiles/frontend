goog.provide('postile.view.image_upload');

goog.require('postile.view');
goog.require('postile.uploader');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx.effects');

postile.view.image_upload.ImageUploadBlock = function(input_instance) {
	postile.view.PopView.call(this);

	this.container.id = 'upload_image_pop';

	this.dragBoard = goog.dom.createDom('div', 'upload_drag_board');
 	goog.dom.appendChild(this.container, this.dragBoard);

 	postile.uploader.dragInit(this.dragBoard);

 	this.uploadContent = goog.dom.createDom('div', 'upload_content');
 	goog.dom.appendChild(this.dragBoard, this.uploadContent);

	/* add a dummy */
	goog.dom.appendChild(this.uploadContent, goog.dom.createDom('div', 'upload_dummy'));
	/* add icon */
	goog.dom.appendChild(this.uploadContent, goog.dom.createDom('div', 'upload_icon'));

	/* upload indication main words */
	this.uploadWord = goog.dom.createDom('div', 'upload_word');
	goog.dom.appendChild(this.uploadContent, this.uploadWord);

	goog.dom.appendChild(this.uploadWord, goog.dom.createDom('span', 'upload_drag_here', 'Drag Here'));
	goog.dom.appendChild(this.uploadWord, goog.dom.createDom('span', 'upload_or', 'OR'));


	/* do not have logic in view, give everything for js to uploader to handle */
	var fileInput = goog.dom.createDom('input', { 'name': 'image', 'type':'file'});
	goog.dom.appendChild(this.uploadContent, fileInput);
	goog.events.listen(fileInput, goog.events.EventType.CHANGE, function(e) {
		postile.uploader.clickUpload(this);
	});
}
goog.inherits(postile.view.image_upload.ImageUploadBlock, postile.view.PopView);

postile.view.image_upload.ImageUploadBlock.prototype.unloaded_stylesheets = ['upload_image.css'];
