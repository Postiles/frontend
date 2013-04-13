goog.provide('postile.view.post.picture_post');

goog.require('postile.view.post');

postile.view.post.picture_post.PicturePost = function(postData, board, mode) {
    goog.base(this, postData, board, mode);

    goog.dom.classes.add(this.wrap_el, 'picture_post');

    this.wrap_el.style.backgroundImage = 'url(' 
            + postile.conf.uploadsResource([this.postData.post.image_url]) + ')';
}

goog.inherits(postile.view.post.picture_post.PicturePost, postile.view.post.Post);

postile.view.post.picture_post.PicturePost.prototype.enterDisplayMode = function() {
    goog.base(this, 'enterDisplayMode');

    var elements = this.displayModeElements;
}

postile.view.post.picture_post.PicturePost.prototype.enterEditMode = function(req) {
    goog.base(this, 'enterEditMode', req);

    var elements = this.editModeElements;

    postile.ui.makeLabeledInput(elements.postTitle_el, '(enter to submit)',
            'half_opaque', function() {
                this.submitChange();
            }.bind(this));

    elements.postTitle_el.focus();
}

postile.view.post.picture_post.PicturePost.prototype.enterCommentMode = function() {
    goog.base(this, 'enterCommentMode');

    var elements = this.commentModeElements;
}

postile.view.post.picture_post.PicturePost.prototype.submitChange = function() {
    var elements = this.editModeElements;

    var title = elements.postTitle_el.innerHTML;

    postile.ajax([ 'post', 'submit_change' ], 
            {
                post_id: this.postData.post.id, 
                title: title,
            }, 
            function(data) {
                this.postData.post.title = title;
                this.enterDisplayMode();
            }.bind(this));
}
