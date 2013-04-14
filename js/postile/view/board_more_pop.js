goog.provide('postile.view.board_more_pop');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.view.new_board');
goog.require('postile.view.star');
goog.require('postile.fx.effects');

postile.view.board_more_pop.BoardMorePop = function(input_instance) {

    postile.view.TipView.call(this);

    postile.ui.load(this.container, postile.conf.staticResource(['_board_more_pop.html']));
    this.container.id = 'board_more';
    this.container.style.top = '0px';
    this.container.style.left = '0px';

    // var star_bt = postile.dom.getDescendantById(this.container, 'star');
    var more_photo_button = postile.dom.getDescendantById(this.container, 'more_photo_button');
    var more_video_button = postile.dom.getDescendantById(this.container, 'more_video_button');

    this.imageUploadPop = new postile.view.image_upload.ImageUploadBlock(this);
    goog.events.listen(more_photo_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation(); 
        this.imageUploadPop.open(this);
        postile.uploader.upload_path = 'post_image';
    }.bind(this));  


    this.VideoUploadPop = new postile.view.video_upload.VideoUpload(this);
    goog.events.listen(more_video_button, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation(); 
        this.VideoUploadPop.open(this);
    }.bind(this));  
/*
    goog.events.listen(star_bt, goog.events.EventType.CLICK, function(e) {
        (new postile.view.star.Star(this)).open(star_bt);
    });  
*/
}

goog.inherits(postile.view.board_more_pop.BoardMorePop, postile.view.TipView);
postile.view.board_more_pop.BoardMorePop.prototype.unloaded_stylesheets = ['board_more_pop.css'];

postile.view.board_more_pop.BoardMorePop.prototype.open = function(a,b){
    postile.view.TipView.prototype.open.call(this,a,b);
    // save the icon button that trigger open html
    this.triggerButton = a;
    this.triggerButton.style.background = '#024d61';
    var imgTag = goog.dom.getElementsByTagNameAndClass('img', '', this.triggerButton);
    imgTag[0].setAttribute('src', postile.conf.imageResource(['popup_icon_active.png']));
}

postile.view.board_more_pop.BoardMorePop.prototype.close = function(){
    postile.view.TipView.prototype.close.call(this);
    // change triggerButton's background
    if(this.triggerButton){
        var imgTag = goog.dom.getElementsByTagNameAndClass('img', '', this.triggerButton);
        this.triggerButton.style.background = '#f5f5f5';
        imgTag[0].setAttribute('src', postile.conf.imageResource(['popup_icon.png']));
    }
}
