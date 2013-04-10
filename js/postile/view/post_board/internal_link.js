goog.provide("postile.view.post_board.InternalLink");

goog.require("postile.view");
goog.require("postile.ajax");
goog.require("goog.dom");

postile.view.post_board.InternalLink = function(pid) {
    goog.base(this);
    var cont = this.container;
    cont.className = "internal_link_wrap";
    cont.innerHTML = "A link to another post.";
    goog.dom.appendChild(cont, goog.dom.createDom('div', 'arrow'));
    postile.ajax(['post', 'get_post'], { post_id: pid }, function(r) {
        cont.innerHTML = r.message.post.title + " <i>by user_id " + r.message.post.creator_id + "</i>";
    });
}

goog.inherits(postile.view.post_board.InternalLink, postile.view.HoverTipView);

postile.view.post_board.InternalLink.prototype.unloaded_stylesheets = ['internal_link.css'];