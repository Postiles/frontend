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
goog.require('postile.view.At');
goog.require('postile.fx.effects');
goog.require('postile.view.post');

postile.view.post_in_board.Post = function(data, board) {
    this.board = board;
    this.blur_timeout = null;
    this.disabled = false;
    this.in_edit = false;
    this.wrap_el = goog.dom.createDom('div', 'post_wrap');
    goog.dom.appendChild(this.board.canvas, this.wrap_el);
    this.render(data, true);
}

postile.view.post_in_board.Post.prototype.render = function(data, animation) { //animation is usually ommited (false by default)
    if (this.disabled) {
        return;
    }

    var instance = this;

    if (data) {
        goog.object.extend(this, data);
    }

    this.post.coord_x_end = this.post.pos_x + this.post.span_x; //precalculate this two so that future intersect test will be faster
    this.post.coord_y_end = this.post.pos_y + this.post.span_y;

    this.wrap_el.style.left = this.board.xPosTo(this.post.pos_x) + 'px';
    this.wrap_el.style.top = this.board.yPosTo(this.post.pos_y) + 'px';
    this.wrap_el.style.width = this.board.widthTo(this.post.span_x) + 'px';
    this.wrap_el.style.height = this.board.heightTo(this.post.span_y) + 'px';

    if (this.container_el) {
        goog.dom.removeNode(this.container_el);
    }

    this.container_el = goog.dom.createDom('div', 'post_container');
    goog.dom.appendChild(this.wrap_el, this.container_el);
    
    goog.events.listen(this.container_el, goog.events.EventType.DBLCLICK, function(e) {
        e.stopPropagation(); // prevent displaying mask by stopping event propagation
    });

    /* set top parts */
    this.post_top_el = goog.dom.createDom("div", "post_top");
    goog.dom.appendChild(this.container_el, this.post_top_el);

    this.post_title_el = goog.dom.createDom("div", "post_title");
    goog.dom.appendChild(this.post_top_el, this.post_title_el);
    this.post_title_el.innerHTML = this.post.title;

    this.wrap_el.rel_data = this;

    // post title clicked, should display post expanded
    this.post_author_el = goog.dom.createDom("span", "post_author");

    // no title, no margin left for author
    if (!this.post.title) {
        this.post_author_el.style.marginLeft = '0px';
    }

    // listen for title click event, open post expand view
    this.post_expand_listener = new postile.events.EventHandler(this.post_title_el, 
            goog.events.EventType.CLICK, function(e) {
        var postExpand = new postile.view.post.PostExpand(instance.post);
    });
    this.post_expand_listener.listen();

    // author display
    goog.dom.appendChild(this.post_top_el, this.post_author_el);

    postile.data_manager.getUserData(this.post.creator_id, function(data) {
        this.creator = data;
        this.post_author_el.innerHTML = this.creator.username;
    }.bind(this));

    // username clicked, should display user profile
    this.author_profile_display_listener = new postile.events.EventHandler(this.post_author_el,
            goog.events.EventType.CLICK, function(e) {
        var profileView = new postile.view.profile.ProfileView(instance.creator.id);
    });
    this.author_profile_display_listener.listen();

    // display proper number of characters for title
    this.set_max_displayable_top();

    /* set content parts */
    this.post_content_el = goog.dom.createDom("div", "post_content");
    goog.dom.appendChild(this.container_el, this.post_content_el);
    this.post_content_el.innerHTML = postile.parseBBcode(this.post.content);

    // display proper number of characters for content
    this.set_max_displayable_content();

    // post bottom
    this.post_bottom_el = goog.dom.createDom("div", "post_bottom");
    goog.dom.appendChild(this.container_el, this.post_bottom_el);

    // icon container
    this.post_icon_container_el = goog.dom.createDom("div", "post_icon_container");
    goog.dom.appendChild(this.post_bottom_el, this.post_icon_container_el);
   
    if (this.post.creator_id == localStorage.postile_user_id) { //created by current user, can edit
        goog.events.listen(this.post_content_el, goog.events.EventType.CLICK, function() {
            instance.edit();
        });
    }

    // this.extra_button_view_init();

    this.post_icon_container_init();

    this.comment_preview_init();

    if (animation) {
        postile.fx.effects.resizeIn(this.wrap_el);
    }  
}

/**
 * initialize the drop-down menu that contains extra buttons
 */
