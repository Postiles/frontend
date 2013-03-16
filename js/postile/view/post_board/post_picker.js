goog.provide('postile.view.post_board.post_picker');

postile.view.post_board.PostPicker = function(post_board_obj) {
    this.board = post_board_obj;
    this.ghost_board_el = goog.dom.createDom('div', 'canvas_mask');
    goog.dom.appendChild(this.board.canvas, this.ghost_board_el);
}

postile.view.post_board.PostPicker.prototype.promote = function() {
    
}