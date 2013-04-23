goog.provide('postile.uploader');

goog.require('postile.ajax');
//goog.require('postile.fx');
goog.require('goog.dom');


/* How to handle these global variables ? */
postile.uploader.dragInit = function(drag_board_el, instance){
    postile.uploader.tests = {formdata: !!window.FormData};
    postile.uploader.image_upload = instance;
    this.dragBox = drag_board_el;
    this.dragBox.addEventListener("dragenter", dragEnter, false);
    this.dragBox.addEventListener("dragexit", dragExit, false);
    this.dragBox.addEventListener("dragover", dragOver, false);
    this.dragBox.addEventListener("drop", this.dragUpload, false); 
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
        postile.uploader.formData = new FormData() ;
        postile.uploader.formData.append('image', file); // NOTICE: always use "image" as the name, need to change
        postile.uploader.formData.append('upload_path', postile.uploader.upload_path);
        postile.uploader.formData.append('user_id', localStorage.postile_user_id);
        postile.uploader.formData.append('session_key', localStorage.postile_user_session_key);

        console.log(postile.uploader.formData);

        postile.uploader.submit();

        postile.uploader.image_upload.close();
        console.log('image_close');
    }
};

postile.uploader.clickUpload = function(instance_el) {
    var files = instance_el.files;
    console.log(files[0]);
    postile.uploader.formData =  new FormData();
    postile.uploader.formData.append('image', files[0]);
    postile.uploader.formData.append('upload_path', postile.uploader.upload_path);
    postile.uploader.formData.append('user_id', localStorage.postile_user_id);
    postile.uploader.formData.append('session_key', localStorage.postile_user_session_key);

    console.log(postile.uploader.formData);

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
    var iframe = goog.dom.createDom('iframe', {'id':'upload_target', 'name':'upload_target', 'src': '#', 'style': 'width:0;height:0;border:0px solid #fff;'});
    
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

    if(postile.uploader.upload_path == null){
        console.log("error, no upload_path specified");
    }
    postile.uploader.formData.append('upload_path', postile.uploader.upload_path);

    if(postile.uploader.formData !== null){
        postile.ajax.upload( ['upload', 'upload_image' ], postile.uploader.formData, function(data) {
            var filename = data.message.filename;
             // change the image path after backend is done
            if(postile.uploader.upload_path == 'profile_image'){

                // This is not an elegent solution. Just find the div by searching class
                var picture_el = goog.dom.getElementByClass('picture');
                var pictureImg_el = goog.dom.getElementsByTagNameAndClass('img', null, picture_el)[0];
                if(pictureImg_el){
                    pictureImg_el.src = postile.conf.uploadsResource(['profile_image',filename]);
                }

                var small_pic_el = goog.dom.getElement('profile_image_container');
                var small_pic_img_el = goog.dom.getElementsByTagNameAndClass('img', null, small_pic_el)[0];
                console.log(small_pic_img_el);
                if(small_pic_img_el){
                    small_pic_img_el.src = postile.conf.uploadsResource(['profile_image',filename]);
                }

                // Change the profile in the database
                postile.ajax(['profile', 'update_profile_image'],{image_url: 'profile_image/' + filename}, function(data){

                });
                
            } else if(postile.uploader.upload_path == 'post_image') {
                // a handler to handle normal user upload

                if (postile.router.current_view instanceof postile.view.post_board.PostBoard) {
                    postile.router.current_view.postCreator.open(['post_image/' + filename]);
                }
                
            }
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
