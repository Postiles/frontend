goog.provide('postile.uploader');

goog.require('postile.ajax');
//goog.require('postile.fx');
goog.require('goog.dom');
goog.require('postile.view.image_upload');


/* How to handle these global variables ? */
postile.uploader.dragInit = function(instance){
    postile.uploader.tests = {formdata: !!window.FormData};
    var dragBox = instance;
    dragBox.addEventListener("dragenter", dragEnter, false);
    dragBox.addEventListener("dragexit", dragExit, false);
    dragBox.addEventListener("dragover", dragOver, false);
    dragBox.addEventListener("drop", this.dragUpload, false); 
    delete postile.uploader.formData;
};
    
postile.uploader.dragUpload = function(evt){
    evt.stopPropagation();
    evt.preventDefault();
  
    var files = evt.dataTransfer.files;
    var count = files.length;
    
    // Only call the handler if 1 or more files was dropped.
    if (count !== 0){
        
        // handling the upload event
        postile.uploader.formData = null;
  	    var file = files[0]; // get the photo
        postile.uploader.formData = postile.uploader.tests.formdata ? new FormData() : null;
        postile.uploader.formData.append('image', file); // NOTICE: always use "image" as the name, need to change
        // TODO: Give Feedback to the user 

        postile.uploader.submit();
    }
};


postile.uploader.clickUpload = function(instance_el) {
    var files = instance_el.files;
    postile.uploader.formData = postile.uploader.tests.formdata ? new FormData() : null;
    postile.uploader.formData.append('image', files[0]);

    postile.uploader.submit();
}

postile.uploader.iframeInit = function(){
    // /var frameDiv = goog.dom.getElement("iframe");    
    // create the form for uploading use
    // TODO: give feedback to the user
    
    var hform = goog.dom.createDom('form', {'action': 'upload.php', 'method': 'post', 'enctype': 'multipart/form-data', 'target': 'upload_target'});
    hform.onsubmit = this.iframeUpload;
    var input_name = goog.dom.createDom('input', {'name': 'image', 'type':'file'});
    var input_submit = goog.dom.createDom('input', {'name': 'submitBtn', 'type':'submit', 'value':'Upload'});
    // create a 0 width 0 height iFrame
    var iframe = goog.dom.createDom('iframe', {'id':'upload_target', 'name':'upload_target', 'src': '#', 'style': 'width:0;height:0;border:0px solid #fff;'})
    
    goog.dom.appendChild(goog.dom.getElement("iframe"), hform);
    goog.dom.appendChild(hform, input_name);
    goog.dom.appendChild(hform, input_submit);
    goog.dom.appendChild(goog.dom.getElement("iframe"), iframe);
};
    
postile.uploader.iframeUpload = function(){ // How to call this function?
    //alert("load Done");
    console.log('load iframe done');
};
    
    // This function is for drog only
postile.uploader.submit = function(){ //  TODO check if browser is good
    if(postile.uploader.formData !== null){
        postile.ajax.upload( ['application', 'upload_image' ], postile.uploader.formData, function(data) {
            var filename = data.message.filename;

            // TODO call the function of Kong to drag photo
        });
    }
};


var dragBoxRenderer = {
    renderBox: function(){
        // TODO to render a box for uploading 
        // Need to determine the size of the box
        var dragbox = goog.dom.createDom('div', "dragbox");
        var submitBtn = goog.dom.createDom('button','');
        submitBtn.innerHTML = "Upload";
        submitBtn.onclick = postile.uploader.dragSubmit;
        
        goog.dom.appendChild(goog.dom.getElement("drag"), dragbox);
        goog.dom.appendChild(goog.dom.getElement("drag"), submitBtn);
        
        return dragbox; // return the id of the rendered dragbox
    }
};

var handleReaderLoad = function(){ 
    /*
    var upload_preview_wrapper = goog.dom.getElementByClassName('upload_preview_wrapper');
    var img_preview = goog.dom.createDom('img','img_preview');
    img_preview.src = this.result;
    goog.dom.appendChild(upload_preview_wrapper, img_preview);
    */
}


function dragEnter(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}
function dragExit(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}
function dragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}
