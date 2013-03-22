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
goog.require('postile.fx');
goog.require('postile.fx.effects');
goog.require('postile.view.post');

postile.view.post_in_board.Post = function(object, board) {
    this.board = board;
    this.blur_timeout = null;
    this.disabled = false;
    this.wrap_el = goog.dom.createDom('div', 'post_wrap');
    goog.dom.appendChild(this.board.canvas, this.wrap_el);
    this.render(object, true);
}

postile.view.post_in_board.Post.prototype.render = function(object, animation) { //animation is usually ommited (false by default)
    if (this.disabled) { return; }
    var button;
    var instance = this;
    if (object) { goog.object.extend(this, object); }
    this.post.coord_x_end = this.post.pos_x + this.post.span_x; //precalculate this two so that future intersect test will be faster
    this.post.coord_y_end = this.post.pos_y + this.post.span_y;
    this.wrap_el.style.left = this.board.xPosTo(this.post.pos_x) + 'px';
    this.wrap_el.style.top = this.board.yPosTo(this.post.pos_y) + 'px';
    this.wrap_el.style.width = this.board.widthTo(this.post.span_x) + 'px';
    this.wrap_el.style.height = this.board.heightTo(this.post.span_y) + 'px';
    
    if(this.container_el) { goog.dom.removeNode(this.container_el); }
    this.container_el = goog.dom.createDom('div', 'post_container');
    this.post_top_el = goog.dom.createDom("div", "post_top");
    this.post_title_el = goog.dom.createDom("span", "post_title");
    this.wrap_el.rel_data = this;
    goog.dom.appendChild(this.wrap_el, this.container_el);
    goog.dom.appendChild(this.container_el, this.post_top_el);
    goog.dom.appendChild(this.post_top_el, this.post_title_el);

    // post title clicked, should display post expanded
    this.post_author_el = goog.dom.createDom("span", "post_author");
    this.post_expand_listener = new postile.events.EventHandler(this.post_title_el, goog.events.EventType.CLICK, function(e) {
        var postExpand = new postile.view.post.PostExpand(instance.post, instance.post.username);
    });

    this.post_expand_listener.listen();
    goog.dom.appendChild(this.post_top_el, this.post_author_el);

    // username clicked, should display user profile
    goog.events.listen(this.post_author_el, goog.events.EventType.CLICK, function(e) {
        var profileView = new postile.view.profile.ProfileView(this.creator.id);
    }.bind(this));    

    this.post_content_el = goog.dom.createDom("div", "post_content");
    goog.dom.appendChild(this.container_el, this.post_content_el);
    this.post_bottom_el = goog.dom.createDom("div", "post_bottom");
    goog.dom.appendChild(this.container_el, this.post_bottom_el);
    this.post_icon_container_el = goog.dom.createDom("div", "post_icon_container");
    goog.dom.appendChild(this.post_bottom_el, this.post_icon_container_el);
    
    this.post_title_el.innerHTML = postile.escapeString(this.post.title);
    if (!this.post.title) {
        this.post_author_el.style.marginLeft = '0px';
    }
    this.post_author_el.innerHTML = 'By ' + this.creator.username;
    this.post_content_el.innerHTML = postile.parseBBcode(this.post.content);
    this.post_icon_container_init();
    if (animation) {
        postile.fx.effects.resizeIn(this.wrap_el);
    }  
}

postile.view.post_in_board.Post.prototype.post_icon_container_init = function() {
    var instance = this;
    
    var addIcon = function(name) {
        var icon = goog.dom.createDom("div", "post_icon post_"+name+"_icon");
        goog.dom.appendChild(instance.post_icon_container_el, icon);
        return icon;
    }
    
    goog.events.listen(addIcon("like"), goog.events.EventType.CLICK, function() {
        var like_icon = this;
        var new_like_icon = goog.dom.createDom('div', 'post_liked_icon');
        var new_counts = goog.dom.createDom('div', 'post_like_new_count');
        new_like_icon.style.width = '13px';
        new_like_icon.style.height = '13px';
        new_like_icon.style.position = 'absolute'; //so taht "clip" can make effect
        new_counts.innerHTML = ++instance.post.likes_count;
        goog.dom.appendChild(like_icon, new_like_icon);
        goog.dom.appendChild(instance.likes_count_el, new_counts);
        new postile.fx.Animate(function(i){ 
            new_like_icon.style.clip = 'rect('+Math.round(13*(1-i))+'px 13px 13px 0px)';
            new_counts.style.top = - Math.round(13 * i) + 'px';
        }, 400, postile.fx.ease.cubic_ease_out, function() {
            goog.dom.classes.remove(like_icon, 'post_like_icon');
            goog.dom.classes.add(like_icon, 'post_liked_icon');
            goog.dom.removeNode(new_like_icon);
            goog.dom.removeNode(new_counts);
            instance.likes_count_el.innerHTML = instance.post.likes_count;
        });
    });
    
    this.likes_count_el = goog.dom.createDom("div", "post_like_count");
    goog.dom.appendChild(instance.post_icon_container_el, this.likes_count_el);
    this.likes_count_el.innerHTML = this.post.likes_count;
    
    addIcon("share");
    
    goog.events.listen(addIcon("comment"), goog.events.EventType.CLICK, function() { instance.inline_comments_block = new postile.view.post_in_board.InlineCommentsBlock(instance); });
    
    if (this.post.user_id == localStorage.postile_user_id) { //created by current user
        goog.events.listen(addIcon("edit"), goog.events.EventType.CLICK, function() { instance.edit(); });
        goog.events.listen(addIcon("delete"), goog.events.EventType.CLICK, function() { 
            new postile.view.confirm_delete.ConfirmDelete(instance).open(this);
        });
    }
}

