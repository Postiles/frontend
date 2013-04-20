postile.ajax([ 'inline_comment', 'new' ], 
    { post_id: this.postData.post.id, content: content, }, 
    function(data) {
        // do nothing here, handled in fayeHandler
    }.bind(this));

postile.ajax(
    [ 'inline_comment', 'like' ], // or unlike here
    { comment_id: commentData.inline_comment.id },
    function(data) {
        if (action == 'like') { // like
            this.elements.likeCount_el.innerHTML = 
                (++commentData.likes.length);
            this.elements.likeButton_el.innerHTML = 'Unlike';
        } else {
            this.elements.likeCount_el.innerHTML = 
                (--commentData.likes.length);
            this.elements.likeButton_el.innerHTML = 'Like';
        }
    }.bind(this));

postile.ajax(
    [ 'inline_comment', 'delete' ],
    { comment_id: commentData.inline_comment.id },
    function(data) {
        // handled by faye
    });
