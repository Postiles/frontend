goog.provide('postile.view.post_in_board');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.dom.classes');
goog.require('postile.toast');
goog.require('goog.ui.LabelInput');

postile.view.post_in_board.Post = function(object, board) {
    this.board = board;
    this.render(object, true);
}

postile.view.post_in_board.Post.prototype.render = function(object, animation) { //animation is usually ommited (false by default)
    var button;
    var instance = this;
    goog.object.extend(this, object);
    this.coord_x_end = this.coord_x + this.span_x; //precalculate this two so that future intersect test will be faster
    this.coord_y_end = this.coord_y + this.span_y;
    if (this.wrap_el) { goog.dom.removeNode(this.wrap_el); } //remove original element
    this.wrap_el = goog.dom.createDom('div', 'post_wrap');
    this.wrap_el.rel_data = this;
    goog.dom.appendChild(this.board.canvas, this.wrap_el);
    this.wrap_el.style.left = this.board.xPosTo(this.coord_x) + 'px';
    this.wrap_el.style.top = this.board.yPosTo(this.coord_y) + 'px';
    this.wrap_el.style.width = this.board.widthTo(this.span_x) + 'px';
    this.wrap_el.style.height = this.board.heightTo(this.span_y) + 'px';
    if (this.user_id == localStorage.postile_user_id) { //created by current user
        var edit_button = goog.dom.createDom('div', 'post_edit_btn');
        edit_button.innerHTML = 'edit';
        goog.events.listen(edit_button, goog.events.EventType.CLICK, function() { instance.edit(); });
        goog.dom.appendChild(this.wrap_el, edit_button);
    }
    this.content_el = goog.dom.createDom('div', 'post_content');
    this.content_el.innerHTML = this.text_content;
    goog.dom.appendChild(this.wrap_el, this.content_el);
    if (animation) {
        postile.fx.effects.resizeIn(this.wrap_el);
    }  
}

postile.view.post_in_board.Post.prototype.disable = function() {
    goog.dom.removeChildren(this.wrap_el);
    goog.dom.classes.add(this.wrap_el, 'post_wrap_busy');
}

postile.view.post_in_board.Post.prototype.enable = function() {
    goog.dom.classes.remove(this.wrap_el, 'post_wrap_busy');
}

postile.view.post_in_board.Post.prototype.edit = function() {
    var instance = this;
    this.disable();
    var start_waiting = new postile.toast.Toast(0, "Please wait... We're starting editing... Be ready for 36s.");
    postile.ajax(['post','start_edit'], { post_id: this.id }, function(data) {
        var original_value = instance.text_content;
        var editor = new goog.ui.Textarea(original_value);
        var title = new goog.ui.LabelInput('Title (optional)');
        editor.addClassName('edit_textarea');
        editor.getElement().style.height = instance.wrap_el.offsetHeight - 27;
        goog.dom.removeChildren(instance.wrap_el);
        title.render(instance.wrap_el);
        editor.render(instance.wrap_el);
        goog.dom.classes.add('edit_title');
        instance.board.disableMovingCanvas = true; //disable moving
        instance.enable();
        start_waiting.abort();
        goog.events.listen(editor.getContentElement(), goog.events.EventType.BLUR, function(){ 
            instance.disable();
            instance.board.disableMovingCanvas = false;
            var submit_waiting = new postile.toast.Toast(0, "Please wait... We're submitting... Be ready for 36s.");
            postile.ajax(['post','submit_change'], { post_id: data.message, content: editor.getValue() }, function(data) {
                instance.render(data.message);
                submit_waiting.abort();
                var revert_waiting = new postile.toast.Toast(5, "Changes made. [Revert changes].", [function(){ 
                    var answer = confirm("Are you sure you'd like to revert? You cannot redo once you revert.");
                    if (answer) {
                        instance.disable();
                        var revert_submit_waiting = new postile.toast.Toast(0, "Please wait... We're submitting reversion... Be ready for 36s.");
                        revert_waiting.abort();
                        postile.ajax(['post','submit_change'], { post_id: data.message.id, content: original_value }, function(data) {
                            revert_submit_waiting.abort();
                            instance.render(data.message);
                        });
                    }
                }]);
            });
        });
    });
}