postile.view.post_in_board.Post.prototype.extra_button_view_init = function() {
    this.extra_button_container_el = goog.dom.createDom('div', 'extra-button-container');
    goog.dom.appendChild(this.wrap_el, this.extra_button_container_el);

    this.extra_comment_button = goog.dom.createDom('span', 'extra-button extra-comment-button');
    this.extra_comment_button.innerHTML = 'comment';
    goog.dom.appendChild(this.extra_button_container_el, this.extra_comment_button);

    this.extra_share_button = goog.dom.createDom('span', 'extra-button extra-share-button');
    this.extra_share_button.innerHTML = 'share';
    goog.dom.appendChild(this.extra_button_container_el, this.extra_share_button);

    this.extra_delete_button = goog.dom.createDom('span', 'extra-button extra-delete-button');
    this.extra_delete_button.innerHTML = 'delete';
    goog.dom.appendChild(this.extra_button_container_el, this.extra_delete_button);
}

postile.view.post_in_board.Post.prototype.set_max_displayable_top = function() {
    // get width of the post
    var post_width = this.container_el.offsetWidth;
    var post_author_width = this.post_author_el.offsetWidth;

    // post_top's width should be the same as the post
    this.post_top_el.style.width = post_width + 'px';

    var maxWidth = post_width - post_author_width - 20;
    var title_text_width = this.post_title_el.offsetWidth;

    this.title_max_width = title_text_width;

    var content = this.post_title_el.innerHTML;
    if (!content) { // we don't care about empty title here
        return;
    }

    var currLength = content.length;
    var orig_text = '';

    if (title_text_width <= maxWidth) { // title is short, no need to proceed
        return;
    }

    for (var i = 0; i < 12; i++) {
        title_text_width = this.post_title_el.offsetWidth;
        if (title_text_width > maxWidth) {
            currLength = currLength / 2;
        } else if (title_text_width < maxWidth - 25) {
            currLength = currLength / 2 * 3;
        } else {
            break;
        }
        this.post_title_el.innerHTML = content.substring(0, currLength);

        if (this.post_title_el.innerHTML == orig_text) {
            break;
        }
    }

    content = this.post_title_el.innerHTML;

    if (title_text_width > maxWidth) { // still too long after 12 iterations, highly impossible
        this.post_title_el.innerHTML = content.substring(0, 10) + '...';
    }

    this.post_title_el.innerHTML = content.substring(0, content.length - 3) + '...';
}

postile.view.post_in_board.Post.prototype.set_max_displayable_content = function() {
    var maxHeight = this.container_el.offsetHeight - 40;
    var content_text_height = this.post_content_el.offsetHeight;
    var lineHeight = 16;

    var content = this.post_content_el.innerHTML;
    var currLength = content.length; // string length
    var orig_text = '';

    if (content_text_height <= maxHeight) { // content is short, no need to proceed
        return;
    }

    for (var i = 0; i < 30; i++) { // limit number of iterations to 50
        orig_text = this.post_content_el.innerHTML;
        content_text_height = this.post_content_el.offsetHeight;

        if (content_text_height > maxHeight) { // too long
            currLength = currLength / 2;
        } else if (content_text_height < maxHeight - lineHeight) { // too short
            currLength = currLength / 2 * 3;
        } else { // just right
            break;
        }
        this.post_content_el.innerHTML = content.substring(0, currLength);

        if (this.post_content_el.innerHTML == orig_text) { // no change
            break;
        }
    }

    content = this.post_content_el.innerHTML;

    if (content_text_height > maxHeight) { // still too long after 30 iterations, highly impossible
        this.content_el.innerHTML = content.substring(0, 20) + '...';
        return;
    }

    this.post_content_el.innerHTML = content.substring(0, content.length - 3) + '...';
}

