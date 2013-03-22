goog.provide('postile.view.image_upload');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.fx.effects');

postile.view.image_upload.ImageUploadBlock = function(input_instance) {
	postile.view.PopView.call(this);

	this.container.id = 'upload_image_pop';

	this.dragBoard = goog.dom.createDom('div', 'upload_drag_board');
 	goog.dom.appendChild(this.container, this.dragBoard);

 	this.uploadContent = goog.dom.createDom('div', 'upload_content');
 	goog.dom.appendChild(this.dragBoard, this.uploadContent);

	/* add a dummy */
	goog.dom.appendChild(this.uploadContent, goog.dom.createDom('div', 'upload_dummy'));
	/* add icon */
	goog.dom.appendChild(this.uploadContent, goog.dom.createDom('div', 'upload_icon'));

	/* upload indication main words */
	this.uploadWord = goog.dom.createDom('div', 'upload_word');
	goog.dom.appendChild(this.uploadContent, this.uploadWord);
	this.selectBt = goog.dom.createDom('div', 'upload_select_file', 'Select File')
	goog.dom.appendChild(this.upload_content, this.selectBt);

	goog.dom.appendChild(this.uploadWord, goog.dom.createDom('div', 'upload_drag_here', 'Drag Here'));
	goog.dom.appendChild(this.uploadWord, goog.dom.createDom('div', 'upload_or', 'OR'));

	//goog.dom.appendChild(this.upload_drag_board, goog.dom.createDom('div', null, {id:"upload_preview_wrapper"}));	

	this.preview_wrapper = goog.dom.createDom('div', 'upload_preview_wrapper');
	goog.dom.appendChild(this.dragBoard, this.preview_wrapper);

	// Add event for drag or upload function 
	goog.events.listen(this.star_bt, goog.events.EventType.CLICK, function(e) {
        new postile.view.image_upload.ImageUploadConfirm(this.dragBoard);
    }.bind(this));  
	uploadWord()

}

postile.view.profile.ProfileView.prototype.unloaded_stylesheets = ['_profile_preview.css'];

/* Constructor for the uppper part of image upload  */
postile.view.image_upload.ImageUploadConfirm = function(icb) {



}