goog.provide("postile.view.post_board.InternalLink");

goog.require("postile.view");

postile.view.post_board.InternalLink = function() {
    goog.base(this);
    this.container.innerHTML = 'FUCK';
}

goog.inherits(postile.view.post_board.InternalLink, postile.view.HoverTipView);