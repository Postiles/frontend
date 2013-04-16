goog.provide('postile.view.create_helper');

goog.require('goog.events');
goog.require('goog.dom');


postile.view.create_helper.CreateHelper = function(input_instance){
    postile.view.NormalView.call(this);
    postile.ui.load(this.container, postile.conf.staticResource(['_create_helper.html']));

    this.container.id = 'create_helper_wrapper';

    this.text_button = postile.dom.getDescendantsByClass(this.container, 'text_post');
    this.photo_button = postile.dom.getDescendantsByClass(this.container, 'picture_post');
    this.video_button = postile.dom.getDescendantsByClass(this.container, 'video_post');

    // normal post
    goog.events.listen((this.text_button)[0], goog.events.EventType.CLICK, function(){
        if (postile.router.current_view instanceof postile.view.post_board.PostBoard) {
            if (postile.router.current_view.disableMovingCanvas) { return; }
            postile.router.current_view.postCreator.open();
          }
    }.bind(this));

    // picture post
    this.imageUploadPop = new postile.view.image_upload.ImageUploadBlock(this);
    goog.events.listen((this.photo_button)[0], goog.events.EventType.CLICK, function(){
        this.imageUploadPop.open(this);
        postile.uploader.upload_path = 'post_image';
    }.bind(this));

    // video post
    this.VideoUploadPop = new postile.view.video_upload.VideoUpload(this);
    goog.events.listen((this.video_button)[0], goog.events.EventType.CLICK, function(){
        this.VideoUploadPop.open(this);
    }.bind(this));

}

goog.inherits(postile.view.create_helper.CreateHelper, postile.view.NormalView);
postile.view.create_helper.CreateHelper.prototype.unloaded_stylesheets = ['create_helper.css'];
