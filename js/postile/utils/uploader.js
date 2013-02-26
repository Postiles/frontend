goog.require('postile.ajax');
//goog.require('postile.fx');
goog.require('goog.dom');
goog.provide('postile.uploader');


var formData;

var tests = {
    formdata: !!window.FormData
};

postile.uploader.dragInit = function(){
    var dragBox = dragBoxRenderer.renderBox('drag');
    dragBox.addEventListener("dragenter", dragEnter, false);
    dragBox.addEventListener("dragexit", dragExit, false);
    dragBox.addEventListener("dragover", dragOver, false);
    dragBox.addEventListener("drop", this.dragUpload, false); 
};
    
postile.uploader.dragUpload = function(evt){
    evt.stopPropagation();
    evt.preventDefault();
  
    var files = evt.dataTransfer.files;
    var count = files.length;
    
    // Only call the handler if 1 or more files was dropped.
    if (count !== 0){
        
        // handling the upload event
  	    var file = files[0]; // get the photo
  	    console.log(formData);
        formData = tests.formdata ? new FormData() : null;
        console.log(formData);
        console.log(file);
        formData.append('image', file); // NOTICE: always use "image" as the name, need to change
        console.log(formData);
        // TODO: Give Feedback to the user 
        //document.getElementById("droplabel").innerHTML = "Processing " + file.name;

        var reader = new FileReader();

        // init the reader event handlers
        reader.onload = handleReaderLoad;
        // begin the read operation
        reader.readAsDataURL(file);
        
  	    console.log('uploading file');
  	    console.log(formData);
  	    
	    }
};

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
postile.uploader.dragSubmit = function(){ //  TODO check if browser is good
    if(/*this.xhr2supported() &&*/ this.formData !== null){
        //postile.ajax('upload.php', formData);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'upload.php');
        xhr.send(formData);
        //alert('send');
        console.log('Ajax_sent');
    }
    //}
    /*
    else{
        alert('unable to upload');
        if(!this.xhr2supported()){
            console.log('xhr2 not suppported');
            console.log(this.xhr2supported);
        }
        if (this.formData === null){
            console.log('formData is null');
        }
    }
    */
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

function handleReaderLoad(evt){
    
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