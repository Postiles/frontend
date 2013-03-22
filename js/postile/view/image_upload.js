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
	goog.events.listen(this.selectBt, goog.events.EventType.CLICK, function(e) {

		/* TODO get the image from input */
		// Call a function in utils upload_image.js

        new postile.view.image_upload.ImageUploadConfirm(this.dragBoard, image);
    }.bind(this));  
}

postile.view.profile.ProfileView.prototype.unloaded_stylesheets = ['_profile_preview.css'];

/* Constructor for the uppper part of image upload  */
postile.view.image_upload.ImageUploadConfirm = function(icb, image) {
	var instance = icb;
	postile.dom.getDescendantByClassName('upload_content').style.display = 'none';

	/* for preview  
		width: 280px;
		height: 240px;
		background: url(../images/hot.png);
	*/
	this.preview = postile.dom.getDescendantByClassName('upload_preview_wrapper');
	this.preview.style.width = '280px';
	this.preview.style.height = '240px';
	//this.preview.style.background = 'url(' + image + ');';
	this.preview.style.background = 'url(../images/hot.png)';

	this.confirmPop = goog.dom.createDom('div', 'upload_confirm_pop');
	goog.dom.appendChild(this, this.confirmPop);

	this.resetBt = goog.dom.createDom('div', 'upload_confirm_button', {id:'upload_repick'});
	goog.dom.appendChild(this.confirmPop, this.resetBt);

	goog.events.listen(this.resetBt, goog.events.EventType.CLICK, function(e) {
        /* TODO User want to reset the upload */
    }.bind(this));  

	this.uploadSubConfirmPop = goog.dom.createDom('div', 'upload_sub_confirm_pop');
	goog.dom.appendChild(this.confirmPop, this.uploadSubConfirmPop);

	this.uploadCancel = goog.dom.createDom('div', 'upload_confirm_button', {id:'upload_cancel'});
	goog.dom.appendChild(this.uploadSubConfirmPop, this.uploadCancel);

	goog.events.listen(this.uploadCancel, goog.events.EventType.CLICK, function(e) {
        /* TODO User want to Cancel the upload */
    }.bind(this));  

	this.uploadOK = goog.dom.createDom('div', 'upload_confirm_button', {id:'upload_ok'});
	goog.dom.appendChild(this.uploadSubConfirmPop, this.uploadOK);

	goog.events.listen(this.uploadOK, goog.events.EventType.CLICK, function(e) {
        /* TODO User want to Confirm the upload */
    }.bind(this)); 

}