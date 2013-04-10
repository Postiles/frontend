goog.provide("postile.view.post_board.InternalLink");

goog.require("postile.view");
goog.require("postile.ajax");
goog.require("goog.dom");

postile.view.post_board.InternalLink = function(pid) {
    goog.base(this);
    var cont = this.container;
    cont.className = "internal_link_wrap";
    goog.dom.appendChild(cont, goog.dom.createDom('div', 'arrow'));
    var title = goog.dom.createDom('span', 'title');
    goog.dom.appendChild(cont, title);
    var user = goog.dom.createDom('span', 'user');
    goog.dom.appendChild(cont, user);
    goog.events.listen(title, goog.events.EventType.CLICK, function() {
        if (postile.router.current_view instanceof postile.view.post_board.PostBoard) {
            postile.router.current_view.moveToPost(pid);
        }
    });
    postile.ajax(['post', 'get_post'], { post_id: pid }, function(r) {
        title.innerHTML = r.message.post.title;
        postile.data_manager.getUserData(r.message.post.creator_id, function(data) {
            user.innerHTML = " by "+ data.username;
        });
    });
};

goog.inherits(postile.view.post_board.InternalLink, postile.view.HoverTipView);

postile.view.post_board.InternalLink.prototype.unloaded_stylesheets = ['internal_link.css'];