postile.view.post_in_board.Post.prototype.disable = function() {
    if(this.disabled) { return; }
    this.disabled = true;
    postile.ui.startLoading(this.wrap_el);
}

postile.view.post_in_board.Post.prototype.enable = function() {
    if(!this.disabled) { return; }
    this.disabled = false;
    postile.ui.stopLoading(this.wrap_el);
}

postile.view.post_in_board.Post.prototype.submitEdit = function(to_submit) {
    var instance = this;
    var original_title = instance.post.title;
    var original_value = instance.post.text_content;
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
                postile.ajax(['post','submit_change'], { post_id: data.message.post.id, content: original_value, title: original_title }, function(data) {
                    revert_submit_waiting.abort();
                    instance.render(data.message);
                });
            }
        }]);
    });
}

postile.view.post_in_board.Post.prototype.removeFromBoard = function() {
    goog.dom.removeNode(this.wrap_el);

    /* guanlun hacks */
    postile.ajax([ 'post', 'delete' ], { post_id: this.post.id }, function(data) {
        console.log(data);
    });

    delete this.board.currentPosts[this.id];
}

postile.view.post_in_board.Post.prototype.edit = function() {
    var instance = this;
    var start_waiting = new postile.toast.Toast(0, "Please wait... We're starting editing... Be ready for 36s.");
    this.disable();
    var go_editing = function() {
        instance.post_expand_listener.unlisten();
        goog.dom.classes.add(instance.post_title_el, 'selectable');
        goog.dom.classes.add(instance.post_content_el, 'selectable');
        postile.ui.makeLabeledInput(instance.post_title_el, postile._('post_title_prompt'), 'half_opaque', function(){
            instance.post_content_el.focus();
        });
        //hide the original bottom bar
        goog.dom.removeChildren(instance.post_icon_container_el);
        var y_editor = new postile.WYSIWYF.Editor(instance.post_content_el, instance.post_icon_container_el, instance);
        instance.board.disableMovingCanvas = true; //disable moving
        instance.enable();
        start_waiting.abort();
        var blurHandler = function(e) {
            console.trace();
            instance.blur_timeout = setTimeout(function(){ 
                //instance.board.mask.style.display = 'none'; //close mask, if any
                instance.submitEdit({ post_id: instance.post.id, content: y_editor.getBbCode(), title: instance.post_title_el.innerHTML ==  postile._('post_title_prompt') ? '' : postile.string.stripString(instance.post_title_el.innerHTML) });}, 1200);
        };
        var focusHandler = function(e) {
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
    var tmp_el2;
    postile.view.TipView.call(this);
    goog.dom.classes.add(this.container, "inl_comment-wrapper");
    goog.dom.appendChild(this.container, goog.dom.createDom("div", "input_up"));
    this.text_input = goog.dom.createDom("div", "input_main selectable");
    goog.dom.appendChild(this.container, this.text_input);

    postile.ui.makeLabeledInput(this.text_input, postile._('inline_comment_prompt'), 'inactive', function() {
        postile.ajax(['inline_comment','new'], { post_id: postObj.post.id, 
                content: instance.text_input.innerHTML }, function(data) {
            if (data.status == postile.ajax.status.OK) {
                postile.fx.effects.verticalExpand((new postile.view.post_in_board.InlineComment(instance, data.message)).comment_container);
                postile.ui.stopLoading(instance.text_input);
                instance.text_input.blur();
            }
        });
        postile.ui.startLoading(instance.text_input);
    });
    
    this.text_input.contentEditable = "true";

    tmp_el = goog.dom.createDom("div", "input_low");
    goog.dom.appendChild(this.container, tmp_el);

    tmp_el2 = goog.dom.createDom("div", "nav_up");
    goog.dom.appendChild(tmp_el, tmp_el2);
    goog.dom.appendChild(tmp_el2, goog.dom.createDom("div", "arrow_up"));


    tmp_el2 = goog.dom.createDom("div", "nav_down");
    goog.dom.appendChild(tmp_el, tmp_el2);
    goog.dom.appendChild(tmp_el2, goog.dom.createDom("div", "arrow_down"));

    this.comments_container = goog.dom.createDom("div", "inl_comment");

    goog.dom.appendChild(this.container, this.comments_container);

    postile.ajax(['inline_comment','get_inline_comments'], { post_id: postObj.post.id }, function(data) {
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
    tmp_el.innerHTML = single_comment_data.creator.username + ' says: ';

    goog.dom.appendChild(this.comment_container, tmp_el);
    tmp_el = goog.dom.createDom("p", "time");
    tmp_el.innerHTML = postile.date(single_comment_data.inline_comment.created_at, 'inline');
    goog.dom.appendChild(this.comment_container, tmp_el);
    tmp_el = goog.dom.createDom("p", "comment");
    tmp_el.innerHTML = single_comment_data.inline_comment.content;
    goog.dom.appendChild(this.comment_container, tmp_el);
    goog.dom.appendChild(icb.comments_container, this.comment_container);
}
