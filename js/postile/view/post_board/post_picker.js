goog.provide('postile.view.post_board.post_picker');

goog.require('goog.events');
goog.require('goog.dom');
goog.require('postile.fx');
//goog.require('postile.view.post_board');

postile.view.post_board.PostPicker = function(post_board_obj) {
    var instance = this;
    this.board = post_board_obj;
    this.active_post = null;
    this.lkd_el = null;
    this.done_callback = null;
    this.ghost_board_el = goog.dom.createDom('div', 'canvas_mask');
    this.hint_el = goog.dom.createDom('div', 'mask_hint');
    this.hint_el.innerHTML = postile._('mask_for_picking_post');
    instance.ghost_board_el.style.display = 'none';
    instance.hint_el.style.display = 'none';
    this.all_lkd_el = {};
    this.mvListener = new postile.events.EventHandler(this.ghost_board_el, goog.events.EventType.MOUSEMOVE, function(e){ instance.mmHandler(e) });
    this.clkListener = new postile.events.EventHandler(this.ghost_board_el, goog.events.EventType.CLICK, function(e){ e.stopPropagation(); instance.clkHandler(); }, true);
    goog.dom.appendChild(this.ghost_board_el, this.hint_el);
    goog.dom.appendChild(this.board.canvas, this.ghost_board_el);
}

postile.view.post_board.PostPicker.prototype.open = function(dcb, post) {
    this.done_callback = dcb;
    this.permanent_post = post;
    this.ghost_board_el.style.display = 'block';
    this.ghost_board_el.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    this.hint_el.style.display = 'block';
    this.mvListener.listen();
    this.clkListener.listen();
    goog.dom.appendChild(this.ghost_board_el, post.wrap_el);
}

postile.view.post_board.PostPicker.prototype.close = function() {
    var instance = this;
    this.mvListener.unlisten();
    this.clkListener.unlisten();
    this.hint_el.style.display = 'none';
    if (instance.lkd_el) {
        instance.all_lkd_el[instance.active_post.post.id] = instance.lkd_el;
        var width = instance.lkd_el.offsetWidth;
    }
    new postile.fx.Animate(function(i) {
        instance.ghost_board_el.style.backgroundColor = 'rgba(0, 0, 0, '+(0.3 * (1 - i))+')';
        if (instance.lkd_el) { instance.lkd_el.style.clip = 'rect('+Math.round(21*(1-i))+'px '+width+'px 21px 0px)'; }
    }, 400, {
        ease: postile.fx.ease.cubic_ease_out,
        callback: function() {
            goog.dom.appendChild(instance.board.canvas, instance.permanent_post.wrap_el);
            instance.ghost_board_el.style.display = 'none';
            instance.done_callback(instance.active_post);
            instance.demote();
            instance.lkd_el = null;
        }
    });
}

postile.view.post_board.PostPicker.prototype.promote = function(post) {
    if (post == this.active_post || post == this.permanent_post) { return; }
    this.demote();
    this.active_post = post;
    goog.dom.appendChild(this.ghost_board_el, post.wrap_el);
}

postile.view.post_board.PostPicker.prototype.demote = function() {
    if (!this.active_post) { return; }
    goog.dom.appendChild(this.board.canvas, this.active_post.wrap_el);
    this.active_post = null;
}

postile.view.post_board.PostPicker.prototype.mmHandler = function(e) {
    this.demote();
    var mouse_coord = [this.board.xPosFrom(e.clientX - this.board.viewport_position.x - this.board.canvasCoord[0]), this.board.yPosFrom(e.clientY - this.board.viewport_position.y - this.board.canvasCoord[1])];
    for (i in this.board.currentPosts) {
        if(mouse_coord[0] <= this.board.currentPosts[i].post.coord_x_end && mouse_coord[0] >= this.board.currentPosts[i].post.pos_x && mouse_coord[1] <= this.board.currentPosts[i].post.coord_y_end && mouse_coord[1] >= this.board.currentPosts[i].post.pos_y) { 
            this.promote(this.board.currentPosts[i]);
            return;
        }
    }
}

postile.view.post_board.PostPicker.prototype.clkHandler = function() {
    if (this.active_post) {
        this.lkd_el = goog.dom.createDom('div', 'post_mark_linked');
        this.lkd_el.innerHTML = postile._('linked');
        goog.dom.appendChild(this.active_post.wrap_el, this.lkd_el);
    }
    this.close();
}
