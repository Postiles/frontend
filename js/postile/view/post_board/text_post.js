goog.provide('postile.view.post.text_post');

goog.require('postile.view.post');

postile.view.post.text_post.TextPost = function(postData, board, mode) {
    goog.base(this, postData, board, mode);

    goog.dom.classes.add(this.wrap_el, 'text_post');
}

goog.inherits(postile.view.post.text_post.TextPost, postile.view.post.Post);

postile.view.post.text_post.TextPost.prototype.enterDisplayMode = function() {
    goog.base(this, 'enterDisplayMode');

    var elements = this.displayModeElements;

    elements.postContent_el.innerHTML = this.postData.post.content;
}

postile.view.post.text_post.TextPost.prototype.enterEditMode = function(req) {
    goog.base(this, 'enterEditMode', req);

    var elements = this.editModeElements;

    elements.postContent_el.focus();
    elements.postContent_el.style.cursor = 'auto';

    if (req) {
        elements.postContent_el.innerHTML = this.postData.post.content;
    }
}

postile.view.post.text_post.TextPost.prototype.submitChange = function() {
    var elements = this.editModeElements;

    var title = elements.postTitle_el.innerHTML;
    var content = elements.postContent_el.innerHTML;

    if (!content) { // content is empty
        return;
    }

    postile.ajax([ 'post', 'submit_change' ], 
            {
                post_id: this.postData.post.id,
                title: title,
                content: content,
            }, 
            function(data) {
                this.postData.post.title = title;
                this.postData.post.content = content;
                this.enterDisplayMode();
            }.bind(this));
}
