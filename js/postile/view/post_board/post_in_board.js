goog.provide('postile.view.post_in_board');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.dom.classes');
goog.require('postile.toast');
goog.require('goog.ui.LabelInput');
goog.require('postile.string');
goog.require('postile.WYSIWYF');
goog.require('postile.debbcode');

postile.view.post_in_board.Post = function(object, board) {
    this.board = board;
    this.blur_timeout = null;
    this.render(object, true);
}

postile.view.post_in_board.Post.prototype.render = function(object, animation) { //animation is usually ommited (false by default)
    var button;
    var instance = this;
    if (object) { goog.object.extend(this, object); }
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

    /* guanlun's code, quality cannot be guaranteed: */
    this.post_top_el = goog.dom.createDom("div", "post_top");
    goog.dom.appendChild(this.wrap_el, this.post_top_el);

    this.post_title_el = goog.dom.createDom("span", "post_title");
    this.post_title_el.innerHTML = this.title;
    goog.dom.appendChild(this.post_top_el, this.post_title_el);

    this.post_author_el = goog.dom.createDom("span", "post_author");
    this.post_author_el.innerHTML = this.username;
    goog.dom.appendChild(this.post_top_el, this.post_author_el);

    this.post_content_el = goog.dom.createDom("div", "post_content");
    this.post_content_el.innerHTML = postile.parseBBcode(this.text_content);
    goog.dom.appendChild(this.wrap_el, this.post_content_el);

    this.post_bottom_el = goog.dom.createDom("div", "post_bottom");
    goog.dom.appendChild(this.wrap_el, this.post_bottom_el);

    this.post_icon_container_el = goog.dom.createDom("div", "post_icon_container");
    goog.dom.appendChild(this.post_bottom_el, this.post_icon_container_el);

    this.post_like_icon_el = goog.dom.createDom("div", "post_icon post_like_icon");
    goog.dom.appendChild(this.post_icon_container_el, this.post_like_icon_el);

    this.post_like_icon_el = goog.dom.createDom("div", "post_icon post_share_icon");
    goog.dom.appendChild(this.post_icon_container_el, this.post_like_icon_el);

    this.post_like_icon_el = goog.dom.createDom("div", "post_icon post_link_icon");
    goog.dom.appendChild(this.post_icon_container_el, this.post_like_icon_el);

    this.post_like_icon_el = goog.dom.createDom("div", "post_icon post_comment_icon");
    goog.dom.appendChild(this.post_icon_container_el, this.post_like_icon_el);

    this.post_more_text_el = goog.dom.createDom("div", "post_more_text");
    this.post_more_text_el.innerHTML = "MORE";
    goog.dom.appendChild(this.post_bottom_el, this.post_more_text_el);
    /* end of guanlun's code and unstability */

    this.content_el = goog.dom.createDom('div', 'post_content');
    if (this.text_content == null) { this.innerHTML = '[Currently editing]'; }
    // if (this.title && this.title.length) { this.content_el.innerHTML = '<center><b>'+this.title+'</b></center>'; }
    // this.content_el.innerHTML += postile.parseBBcode(this.text_content);
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

postile.view.post_in_board.Post.prototype.submitEdit = function(to_submit) {
    var instance = this;
    var original_title = instance.title;
    var original_value = instance.text_content;
    if (postile.string.empty(to_submit.content)) { 
        var the_id = instance.id;
        if (confirm("Leaving a post blank will effectively delete this post. Confirm to proceed?")) {
            instance.board.removePost(instance.id);
            instance.board.disableMovingCanvas = false;
            postile.ajax(['post','delete'], { post_id: the_id });
        }
        return;
    }
    instance.board.disableMovingCanvas = false;
    if (to_submit.title == original_title && to_submit.content == original_value) { instance.render(); return; } //no change
    var submit_waiting = new postile.toast.Toast(0, "Please wait... We're submitting... Be ready for 36s.");
    instance.disable();
    postile.ajax(['post','submit_change'], to_submit, function(data) {
        instance.render(data.message);
        submit_waiting.abort();
        var revert_waiting = new postile.toast.Toast(5, "Changes made. [Revert changes].", [function(){ 
            var answer = confirm("Are you sure you'd like to revert? You cannot redo once you revert.");
            if (answer) {
                instance.disable();
                var revert_submit_waiting = new postile.toast.Toast(0, "Please wait... We're submitting reversion... Be ready for 36s.");
                revert_waiting.abort();
                postile.ajax(['post','submit_change'], { post_id: data.message.id, content: original_value, title: original_title }, function(data) {
                    revert_submit_waiting.abort();
                    instance.render(data.message);
                });
            }
        }]);
    });
}

postile.view.post_in_board.Post.prototype.edit = function() {
    var instance = this;
    var start_waiting = new postile.toast.Toast(0, "Please wait... We're starting editing... Be ready for 36s.");
    this.disable();
    postile.ajax(['post','start_edit'], { post_id: this.id }, function(data) {
        var title = new goog.ui.LabelInput('Title (optional)');
        goog.dom.removeChildren(instance.wrap_el);
        title.render(instance.wrap_el);
        var y_editor = new postile.WYSIWYF.Editor(instance.wrap_el, postile.parseBBcode(instance.text_content));
        goog.dom.classes.add(title.getElement(), 'edit_title');
        if (instance.title && instance.title.length) { title.setValue(instance.title); }
        y_editor.container.style.height = instance.board.heightTo(instance.span_y) - 27 + 'px';
        instance.board.disableMovingCanvas = true; //disable moving
        instance.enable();
        start_waiting.abort();
        var blurHandler = function() {
            instance.blur_timeout = setTimeout(function(){ 
                instance.board.mask.style.display = 'none'; //close mask, if any
                instance.submitEdit({ post_id: instance.id, content: y_editor.getBbCode(), title: title.getValue() });}, 400);
        };
        var focusHandler = function() {
            clearTimeout(instance.blur_timeout);
        };
        goog.events.listen(y_editor.ifmDocument.body, goog.events.EventType.BLUR, blurHandler);
        goog.events.listen(title.getElement(), goog.events.EventType.BLUR, blurHandler);
        goog.events.listen(y_editor.ifmDocument.body, goog.events.EventType.FOCUS, focusHandler);
        goog.events.listen(title.getElement(), goog.events.EventType.FOCUS, focusHandler);
        y_editor.ifmDocument.body.focus();
    });
}
