goog.provide('postile.view.image_upload');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.uploader');
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
	var fakefile = goog.dom.createDom('div',{'class': 'fileinputs'});
	this.fileInput = goog.dom.createDom('input',{'class': 'file', 'name': 'image', 'type':'file'});

	goog.dom.appendChild(this.uploadContent, fakefile);
	goog.dom.appendChild(fakefile, this.fileInput);
	goog.events.listen(this.fileInput, goog.events.EventType.CHANGE, function(e) {
		postile.uploader.clickUpload(this.fileInput);
		this.close();
	}.bind(this));
}
goog.inherits(postile.view.image_upload.ImageUploadBlock, postile.view.PopView);

postile.view.image_upload.ImageUploadBlock.prototype.unloaded_stylesheets = ['upload_image.css'];

postile.view.image_upload.ImageUploadBlock.prototype.open = function(a) {
	postile.view.PopView.prototype.open.call(this,a);
	this.initFileUploads();
}


postile.view.image_upload.ImageUploadBlock.prototype.initFileUploads = function() {
	var W3CDOM = (document.createElement && document.getElementsByTagName);
	var fakeFileUpload = document.createElement('div');
	if (!W3CDOM) return;	fakeFileUpload.className = 'fakefile';
//	fakeFileUpload.appendChild(document.createElement('input'));
	//var image = document.createElement('img');

	/*
	image.src=postile.conf.uploadsResource(['guanlun-profile.png']);

	fakeFileUpload.appendChild(image);
	var x = document.getElementsByTagName('input');
	for (var i=0;i<x.length;i++) {
		if (x[i].type != 'file') continue;
		if (x[i].name != 'image') continue;
		x[i].className = 'file hidden';
		var clone = fakeFileUpload.cloneNode(true);
		x[i].parentNode.appendChild(clone);
		x[i].relatedElement = clone.getElementsByTagName('input')[0];
		x[i].onchange = x[i].onmouseout = function () {
			this.relatedElement.value = this.value;
		}
	}
	*/
}
