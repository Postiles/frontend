goog.provide('postile.view.createPostFromJSON');
goog.provide('postile.view.switchToPost');

goog.require('goog.array');
goog.require('postile.view.post.text_post');
goog.require('postile.view.post.picture_post');
goog.require('postile.view.post.video_post');

/**
 * Factory function that creates a post from JSON data retrieved
 * from the server
 */
postile.view.createPostFromJSON = function(postData, board, mode) {
    if (postData.post.image_url) { // PicturePost
        return new postile.view.post.picture_post.PicturePost(
            postData, board, mode);
    } else if (postData.post.video_link) { // VideoPost
        return new postile.view.post.video_post.VideoPost(
            postData, board, mode);
    } else { // TextPost
        return new postile.view.post.text_post.TextPost(
            postData, board, mode);
    }
}

/**
 * Generic post switch function that switch to the board that contains
 * this post.
 */
postile.view.switchToPost = function(postId) {
    var dispatched = goog.array.some(postile.view.switchToPost.registry,
        function(func) {
            return func(postId);
        });

    if (!dispatched) {
        var last = postile.view.switchToPost.defaultSwitcher;
        if (last) {
            last(postId);
        }
    }
};

/**
 * A list of functions that returns true if the postId is accepted.
 * @type {Array.<function>}
 */
postile.view.switchToPost.registry = [];

postile.view.switchToPost.defaultSwitcher = null;


