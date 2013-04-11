goog.provide('postile.view.post_in_board');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.string');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.dom.classes');
goog.require('goog.ui.LabelInput');
goog.require('goog.events.KeyHandler');

goog.require('postile.i18n');
goog.require('postile.toast');
goog.require('postile.dom');
goog.require('postile.ui');
goog.require('postile.WYSIWYF');
goog.require('postile.debbcode');
goog.require('postile.fx');
goog.require('postile.view.At');
goog.require('postile.fx.effects');
goog.require('postile.view.post');

/**
 * A factory function that creates a post from JSON data retrieved from the server
 */
postile.view.post_in_board.createPostFromJSON = function(data, board) {
    if (data.post.image_url) { // PicturePost
        return new postile.view.post_in_board.PicturePost(data, board);
    } else if (data.post.video_link) { // VideoPost
        return new postile.view.post_in_board.VideoPost(data, board);
    } else {
        return new postile.view.post_in_board.TextPost(data, board);
    }
}

/**
 * abstract super class for all Posts
 */
postile.view.post_in_board.Post = function(data, board) {
    this.board = board;
    this.blur_timeout = null;
    this.disabled = false;
    this.in_edit = false;
    this.wrap_el = goog.dom.createDom('div', 'post_wrap');
    goog.dom.appendChild(this.board.canvas, this.wrap_el);

    postile.ui.load(this.wrap_el, postile.conf.staticResource([ '_post_in_board.html' ]));
}

/**
 * text post
 */
postile.view.post_in_board.TextPost = function(data, board) {
    goog.base(this, data, board);
    this.type = 'TextPost';

    this.render(data, true);
}

goog.inherits(postile.view.post_in_board.TextPost, postile.view.post_in_board.Post);

postile.view.post_in_board.TextPost.prototype.render = function(data, animation) {
    goog.base(this, 'render', data, animation);

    this.post_content_el.innerHTML = postile.parseBBcode(this.post.content);
    postile.bbcodePostProcess(this.post_content_el);

    // display proper number of characters for content
    this.set_max_displayable_content();
}

postile.view.post_in_board.TextPost.prototype.edit = function() {
    goog.base(this, 'edit');

    postile.ajax(['post','start_edit'], { post_id: this.post.id }, function() {
        this.change_view_for_edit();

        this.post_content_el.innerHTML = postile.parseBBcode(this.post.content);
        postile.bbcodePostProcess(this.post_content_el);

        goog.dom.classes.add(this.post_content_el, 'selectable');

        this.post_content_el.style.overflowY = 'auto';

        // set placeholders for title and content views
        postile.ui.makeLabeledInput(this.post_title_el, postile._('post_title_prompt'),
                'half_opaque', function() {
            this.post_content_el.focus(); // when enter is pressd, change focus to content
        }.bind(this));

        postile.ui.makeLabeledInput(this.post_content_el, '(ctrl + enter to submit)', 'half_opaque');

        //hide the original bottom bar
        goog.dom.removeChildren(this.post_middle_container_el);
        var y_editor = new postile.WYSIWYF.Editor(this.post_content_el, this.post_middle_container_el, this);
        this.board.disableMovingCanvas = true; //disable moving
        this.enable();

        var contentKeydownHandler = new postile.events.EventHandler(this.post_content_el,
            goog.events.EventType.KEYDOWN, function(e) {
            // when user presses 'ctrl + enter', submit edit
            if (e.keyCode == 13 && e.ctrlKey) {
                this.submitEdit({ post_id: this.post.id, content: y_editor.getBbCode(),
                                    title: this.post_title_el.innerHTML ==  postile._('post_title_prompt') ? '' : this.post_title_el.innerHTML }, function() { this.in_edit = false; });

                contentKeydownHandler.unlisten();
                return false;
            }
        }.bind(this));

        contentKeydownHandler.listen();
        y_editor.editor_el.focus();
    }.bind(this));
}

/**
 * picture post
 */
postile.view.post_in_board.PicturePost = function(data, board) {
    goog.base(this, data, board);
    this.type = 'VideoPost';

    this.render(data, true);
}

goog.inherits(postile.view.post_in_board.PicturePost, postile.view.post_in_board.Post);

