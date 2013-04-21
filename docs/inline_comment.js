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

postile.view.post_board.PostBoard.prototype.fayeHandler = function(status, data) {
    switch (status) {
    case postile.view.post_board.faye_status.DELETE:
        var currPost = this.currentPosts[data.post.id];
        if (data.post.id in this.currentPosts) {
            if (!currPost.isSelfPost()) {
                this.removePost(data.post.id);
            }
        }
        break;
    case postile.view.post_board.faye_status.INLINE_COMMENT:
        if (data.inline_comment.post_id in this.currentPosts) {
            var currPost = this.currentPosts[data.inline_comment.post_id];

            currPost.postData.inline_comments.push(data);
            currPost.appendInlineComment(data);


            if (data.inline_comment.creator_id == localStorage.postile_user_id) { // my own comment
                currPost.commentModeElements.commentList_el.scrollTop =
                    currPost.commentModeElements.commentList_el.scrollHeight;
            }

            currPost.hideNoCommentEl();

            // note that this line should be put after appendInlineComment to
            // get the correct count
            currPost.resetCommentPreview(data);
        }
        break;
    case postile.view.post_board.faye_status.DELETE_COMMENT:
        if (data.inline_comment.post_id in this.currentPosts) {
            var currPost = this.currentPosts[data.inline_comment.post_id];
            currPost.removeInlineComment(data.inline_comment);
        }
        break;
    }
}
