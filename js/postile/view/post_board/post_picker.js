goog.provide('postile.view.post_board.post_picker');

goog.require('goog.events');
goog.require('goog.dom');
goog.require('postile.view.post_board');

postile.view.post_board.PostPicker = function(post_board_obj) {
    var instance = this;
    this.board = post_board_obj;
    this.active_post = null;
    this.ghost_board_el = goog.dom.createDom('div', 'canvas_mask');
    goog.events.listen(this.ghost_board_el, goog.events.EventType.MOUSEMOVE, function(e){ instance.mmHandler(e) });
    goog.dom.appendChild(this.board.canvas, this.ghost_board_el);
}

postile.view.post_board.PostPicker.prototype.close = function() {
    goog.dom.removeNode(this.ghost_board_el);
}

postile.view.post_board.PostPicker.prototype.promote = function(post) {
    if (post == this.active_post) { return; }
    this.demote();
    this.active_post = post;
    goog.dom.appendChild(this.ghost_board_el, this.board.currentPosts[i].wrap_el);
}

postile.view.post_board.PostPicker.prototype.demote = function() {
    if (!this.active_post) { return; }
    goog.dom.appendChild(this.board.canvas, this.active_post.wrap_el);
    this.active_post = null;
}

postile.view.post_board.PostPicker.prototype.mmHandler = function(e) {
    var mouse_coord = [this.board.xPosFrom(e.clientX - this.board.viewport_position.x - this.board.canvasCoord[0]), this.board.yPosFrom(e.clientY - this.board.viewport_position.y - this.board.canvasCoord[1])];
    for (i in this.board.currentPosts) {
        if(mouse_coord[0] <= this.board.currentPosts[i].post.coord_x_end && mouse_coord[0] >= this.board.currentPosts[i].post.coord_x && mouse_coord[1] <= this.board.currentPosts[i].post.coord_y_end && mouse_coord[1] >= this.board.currentPosts[i].post.coord_y) { 
            this.promote(this.board.currentPosts[i]);
            return;
        }
    }
    this.demote();
}