postile.view.post_in_board.Post.prototype.post_icon_container_init = function() {
    var instance = this;
    
    if (!instance.likes) { // likes not defined
        instance.likes = [ ];
    }
    
    var addIcon = function(name) {
        var icon = goog.dom.createDom("div", "post_icon post_"+name+"_icon");
        goog.dom.appendChild(instance.post_icon_container_el, icon);
        return icon;
    }
    
    // get the ids of all the users that likes this post
    instance.liked_user = instance.likes.map(function(like) {
        return like.user_id;
    });

    // how many likes are there
    instance.like_count = instance.likes.length;

    instance.likeButton_el = addIcon('like');

    if (instance.liked_user.indexOf(parseInt(localStorage.postile_user_id)) != -1) { // already liked
        goog.dom.classes.remove(instance.likeButton_el, 'post_like_icon');
        goog.dom.classes.add(instance.likeButton_el, 'post_liked_icon');
    } else {
        goog.events.listen(instance.likeButton_el, goog.events.EventType.CLICK, function() {
            var like_icon = instance.likeButton_el;
            var new_like_icon = goog.dom.createDom('div', 'post_liked_icon');
            var new_counts = goog.dom.createDom('div', 'post_like_new_count');

            new_like_icon.style.width = '13px';
            new_like_icon.style.height = '13px';
            new_like_icon.style.position = 'absolute'; //so that "clip" can make effect
            new_counts.innerHTML = ++instance.like_count;

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
                instance.likes_count_el.innerHTML = instance.like_count;
            });

            postile.ajax([ 'post', 'like' ], { post_id: instance.post.id }, function(data) {
                // seems nothing to do
            });
        });
    }
    
    this.likes_count_el = goog.dom.createDom("div", "post_like_count");
    goog.dom.appendChild(instance.post_icon_container_el, this.likes_count_el);

    if (this.likes) {
        this.likes_count_el.innerHTML = instance.like_count;
    }

    // addIcon("share");
    
    goog.events.listen(addIcon("comment"), goog.events.EventType.CLICK, function() {
        instance.inline_comments_block = new postile.view.post_in_board.InlineCommentsBlock(instance);
    });
}

postile.view.post_in_board.Post.prototype.comment_preview_init = function() {
    // comment preview
    this.comment_preview_el = goog.dom.createDom('div', 'comment_preview');
    goog.dom.appendChild(this.post_bottom_el, this.comment_preview_el);

    // author
    this.comment_preview_author_el = goog.dom.createDom('span', 'comment_preview_author');
    goog.dom.appendChild(this.comment_preview_el, this.comment_preview_author_el);

    // middle: displays ": " after username
    this.comment_preview_midlle_el = goog.dom.createDom('span', 'comment_preview_midlle');
    goog.dom.appendChild(this.comment_preview_el, this.comment_preview_midlle_el);

    // author
    this.comment_preview_author_el = goog.dom.createDom('span', 'comment_preview_author');
    goog.dom.appendChild(this.comment_preview_el, this.comment_preview_author_el);

    // middle: displays ": " after username
    this.comment_preview_midlle_el = goog.dom.createDom('span', 'comment_preview_midlle');
    goog.dom.appendChild(this.comment_preview_el, this.comment_preview_midlle_el);

    // content
    this.comment_preview_content_el = goog.dom.createDom('span', 'comment_preview_content');
    goog.dom.appendChild(this.comment_preview_el, this.comment_preview_content_el);

    if (this.inline_comments && this.inline_comments.length > 0) { // at least one comment
        goog.dom.appendChild(this.post_bottom_el, this.comment_preview_el);

        this.comment_preview_midlle_el.innerHTML = ': ';

        var index = this.inline_comments.length - 1; // display latest comment

        postile.data_manager.getUserData(
                this.inline_comments[index].inline_comment.creator_id, function(data) {
                    this.comment_preview_author_el.innerHTML = data.username;
        }.bind(this));

        var content = this.inline_comments[index].inline_comment.content;

        this.comment_preview_content_el.innerHTML = content;
        this.set_max_displayable_comment_preview(content);
    }
}

postile.view.post_in_board.Post.prototype.set_max_displayable_comment_preview = function(content) {
    var maxWidth = this.container_el.offsetWidth - this.post_icon_container_el.offsetWidth - 20;
    var realWidth = this.comment_preview_el.offsetWidth;

    if (realWidth < maxWidth) { // no need to proceed
        return;
    }

    var currLength = content.length;
    var orig_text = '';

    for (var i = 0; i < 10; i++) {
        realWidth = this.comment_preview_el.offsetWidth;
        if (realWidth > maxWidth) {
            currLength = currLength / 2;
        } else if (realWidth < maxWidth - 25) {
            currLength = currLength / 2 * 3;
        } else {
            break;
        }
        this.comment_preview_content_el.innerHTML = content.substring(0, currLength);

        if (this.comment_preview_content_el.innerHTML == orig_text) {
            break;
        }
    }

    content = this.comment_preview_content_el.innerHTML;

    if (realWidth > maxWidth) { // still too long after 10 iterations, highly impossible
        this.post_title_el.innerHTML = content.substring(0, 10) + '...';
    }

    this.comment_preview_content_el.innerHTML = content.substring(0, content.length - 3) + '...';
}