postile.view.post_in_board.PicturePost.prototype.render = function(data, animation) {
    goog.base(this, 'render', data, animation);

    goog.dom.classes.add(this.wrap_el, 'picture_post');
    this.wrap_el.style.backgroundImage = 'url(' + postile.conf.uploadsResource([this.post.image_url]) + ')';
    this.wrap_el.style.backgroundSize = 'cover';
    this.wrap_el.style.backgroundPosition = 'center';
}

postile.view.post_in_board.PicturePost.prototype.edit = function() {
    goog.base(this, 'edit');
    this.edit_for_picture_and_video_post();
}

/**
 * video post
 */
postile.view.post_in_board.VideoPost = function(data, board) {
    goog.base(this, data, board);
    this.type = 'PicturePost';

    this.render(data, true);
}

goog.inherits(postile.view.post_in_board.VideoPost, postile.view.post_in_board.Post);

postile.view.post_in_board.VideoPost.prototype.render = function(data, animation) {
    goog.base(this, 'render', data, animation);

    goog.dom.classes.add(this.wrap_el, 'video_post');
    this.video_preivew_el = goog.dom.createDom('iframe', {
        'class': 'video_iframe',
        'src': this.post.video_link,
    });
    goog.dom.appendChild(this.post_content_el, this.video_preivew_el);
}

postile.view.post_in_board.VideoPost.prototype.edit = function() {
    goog.base(this, 'edit');

    this.edit_for_picture_and_video_post();
}

/**
 * the edit function for picture and video posts, allows the user to edit the title of the post
 */
postile.view.post_in_board.Post.prototype.edit_for_picture_and_video_post = function() {
    postile.ajax(['post','start_edit'], { post_id: this.post.id }, function() {
        this.post_edit_button_el.style.display = 'none';
        this.change_view_for_edit();

        postile.ui.makeLabeledInput(this.post_title_el, '(picture description here and enter to submit)',
                'half_opaque', function(){
            var title = this.post_title_el.innerHTML == 
                    postile._('post_title_prompt') ? '' : this.post_title_el.innerHTML;

            this.submitEdit({ post_id: this.post.id, title: title }, function() {
                this.post_edit_button_el.style.display = 'block';
                this.in_edit = false;
            });
        }.bind(this));

        this.enable();
    }.bind(this));
}

postile.view.post_in_board.Post.prototype.render = function(data, isNew) {
    if (this.disabled) {
        return;
    }

    var instance = this;

    if (data) {
        goog.object.extend(this, data);
    }

    this.wrap_el.rel_data = this;

    if (isNew) {
        this.post.coord_x_end = this.post.pos_x + this.post.span_x; //precalculate this two so that future intersect test will be faster
        this.post.coord_y_end = this.post.pos_y + this.post.span_y;

        this.wrap_el.style.left = this.board.xPosTo(this.post.pos_x) + 'px';
        this.wrap_el.style.top = this.board.yPosTo(this.post.pos_y) + 'px';
        this.wrap_el.style.width = this.board.widthTo(this.post.span_x) + 'px';
        this.wrap_el.style.height = this.board.heightTo(this.post.span_y) + 'px';

        this.container_el = postile.dom.getDescendantByClass(this.wrap_el, 'post_container');

        this.inner_container_el = postile.dom.getDescendantByClass(this.container_el, 'post_inner_container')

        goog.events.listen(this.container_el, goog.events.EventType.DBLCLICK, function(e) {
            e.stopPropagation(); // prevent displaying mask by stopping event propagation
        });

        /* set top parts */
        this.post_top_el = postile.dom.getDescendantByClass(this.inner_container_el, 'post_top');

        this.post_title_el = postile.dom.getDescendantByClass(this.post_top_el, 'post_title');
        this.post_title_el.innerHTML = this.post.title;

        // post title clicked, should display post expanded
        this.post_author_el = postile.dom.getDescendantByClass(this.post_top_el, "post_author");

        // listen for title click event, open post expand view
        this.post_expand_listener = new postile.events.EventHandler(this.post_title_el, 
                goog.events.EventType.CLICK, function(e) {
            var postExpand = new postile.view.post.PostExpand(instance.post);
            postExpand.open();
        });
        this.post_expand_listener.listen();

        // username clicked, should display user profile
        this.author_profile_display_listener = new postile.events.EventHandler(this.post_author_el,
                goog.events.EventType.CLICK, function(e) {
            var profileView = new postile.view.profile.ProfileView(instance.creator.id);
        });
        this.author_profile_display_listener.listen();

        // display proper number of characters for title
        this.set_max_displayable_top();

        this.post_middle_container_el = postile.dom.getDescendantByClass(
                this.inner_container_el, 'post_middle_container');

        this.post_like_container_el = postile.dom.getDescendantByClass(
                this.post_middle_container_el, 'post_like_container');

        if (this.likes) {
            this.post_like_container_el.style.display = 'inline';
            this.init_like_container();
        } else {
            this.post_like_container_el.style.display = 'none';
        }

        /* set content parts */
        this.post_content_el = postile.dom.getDescendantByClass(this.inner_container_el, "post_content");

        /* add edit button */
        this.post_edit_button_el = postile.dom.getDescendantByClass(
                this.post_middle_container_el, 'post_edit_button')

        postile.data_manager.getUserData(this.post.creator_id, function(data) {
            this.creator = data;
            this.post_author_el.innerHTML = this.creator.username;

            /* render elements for the user's own post */
            if (this.creator.id == localStorage.postile_user_id) { // my own post
                this.post_content_el.style.cursor = 'auto';
                goog.events.listen(this.post_content_el, goog.events.EventType.CLICK, function() {
                    instance.edit();
                });

                goog.events.listen(this.post_edit_button_el, goog.events.EventType.CLICK, function(e) {
                    this.edit();
                }.bind(this));
            } else {
                this.post_edit_button_el.style.display = 'none';
            }
        }.bind(this));

        // post bottom
        this.post_bottom_el = postile.dom.getDescendantByClass(this.container_el, 'post_bottom');

        // this.extra_button_view_init();

        this.comment_preview_init();

        postile.fx.effects.resizeIn(this.wrap_el);
    } else {
    }
}

