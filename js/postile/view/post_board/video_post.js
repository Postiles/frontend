goog.provide('postile.view.post.video_post');

goog.require('postile.view.BasePost');

postile.view.post.video_post.VideoPost = function(postData, board, mode) {
    goog.base(this, postData, board, mode);

    goog.dom.classes.add(this.wrap_el, 'video_post');
}

goog.inherits(postile.view.post.video_post.VideoPost,
              postile.view.BasePost);

postile.view.post.video_post.VideoPost.prototype.enterDisplayMode = function() {
    goog.base(this, 'enterDisplayMode');

    var elements = this.displayModeElements;

    this.initVideo(elements);
}

postile.view.post.video_post.VideoPost.prototype.enterEditMode = function(req) {
    goog.base(this, 'enterEditMode', req);

    var elements = this.editModeElements;

    this.initVideo(elements);

    elements.postTitle_el.focus();

    elements.postContent_el.contentEditable = 'false'; // disable content editing
}

postile.view.post.video_post.VideoPost.prototype.initVideo = function(elements) {
    if (elements.postContent_el.innerHTML.length == 0) { // if post content is empty, add video element to it
        this.videoPreview_el = goog.dom.createDom('iframe', {
            'class': 'video_iframe',
            'src': this.postData.post.video_link,
            'frameBorder': 0
        });

        goog.dom.appendChild(elements.postContent_el, this.videoPreview_el);
        this.videoPreview_el.style.height = this.wrap_el.offsetHeight - 68 + 'px';
        this.videoPreview_el.style.width = '100%';
    }
}

postile.view.post.video_post.VideoPost.prototype.submitChange = function() {
    var elements = this.editModeElements;

    var title = elements.postTitle_el.value;

    postile.ajax([ 'post', 'submit_change' ], 
            {
                post_id: this.postData.post.id, 
                title: title
            }, 
            function(data) {
                this.postData.post.title = title;
                this.enterDisplayMode();
                this.board.disableMovingCanvas = false;
            }.bind(this));
}