postile.view.post_in_board.Post.prototype.resetCommentPreview = function(data) {
    var instance = this;

    var el = this.comment_preview_el;

    var opacity = 1.0;

    var fadeout = setInterval(function() {
        opacity -= 0.1;
        el.style.opacity = opacity;
    }, 30);

    var fadein;
    setTimeout(function() {
        clearInterval(fadeout);

        postile.data_manager.getUserData(data.inline_comment.creator_id, function(userData) {
            instance.comment_preview_author_el.innerHTML = userData.username;
            instance.comment_preview_midlle_el.innerHTML = ': '; // in case there was no comment before
            instance.comment_preview_content_el.innerHTML = data.inline_comment.content;
            instance.set_max_displayable_comment_preview(data.inline_comment.content);

            fadein = setInterval(function() {
                opacity += 0.1;
                el.style.opacity = opacity;
            }, 30);
        });
    }, 300);

    setTimeout(function() {
        clearInterval(fadein);
    }, 600);
}

/**
 * Disable the post and attach the JuHua animation, does nothing if called
 * more than once without calling .enable() in between.
 */
postile.view.post_in_board.Post.prototype.disable = function() {
    if (this.disabled) {
        return;
    }
    this.disabled = true;
    postile.ui.startLoading(this.wrap_el);
}

/**
 * Enable the post and remove the JuHua animation, does nothing if called
 * more than once without calling .disable() in between.
 */
postile.view.post_in_board.Post.prototype.enable = function() {
    if (!this.disabled) {
        return;
    }
    this.disabled = false;
    postile.ui.stopLoading(this.wrap_el);
}

postile.view.post_in_board.Post.prototype.submitEdit = function(to_submit) {
    var instance = this;
    var original_title = instance.post.title;
    var original_value = instance.post.content;
    var lels = instance.board.picker.all_lkd_el;
    for (i in lels) {
        goog.dom.removeNode(lels[i]);
    }
    lels = [];
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

    if (to_submit.title == original_title && to_submit.content == original_value) { // no change
        instance.render(); return;
    }

    var submit_waiting = new postile.toast.Toast(0, "Please wait... We're submitting... Be ready for 36s.");
    instance.disable();

    postile.ajax(['post','submit_change'], to_submit, function(data) {
        instance.enable();
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
                    instance.enable();
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
        console.log('deleted');
    });

    delete this.board.currentPosts[this.id];
}

postile.view.post_in_board.Post.prototype.edit = function(isNew) {
    if (this.in_edit) {
        return;
    }

    /* started handles whether the text placeholder should be cleared after keypress */
    var started = true;
    if (isNew) {
        started = false;
    }

    var instance = this;
    this.disable();

    postile.ajax(['post','start_edit'], { post_id: this.post.id }, function() {
        instance.in_edit = true;
        instance.post_expand_listener.unlisten();
        instance.author_profile_display_listener.unlisten();

        // reset title and content in case they are chomped
        instance.post_title_el.innerHTML = instance.post.title;
        instance.post_content_el.innerHTML = instance.post.content;

        goog.dom.classes.add(instance.post_title_el, 'selectable');
        goog.dom.classes.add(instance.post_content_el, 'selectable');

        // set title and text size for editing
        instance.post_title_el.style.width = instance.container_el.offsetWidth - 10 + 'px';
        instance.post_content_el.style.height = instance.container_el.offsetHeight - 40 + 'px';

        instance.post_content_el.style.overflowY = 'scroll';

        // delete icon on the top right corner
        var delete_icon = goog.dom.createDom('div', 'post_remove_icon');
        goog.dom.appendChild(instance.container_el, delete_icon);
        goog.events.listen(delete_icon, goog.events.EventType.CLICK, function() {
            new postile.view.confirm_delete.ConfirmDelete(instance).open(this);
        });

        instance.post_author_el.style.display = 'none'; // hide author name
        instance.comment_preview_el.style.display = 'none' // hide comment preview

        // set placeholders for title and content views
        postile.ui.makeLabeledInput(instance.post_content_el, '(ctrl + enter to submit)', 
                'half_opaque');

        postile.ui.makeLabeledInput(instance.post_title_el, postile._('post_title_prompt'), 
                'half_opaque', function() {
            instance.post_content_el.focus(); // when enter is pressd, change focus to content
        });

        //hide the original bottom bar
        goog.dom.removeChildren(instance.post_icon_container_el);
        var y_editor = new postile.WYSIWYF.Editor(instance.post_content_el, instance.post_icon_container_el, instance);
        instance.board.disableMovingCanvas = true; //disable moving
        instance.enable();

        var contentKeydownHandler = new postile.events.EventHandler(instance.post_content_el,
                goog.events.EventType.KEYDOWN, function(e) {
            // when user presses 'ctrl + enter', submit edit
            if (e.keyCode == 13 && e.ctrlKey) {
                instance.submitEdit({ post_id: instance.post.id, content: y_editor.getBbCode(), title: instance.post_title_el.innerHTML ==  postile._('post_title_prompt') ? '' : instance.post_title_el.innerHTML });

                contentKeydownHandler.unlisten();
                postHandler.unlisten();
                instance.in_edit = false;

                return false;
            } else if (!started) { // not started edit yet
                instance.post_content_el.innerHTML = '';
                started = true;
            }
        });

        var postHandler = new postile.events.EventHandler(instance.container_el, goog.events.EventType.CLICK, function(evt){
            evt.stopPropagation();
        });

        contentKeydownHandler.listen();
        postHandler.listen();

        if (isNew) { // new post, focus on title
            instance.post_title_el.focus();
        } else {
            y_editor.editor_el.focus();
        }
    });
}

