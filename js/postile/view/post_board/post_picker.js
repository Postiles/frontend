goog.provide('postile.view.post_board.post_picker');

goog.require('goog.events');
goog.require('goog.dom');
goog.require('postile.view.post_board');

postile.view.post_board.PostPicker = function(post_board_obj) {
    var instance = this;
    this.board = post_board_obj;
    this.ghost_board_el = goog.dom.createDom('div', 'canvas_mask');
    goog.events.listen(this.ghost_board_el, goog.events.EventType.CLICK, function(e){ instance.clickHandler(e) });
    goog.dom.appendChild(this.board.canvas, this.ghost_board_el);
}

postile.view.post_board.PostPicker.prototype.promote = function(post) {
    if (this.board.currentPosts[i].wrap_el.parentNode != this.ghost_board_el) {
        goog.dom.appendChild(this.ghost_board_el, this.board.currentPosts[i].wrap_el);
    }
}

postile.view.post_board.PostPicker.prototype.clickHandler = function(e) {
    var mouse_coord = [this.board.xPosFrom(e.clientX - this.board.canvasCoord[0]), this.board.yPosFrom(e.clientY - this.board.canvasCoord[1])];
    for (i in this.board.currentPosts) {
        if(mouse_coord[0] <= this.board.currentPosts[i].post.coord_x_end && mouse_coord[0] >= this.board.currentPosts[i].post.coord_x && mouse_coord[1] <= this.board.currentPosts[i].post.coord_y_end && mouse_coord[1] >= this.board.currentPosts[i].post.coord_y) { 
            this.promote(this.board.currentPosts[i]);
        }
    }
    
}