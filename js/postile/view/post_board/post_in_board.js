goog.provide('postile.view.post_in_board');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('postile.dom');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.dom.classes');
goog.require('postile.toast');
goog.require('postile.ui');
goog.require('goog.ui.LabelInput');
goog.require('postile.i18n');
goog.require('postile.string');
goog.require('goog.events.KeyHandler');
goog.require('postile.WYSIWYF');
goog.require('postile.debbcode');
goog.require('postile.fx.effects');

postile.view.post_in_board.Post = function(object, board) {
    this.board = board;
    this.blur_timeout = null;
    this.disabled = false;
    this.render(object, true);
}

postile.view.post_in_board.Post.prototype.render = function(object, animation) { //animation is usually ommited (false by default)
    if (this.disabled) { return; }
    var button;
    var instance = this;
    if (object) { goog.object.extend(this, object); }
    this.post.coord_x_end = this.post.coord_x + this.post.span_x; //precalculate this two so that future intersect test will be faster
    this.post.coord_y_end = this.post.coord_y + this.post.span_y;
    if (this.wrap_el) { goog.dom.removeNode(this.wrap_el); } //remove original element
    this.wrap_el = goog.dom.createDom('div', 'post_wrap');
    this.wrap_el.rel_data = this;
    this.container_el = goog.dom.createDom('div', 'post_container');
    goog.dom.appendChild(this.wrap_el, this.container_el);
    goog.dom.appendChild(this.board.canvas, this.wrap_el);
    this.wrap_el.style.left = this.board.xPosTo(this.post.coord_x) + 'px';
    this.wrap_el.style.top = this.board.yPosTo(this.post.coord_y) + 'px';
    this.wrap_el.style.width = this.board.widthTo(this.post.span_x) + 'px';
    this.wrap_el.style.height = this.board.heightTo(this.post.span_y) + 'px';

    this.post_top_el = goog.dom.createDom("div", "post_top");
    goog.dom.appendChild(this.container_el, this.post_top_el);
    this.post_title_el = goog.dom.createDom("span", "post_title");
    this.post_title_el.innerHTML = this.post.title;
    goog.dom.appendChild(this.post_top_el, this.post_title_el);

    this.post_author_el = goog.dom.createDom("span", "post_author");
    this.post_author_el.innerHTML = this.username;
    goog.dom.appendChild(this.post_top_el, this.post_author_el);

    // username clicked, should display user profile
    goog.events.listen(this.post_author_el, goog.events.EventType.CLICK, function(e) {
        var id = 1; // temporary hack
        profileView = new postile.view.profile.ProfileView();
        profileView.open();
    }.bind(this));

    this.post_content_el = goog.dom.createDom("div", "post_content");
    this.post_content_el.innerHTML = postile.parseBBcode(this.post.text_content);
    goog.dom.appendChild(this.container_el, this.post_content_el);

    this.post_bottom_el = goog.dom.createDom("div", "post_bottom");
    goog.dom.appendChild(this.container_el, this.post_bottom_el);

    this.post_icon_container_el = goog.dom.createDom("div", "post_icon_container");
    goog.dom.appendChild(this.post_bottom_el, this.post_icon_container_el);

    var addIcon = function(name) {
        var icon = goog.dom.createDom("div", "post_icon post_"+name+"_icon");
        goog.dom.appendChild(instance.post_icon_container_el, icon);
        return icon;
    }
    
    addIcon("like"); addIcon("share"); addIcon("link"); 
    
    goog.events.listen(addIcon("comment"), goog.events.EventType.CLICK, function() { instance.inline_comments_block = new postile.view.post_in_board.InlineCommentsBlock(instance); });
    
    if (this.post.user_id == localStorage.postile_user_id) { //created by current user
        goog.events.listen(addIcon("edit"), goog.events.EventType.CLICK, function() { instance.edit(); });
        goog.events.listen(addIcon("delete"), goog.events.EventType.CLICK, function() { instance.remove(); });
    }

    if (animation) {
        postile.fx.effects.resizeIn(this.wrap_el);
    }  
}

postile.view.post_in_board.Post.prototype.disable = function() {
    this.disabled = true;
    postile.ui.startLoading(this.wrap_el);
}