postile.view.post_in_board.resolveAtPerson = function(displayText) { //displayed -> shown
    return displayText.replace(/<span[^<>]*at\-user="(\d+)"[^<>]*> @[^<]+ <\/span>/g, ' @$1 ');
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
            content: postile.string.stripString(postile.view.post_in_board.resolveAtPerson(instance.text_input.innerHTML)) }, function(data) {
                if (data.status == postile.ajax.status.OK) {
                    postile.fx.effects.verticalExpand((new postile.view.post_in_board.InlineComment(instance, data.message)).comment_container);
                    postile.ui.stopLoading(instance.text_input);
                    instance.text_input.blur();
                }
            });
        postile.ui.startLoading(instance.text_input);
    });

    new postile.view.At(this.text_input);
    
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
        for (var i in data.message.inline_comments) { 
            new postile.view.post_in_board.InlineComment(instance, data.message.inline_comments[i]); 
        }
        instance.open(postile.dom.getDescendantByClass(postObj.container_el, 'post_comment_icon'), postObj.wrap_el);
        instance.container.style.left = '18px';
        instance.container.style.top = '-12px'; //magic number based on 目测
        // postObj.wrap_el.style.zIndex = (++postObj.board.maxZIndex);
    });
}

goog.inherits(postile.view.post_in_board.InlineCommentsBlock, postile.view.TipView);

/*return the container element*/
postile.view.post_in_board.InlineComment = function(icb, single_comment_data) {
    this.comment_container = goog.dom.createDom("div", "past_comment");
    var tmp_el;
    tmp_el = goog.dom.createDom("p", "name");

    postile.data_manager.getUserData(single_comment_data.inline_comment.creator_id, function(data) {
        tmp_el.innerHTML = data.username + ' says: ';
        goog.dom.appendChild(this.comment_container, tmp_el);

        tmp_el = goog.dom.createDom("p", "time");
        tmp_el.innerHTML = postile.date(single_comment_data.inline_comment.created_at, 'inline');
        goog.dom.appendChild(this.comment_container, tmp_el);

        tmp_el = goog.dom.createDom("p", "comment");
        tmp_el.innerHTML = single_comment_data.inline_comment.content.replace(/ @(\d+)/g, '<span class="at_person" at-person="$1">@[Username pending]</span>');

        var all_atp = postile.dom.getDescendantsByCondition(tmp_el, function(el) {
            return el.tagName && el.tagName.toUpperCase() == 'SPAN' && el.className == 'at_person';
        });

        for (var i in all_atp) {
            fetchUsername(all_atp[i]);
        }

        goog.dom.appendChild(this.comment_container, tmp_el);
        goog.dom.appendChild(icb.comments_container, this.comment_container);

    }.bind(this));
}

fetchUsername = function(el) {
    postile.data_manager.getUserData(el.getAttribute('at-person'), function(data) {
        el.innerHTML = '@' + data.first_name + ' ' + data.last_name;
    });
}