postile.view.post_in_board.Post.prototype.init_like_container = function() {
    this.post_like_count_el = postile.dom.getDescendantByClass(
            this.post_like_container_el, 'post_like_count');
    this.post_like_count_el.innerHTML = '♡ ' + this.likes.length;
    console.log(this.post_like_count_el);

    this.post_like_button_el = postile.dom.getDescendantByClass(
            this.post_like_container_el, 'post_like_button');

    // all the id of all the users that likes this post
    var liked_user_id = this.likes.map(function(l) {
        return l.user_id;
    });
    
    if (liked_user_id.indexOf(parseInt(localStorage.postile_user_id)) != -1) { // already liked
        this.post_like_button_el.innerHTML = 'Unlike';
    } else {
        this.post_like_button_el.innerHTML = 'Like';
    }

    goog.events.listen(this.post_like_button_el, goog.events.EventType.CLICK, function(e) {
        var action = this.post_like_button_el.innerHTML;
        postile.ajax([ 'post', action ], { post_id: this.post.id }, function(data) {
            if (action == 'like') { // like
                this.post_like_count_el.innerHTML = '♡ ' + (++this.likes.length);
                this.post_like_button_el.innerHTML = 'Unlike';
            } else { // unlike
                this.post_like_count_el.innerHTML = '+' + (--this.likes.length);
                this.post_like_button_el.innerHTML = 'Like';
            }
        }.bind(this));
    }.bind(this));
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

/*
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
    }
    goog.events.listen(instance.likeButton_el, goog.events.EventType.CLICK, function() {
        if(instance.liked_user.indexOf(parseInt(localStorage.postile_user_id))!=-1) {
            return;
        }else{
            instance.liked_user.push(parseInt(localStorage.postile_user_id));
            var like_icon = instance.likeButton_el;
            var new_like_icon = goog.dom.createDom('div', 'post_liked_icon');
            var new_counts = goog.dom.createDom('div', 'post_like_new_count');

            new_like_icon.style.width = '13px';
            new_like_icon.style.height = '13px';
            new_like_icon.style.position = 'absolute'; //so that "clip" can make effect
            new_counts.innerHTML = ++instance.like_count;

            goog.dom.appendChild(like_icon, new_like_icon);
            goog.dom.appendChild(instance.likes_count_el, new_counts);

            new postile.fx.Animate(function(i) {
                new_like_icon.style.clip = 'rect('+Math.round(13*(1-i))+'px 13px 13px 0px)';
                new_counts.style.top = - Math.round(13 * i) + 'px';
            }, 400, {
                ease: postile.fx.ease.cubic_ease_out,
                callback: goog.bind(function() {
                    goog.dom.classes.remove(like_icon, 'post_like_icon');
                    goog.dom.classes.add(like_icon, 'post_liked_icon');
                    goog.dom.removeNode(new_like_icon);
                    goog.dom.removeNode(new_counts);
                    instance.likes_count_el.innerHTML = instance.like_count;
                }, this)
            });

            postile.ajax([ 'post', 'like' ], { post_id: instance.post.id }, function(data) {
            });
        }
    });

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
*/

postile.view.post_in_board.Post.prototype.comment_preview_init = function() {
    // comment preview
    this.comment_preview_el = postile.dom.getDescendantByClass(
            this.post_bottom_el, 'comment_preview');

    // author
    this.comment_preview_author_el = postile.dom.getDescendantByClass(
            this.comment_preview_el, 'comment_preview_author');

    // middle: displays ": " after username
    this.comment_preview_middle_el = postile.dom.getDescendantByClass(
            this.comment_preview_el, 'comment_preview_middle');

    // author
    this.comment_preview_author_el = postile.dom.getDescendantByClass(
            this.comment_preview_el, 'comment_preview_author');

    // content
    this.comment_preview_content_el = postile.dom.getDescendantByClass(
            this.comment_preview_el, 'comment_preview_content');

    /* the following code displays all the inline comments in a container */
    // comment container
    this.comment_container_el = postile.dom.getDescendantByClass(
            this.post_bottom_el, 'comment_container');

    // comment list
    this.comment_list_el = postile.dom.getDescendantByClass(
            this.comment_container_el, 'comment_list');

    // "no comment"
    this.comment_container_no_comment_el = postile.dom.getDescendantByClass(
            this.comment_list_el, 'comment_container_no_comment');

    // comment items
    this.comment_container_items_el = postile.dom.getDescendantByClass(
            this.comment_list_el, 'comment_container_items');

    // bottom (including input and close button)
    this.comment_container_bottom_el = postile.dom.getDescendantByClass(
            this.comment_container_el, 'comment_container_bottom');

    // input for new comments
    this.comment_container_input_el = postile.dom.getDescendantByClass(
            this.comment_container_bottom_el, 'comment_container_input');
    this.comment_container_input_el.style.width = this.wrap_el.offsetWidth - 60 + 'px';

    goog.events.listen(this.comment_container_input_el, goog.events.EventType.KEYDOWN, function(e) {
        if (this.comment_container_input_el.value.length > 0) { // must have something in the input
            if (e.keyCode == 13) { // enter pressed
                postile.ajax([ 'inline_comment', 'new' ], {
                    post_id: this.post.id,
                    content: goog.string.trim(this.comment_container_input_el.value),
                }, function(data) {
                    var comment = data.message;
                    if (!this.inlineCommentRendered(comment)) {
                        // add the new comment to list
                        this.inline_comments.push(comment);
                        this.appendInlineComment(comment);

                        // scroll the comment list to the bottom
                        this.comment_list_el.scrollTop = this.comment_list_el.scrollHeight;
                    }

                    this.hideNoCommentEl();
                }.bind(this));

                this.comment_container_input_el.value = ''; // clear the input field
            }
        }
    }.bind(this));

    // button that closes comment container
    this.comment_list_close_button_el = postile.dom.getDescendantByClass(
            this.comment_container_bottom_el, 'comment_list_close_button');
    goog.events.listen(this.comment_list_close_button_el, goog.events.EventType.CLICK, function(e) {
        this.comment_container_el.style.display = 'none';
    }.bind(this));
    
    if (this.inline_comments && this.inline_comments.length > 0) { // at least one comment
        this.comment_preview_middle_el.innerHTML = ': ';

        var index = this.inline_comments.length - 1; // display latest comment

        postile.data_manager.getUserData(
                this.inline_comments[index].inline_comment.creator_id, function(data) {
                    this.comment_preview_author_el.innerHTML = data.username;
        }.bind(this));

        var content = this.inline_comments[index].inline_comment.content;

        this.comment_preview_content_el.innerHTML = content;
        // this.set_max_displayable_comment_preview(content);
    } else { // no inline comments
        this.comment_preview_content_el.innerHTML = 'click here to comment';
        this.comment_preview_content_el.style.cursor = 'pointer';
    }

    // comment preview clicked, open comment container
    goog.events.listen(this.comment_preview_el, goog.events.EventType.CLICK, function(e) {
        this.comment_container_el.style.height = this.wrap_el.offsetHeight - 25 + 'px';

        this.comment_list_el.style.height = this.wrap_el.offsetHeight - 57 + 'px';
        this.renderInlineComments();

        this.comment_container_el.style.display = 'block';
        this.comment_container_input_el.focus();
    }.bind(this));
}

postile.view.post_in_board.Post.prototype.hideNoCommentEl = function(comment) {
    this.comment_container_no_comment_el.style.display = 'none';
}

postile.view.post_in_board.Post.prototype.inlineCommentRendered = function(comment) {
    var comment_ids = this.inline_comments.map(function(c) {
        return c.inline_comment.id;
    });

    return (comment_ids.indexOf(comment.inline_comment.id) != -1);
}

postile.view.post_in_board.Post.prototype.renderInlineComments = function(content) {
    this.comment_container_items_el.innerHTML = '';
    if (this.inline_comments.length != 0) { // has comment
        for (var i in this.inline_comments) {
            var cmt = new postile.view.post_in_board.InlineComment(
                    this.comment_container_items_el, this.inline_comments[i]);
            this.hideNoCommentEl();
        }

    }
}

postile.view.post_in_board.Post.prototype.appendInlineComment = function(comment) {
    var cmt = new postile.view.post_in_board.InlineComment(
            this.comment_container_items_el, comment);

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
            instance.comment_preview_middle_el.innerHTML = ': '; // in case there was no comment before
            instance.comment_preview_content_el.innerHTML = data.inline_comment.content;
            // instance.set_max_displayable_comment_preview(data.inline_comment.content);

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
    var the_id = instance.post.id;
    for (i in lels) {
        goog.dom.removeNode(lels[i]);
    }
    lels = [];
    if (goog.string.isEmpty(to_submit.content)) {
        if (confirm("Leaving a post blank will effectively delete this post. Confirm to proceed?")) {
            instance.removeFromBoard();
        }
        return;
    }
    instance.board.disableMovingCanvas = false;

    if (to_submit.title == original_title && to_submit.content == original_value) { // no change
        instance.render(); return;
    }

    // var submit_waiting = new postile.toast.Toast(0, "Please wait... We're submitting... Be ready for 36s.");
    instance.disable();

    postile.ajax(['post','submit_change'], to_submit, function(data) {
        instance.in_edit = false;
        instance.enable();
        instance.render(data.message);
        // submit_waiting.abort();
        var revert_waiting = new postile.toast.Toast(5, "Changes made. [Revert changes].", [function(){
            var answer = confirm("Are you sure you'd like to revert? You cannot redo once you revert.");
            if (answer) {
                instance.disable();
                var revert_submit_waiting = new postile.toast.Toast(0, "Please wait... We're submitting reversion... Be ready for 36s.");
                if(original_value == null && original_title == null) {
                    revert_submit_waiting.abort();
                    revert_waiting.abort();
                    instance.removeFromBoard();
                } else {
                    revert_waiting.abort();
                    postile.ajax(['post','submit_change'], { post_id: the_id, content: original_value, title: original_title },
                                 function(data) {
                        revert_submit_waiting.abort();
                        instance.enable();
                        instance.render(data.message);
                    });
                }
            }
        }]);
    });
}

postile.view.post_in_board.Post.prototype.removeFromBoard = function() {
    var instance  = this;
    var the_id = instance.post.id;
    // console.log(instance.board.currentPosts[the_id]);
    instance.board.removePost(the_id);
    instance.board.disableMovingCanvas = false;
    postile.ajax(['post','delete'], { post_id: the_id });
    /*
    goog.dom.removeNode(this.wrap_el);
    this.board.disableMovingCanvas = false;
    postile.ajax([ 'post', 'delete' ], { post_id: this.post.id }, function(data) {
        console.log('deleted');
    });

    delete this.board.currentPosts[this.id];
    */
}

/**
 * Change the viewing mode to edit mode by adding and removing elements
 */
postile.view.post_in_board.Post.prototype.change_view_for_edit = function() {
    this.in_edit = true;
    this.post_expand_listener.unlisten();
    this.author_profile_display_listener.unlisten();

    // this.wrap_el.style.boxShadow = '0px 0px 4px #537cbe';

    // remove effects in the view mode
    this.post_title_el.style.textDecoration = 'none';
    this.post_title_el.style.cursor = 'auto';

    // reset title
    this.post_title_el.innerHTML = this.post.title;
    this.post_title_el.style.width = this.container_el.offsetWidth - 10 + 'px';
    goog.dom.classes.add(this.post_title_el, 'selectable');

    // delete icon on the top right corner
    var delete_icon = goog.dom.createDom('div', 'post_remove_icon');
    goog.dom.appendChild(this.container_el, delete_icon);
    goog.events.listen(delete_icon, goog.events.EventType.CLICK, function(e) {
        e.stopPropagation();
        new postile.view.confirm_delete.ConfirmDelete(this).open(delete_icon);
    }.bind(this));

    this.post_author_el.style.display = 'none'; // hide author name
    this.comment_preview_el.style.display = 'none' // hide comment preview
}

postile.view.post_in_board.Post.prototype.edit = function() {
    if (this.in_edit) {
        return;
    }

    var instance = this;
    this.disable();
}

postile.view.post_in_board.resolveAtPerson = function(displayText) { //displayed -> shown
    return displayText.replace(/<span[^<>]*at\-user="(\d+)"[^<>]*> @[^<]+ <\/span>/g, ' @$1 ');
}

/**
 * @constructor
 */
/*
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
        var inputText = postile.view.post_in_board.resolveAtPerson(instance.text_input.innerHTML);
        postile.ajax(['inline_comment','new'], {
            post_id: postObj.post.id,
            content: goog.string.trim(inputText)
        }, function(data) {
            if (data.status == postile.ajax.status.OK) {
                var commentView = new postile.view.post_in_board.InlineComment(
                    instance, data.message);
                postile.fx.effects.verticalExpand(commentView.comment_container);
                postile.ui.stopLoading(instance.text_input);
                instance.text_input.innerHTML = '';
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
        postObj.wrap_el.style.zIndex = (++postObj.board.maxZIndex);
    });
}

goog.inherits(postile.view.post_in_board.InlineCommentsBlock, postile.view.TipView);
*/

/* return the container element */
postile.view.post_in_board.InlineComment = function(icb, single_comment_data) {
    this.comment_container = goog.dom.createDom("div", "post_comment");

    postile.data_manager.getUserData(single_comment_data.inline_comment.creator_id, function(data) {
        this.name_content_container_el = goog.dom.createDom('div', 'name_content_container');
        goog.dom.appendChild(this.comment_container, this.name_content_container_el);

        this.name_el = goog.dom.createDom("span", "comment_name");
        this.name_el.innerHTML = data.username;
        goog.dom.appendChild(this.name_content_container_el, this.name_el);

        this.middle_el = goog.dom.createDom('span', 'comment_middle');
        this.middle_el.innerHTML = ':&nbsp;';
        goog.dom.appendChild(this.name_content_container_el, this.middle_el);

        this.content_el = goog.dom.createDom("span", "comment_content");
        this.content_el.innerHTML = single_comment_data.inline_comment.content.replace(/ @(\d+)/g, '<span class="at_person" at-person="$1">@[Username pending]</span>');
        goog.dom.appendChild(this.name_content_container_el, this.content_el);

        this.time_el = goog.dom.createDom("span", "comment_time");
        this.time_el.innerHTML = postile.date(single_comment_data.inline_comment.created_at, 'inline');
        goog.dom.appendChild(this.comment_container, this.time_el);

        var all_atp = postile.dom.getDescendantsByCondition(this.content_el, function(el) {
            return el.tagName && el.tagName.toUpperCase() == 'SPAN' && el.className == 'at_person';
        });

        for (var i in all_atp) {
            fetchUsername(all_atp[i]);
        }

        goog.dom.appendChild(icb, this.comment_container);

    }.bind(this));
}

fetchUsername = function(el) {
    postile.data_manager.getUserData(el.getAttribute('at-person'), function(data) {
        el.innerHTML = '@' + data.first_name + ' ' + data.last_name;
    });
}