postile.view.post_in_board.Post.prototype.enable = function() {
    this.disabled = false;
    postile.ui.stopLoading(this.wrap_el);
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

postile.view.post_in_board.Post.prototype.remove = function() {
    var instance = this;
    if (window.confirm('Sure to delete?')) {
        postile.ajax(['post','delete'], { post_id: this.post.id }, function(data) {
            new postile.toast.Toast(5, "The post is successfully deleted. Please refresh.");
            instance.removeFromBoard();
        });
    }
}

postile.view.post_in_board.Post.prototype.removeFromBoard = function() {
    goog.dom.removeNode(this.wrap_el);
    delete this.board.currentPosts[this.id];
}

postile.view.post_in_board.Post.prototype.edit = function() {
    var instance = this;
    var start_waiting = new postile.toast.Toast(0, "Please wait... We're starting editing... Be ready for 36s.");
    this.disable();
    var go_editing = function() {
        //var title = new goog.ui.LabelInput(postile._('post_title_prompt'));
        //goog.dom.removeChildren(instance.container_el);
        //title.render(instance.container_el);
        instance.post_title_el.contentEditable = true;
        goog.dom.classes.add(instance.post_title_el, 'selectable');
        //hide the original bottom bar
        goog.dom.removeChildren(instance.post_icon_container_el);
        var y_editor = new postile.WYSIWYF.Editor(instance.post_content_el, instance.post_icon_container_el);
        goog.dom.classes.add(instance.post_content_el, 'selectable');
        instance.board.disableMovingCanvas = true; //disable moving
        instance.enable();
        start_waiting.abort();
        var blurHandler = function() {
            instance.blur_timeout = setTimeout(function(){ 
                //instance.board.mask.style.display = 'none'; //close mask, if any
                instance.submitEdit({ post_id: instance.post.id, content: y_editor.getBbCode(), title: instance.post_title_el.innerHTML });}, 400);
        };
        var focusHandler = function() {
            clearTimeout(instance.blur_timeout);
        };
        goog.events.listen(y_editor.editor_el, goog.events.EventType.BLUR, blurHandler);
        goog.events.listen(instance.post_title_el, goog.events.EventType.BLUR, blurHandler);
        goog.events.listen(y_editor.editor_el, goog.events.EventType.FOCUS, focusHandler);
        goog.events.listen(instance.post_title_el, goog.events.EventType.FOCUS, focusHandler);
        y_editor.editor_el.focus();
    }
    postile.ajax(['post','start_edit'], { post_id: this.post.id }, go_editing);
}

postile.view.post_in_board.InlineCommentsBlock = function(postObj) {
    var instance = this;
    var tmp_el;
    postile.view.TipView.call(this);
    goog.dom.classes.add(this.container, "inl_comment-wrapper");
    goog.dom.appendChild(this.container, goog.dom.createDom("div", "input_up"));
    this.text_input = goog.dom.createDom("div", "input_main selectable");
    goog.dom.appendChild(this.container, this.text_input);
    var text_input_init = function() {
        instance.text_input.innerHTML = postile._('inline_comment_prompt');
        goog.dom.classes.add(instance.text_input, 'inactive');
    }
    text_input_init();
    goog.events.listen(new goog.events.KeyHandler(this.text_input), goog.events.KeyHandler.EventType.KEY, function(e) {
        if (instance.text_input.innerHTML == postile._('inline_comment_prompt')) {
            instance.text_input.innerHTML = '';
            goog.dom.classes.remove(instance.text_input, 'inactive');
        } else if (e.keyCode == goog.events.KeyCodes.ENTER) {
            postile.ajax(['post','inline_comment'], { post_id: postObj.post.id, content: instance.text_input.innerHTML }, function(data) {
                if (data.status == postile.ajax.status.OK) {
                    postile.fx.effects.verticalExpand((new postile.view.post_in_board.InlineComment(instance, data.message)).comment_container);
                    postile.ui.stopLoading(instance.text_input);
                    text_input_init();
                }
            });
            postile.ui.startLoading(instance.text_input);
        }
    });
    goog.events.listen(this.text_input, goog.events.EventType.BLUR, function(){
        if (goog.string.trim(postile.string.strip_tags(instance.text_input.innerHTML)) == '') {
            text_input_init();
        }
    });
    this.text_input.contentEditable = "true";
    tmp_el = goog.dom.createDom("div", "input_low");
    goog.dom.appendChild(this.container, tmp_el);
    goog.dom.appendChild(tmp_el, goog.dom.createDom("div", "nav_up"));
    goog.dom.appendChild(tmp_el, goog.dom.createDom("div", "nav_down"));
    this.comments_container = goog.dom.createDom("div", "inl_comment");
    goog.dom.appendChild(this.container, this.comments_container);

    postile.ajax(['post','get_inline_comments'], { post_id: postObj.post.id }, function(data) {
        for (var i in data.message) { 
            new postile.view.post_in_board.InlineComment(instance, data.message[i]); 
        }
        instance.open(postile.dom.getDescendantByClass(postObj.container_el, 'post_comment_icon'), postObj.wrap_el);
        instance.container.style.left = '18px';
        instance.container.style.top = '-12px'; //magic number based on 目测       
        postObj.wrap_el.style.zIndex = (++postObj.board.maxZIndex);
    });
}

goog.inherits(postile.view.post_in_board.InlineCommentsBlock, postile.view.TipView);

/*return the container element*/
postile.view.post_in_board.InlineComment = function(icb, single_comment_data) {
    this.comment_container = goog.dom.createDom("div", "past_comment");
    var tmp_el;
    tmp_el = goog.dom.createDom("p", "name");
    tmp_el.innerHTML = single_comment_data.username + ' Says: ';

    goog.dom.appendChild(this.comment_container, tmp_el);
    tmp_el = goog.dom.createDom("p", "time");
    tmp_el.innerHTML = postile.date(single_comment_data.inline_comment.created_at, 'inline');
    goog.dom.appendChild(this.comment_container, tmp_el);
    tmp_el = goog.dom.createDom("p", "comment");
    tmp_el.innerHTML = (single_comment_data.reply_to ? '<span class="main-color">' + single_comment_data.reply_to + '</span>' : '') + single_comment_data.inline_comment.content;
    goog.dom.appendChild(this.comment_container, tmp_el);
    goog.dom.appendChild(icb.comments_container, this.comment_container);
}
