goog.provide('postile.view.BoardList');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.view.new_board');
goog.require('postile.view');
goog.require('postile.view.account');
goog.require('postile.dom');

/**
 * @constructor
 * @param {int} topic the id of the parent topic
 */
postile.view.BoardList = function(topic) {
    goog.base(this);
    var instance = this;
    instance.currentBoardId = null;
    instance.currentUserLiked = false;
    instance.container.className = 'gateway';
    instance.currentTarget = null;

    instance.title = postile.dom.getDescendantByClass(instance.container, "title");
    instance.add = postile.dom.getDescendantByClass(instance.title, "add");
    instance.right = postile.dom.getDescendantByClass(instance.container, "right");
    instance.right_title = postile.dom.getDescendantByClass(instance.right, "title");
    instance.right_count = postile.dom.getDescendantByClass(instance.right, "count");
    instance.right_desc = postile.dom.getDescendantByClass(instance.right, "desc");
    instance.right_posts = postile.dom.getDescendantByClass(instance.right, "posts");
    instance.right_button = postile.dom.getDescendantByClass(instance.right, "button");
    instance.right_perspective = postile.dom.getDescendantByClass(instance.right, "perspective");
    instance.like_button = postile.dom.getDescendantByClass(instance.right, "like");    
    instance.recent_posts_title = postile.dom.getDescendantByClass(instance.right, "posts_title");    

    var new_board = new postile.view.new_board.NewBoard();
    goog.events.listen(instance.add, goog.events.EventType.CLICK, function() {
        alert("This function is temporarily disabled by the administrator.");
        //new_board.open(500);
    });
    goog.events.listen(instance.right_button, goog.events.EventType.CLICK, function() {
        postile.router.dispatch(instance.currentTarget);
    });
    goog.events.listen(instance.like_button, goog.events.EventType.CLICK, function() {
        if (!instance.currentUserLiked) {
            postile.ajax([ 'board', 'like' ], { board_id: instance.currentBoardId }, function(new_data) {
                instance.currentUserLiked = false;
                instance.like_button.innerHTML = parseInt(instance.like_button.innerHTML) + 1 + " liked it";
            });
        } else {
            postile.ajax([ 'board', 'unlike' ], { board_id: instance.currentBoardId }, function(new_data) {
                instance.currentUserLiked = true;
                instance.like_button.innerHTML = parseInt(instance.like_button.innerHTML) - 1 + " liked it";
            });        
        }
    });
    postile.ajax([ 'board', 'get_boards_in_topic' ], { topic_id: topic }, function(data) {
        /* handle the data return after getting the boards information back */
        var boardArray = data.message.boards;
        for(i in boardArray) {
            instance.renderBoardListItem(boardArray[i]);
        }
    });
    var account = new postile.view.account.Account();
    account.container.style.position = "absolute";
    account.container.style.top = '0';
    account.container.style.right = '0';
    goog.dom.appendChild(instance.container, account.container);
    if (!localStorage.postile_user_id) {
        instance.like_button.style.display = "none";
    }
}

goog.inherits(postile.view.BoardList, postile.view.FullScreenView);

postile.view.BoardList.prototype.unloaded_stylesheets = ['board_list.css'];

postile.view.BoardList.prototype.html_segment = postile.conf.staticResource(['board_list.html']);;

postile.view.BoardList.prototype.renderBoardListItem = function(data) {
    var instance = this;
    var item_el = goog.dom.createDom('div', 'single');
    var img_el = goog.dom.createDom('img');
    img_el.src = postile.conf.uploadsResource([data.board.image_small_url]);
    var meta_el = goog.dom.createDom('div', 'meta');
    var title_el = goog.dom.createDom('div', 'subject');
    title_el.innerHTML = data.board.name;
    var description_el = goog.dom.createDom('div', 'desc');
    description_el.innerHTML = data.board.description;
    var meta_meta_el = goog.dom.createDom('div', 'info');
    var meta_incognito_el = null;
    var meta_perspective_el = null;
    /*
    var meta_creator_el = goog.dom.createDom('span', 'created');
    */
    var meta_count_el = goog.dom.createDom('span', 'count');
    var user_liked = false;
    for (i in data.likes) {
        if (data.likes[i].user_id == localStorage.postile_user_id) {
            user_liked = true;
        }
    }

    if (data.board.default_view == 'sheet') {
        postile.ajax([ 'board', 'get_comment_count' ], { board_id: data.board.id }, function(new_data) {
            meta_count_el.innerHTML = new_data.message.comment_count != 1 ? new_data.message.comment_count + ' comments' : '1 comment';
        });
    } else {
        postile.ajax([ 'board', 'get_post_count' ], { board_id: data.board.id }, function(new_data) {
            meta_count_el.innerHTML = new_data.message.post_count != 1 ? new_data.message.post_count + ' posts' : '1 post';
        });
    }
    /*
    postile.data_manager.getUserData(data.board.creator_id, function(data) {
        meta_creator_el.innerHTML = data.username;
    });
    */
    goog.events.listen(item_el, goog.events.EventType.CLICK, function() {
        postile.router.dispatch(instance.currentTarget);
    });
    goog.events.listen(item_el, goog.events.EventType.MOUSEOVER, function() {
        instance.right.style.visibility = 'visible';
        instance.right_title.innerHTML = title_el.innerHTML;
        instance.right_count.innerHTML = meta_count_el.innerHTML;
        instance.right_desc.innerHTML = description_el.innerHTML;
        instance.right_perspective.className = meta_perspective_el.className + ' perspective';
        instance.right_perspective.innerHTML = data.board.default_view == 'sheet' ? 'Sheet' : 'Free';
        instance.currentBoardId = data.board.id;
        instance.currentTarget = 'board/' + instance.currentBoardId;
        instance.right_button.style.display = 'block';
        instance.currentUserLiked = user_liked;
        instance.like_button.innerHTML = data.likes.length + " liked it";

        if (data.board.default_view != 'sheet') {
            instance.recent_posts_title.style.display = 'block';
            postile.ajax(['board', 'get_recent_posts'], { board_id: data.board.id }, function(new_data) {
                goog.dom.removeChildren(instance.right_posts);
                for (i in new_data.message) {
                    instance.renderRecentPostItem(new_data.message[i], data);
                }
            });
        } else {
            instance.recent_posts_title.style.display = 'none';
            goog.dom.removeChildren(instance.right_posts);
        }

        if (meta_incognito_el) {
            meta_incognito_el.innerHTML = 'incognito';
        }
    });
    goog.events.listen(item_el, goog.events.EventType.MOUSEOUT, function() {
        if (meta_incognito_el) {
            meta_incognito_el.innerHTML = '';
        }
    });
    goog.dom.appendChild(item_el, img_el);
    goog.dom.appendChild(meta_el, title_el);
    goog.dom.appendChild(meta_el, description_el);
    /*
    goog.dom.appendChild(meta_meta_el, meta_creator_el);
    */
    goog.dom.appendChild(meta_meta_el, meta_count_el);
    goog.dom.appendChild(meta_el, meta_meta_el);
    goog.dom.appendChild(item_el, meta_el);
    goog.dom.appendChild(item_el, goog.dom.createDom('div', 'clear'));
    goog.dom.insertSiblingAfter(item_el, this.title);
    if (data.board.default_view) {
        meta_perspective_el = goog.dom.createDom('span', 'sheet');
    } else {
        meta_perspective_el = goog.dom.createDom('span', 'grid');
    }
    goog.dom.appendChild(meta_meta_el, meta_perspective_el);
    if (data.board.anonymous) {
        meta_incognito_el = goog.dom.createDom('span', 'incognito');
        goog.dom.appendChild(meta_meta_el, meta_incognito_el);
    }
}

postile.view.BoardList.prototype.renderRecentPostItem = function(post_info, boardData) {
    var post_el = goog.dom.createDom('div', 'one_recent_post');
    goog.dom.appendChild(post_el, goog.dom.createDom('div', 'ball'));
    var subject_el = goog.dom.createDom('div', 'subject');
    subject_el.innerHTML = post_info.post.title;
    var meta_el = goog.dom.createDom('div', 'author');
    var author_el = goog.dom.createDom('span');
    var time_el = goog.dom.createDom('small');
    time_el.innerHTML = postile.date(post_info.post.created_at, 'inline');

    if (!boardData.board.anonymous) {
        postile.data_manager.getUserData(post_info.post.creator_id, function(data) {
            author_el.innerHTML = data.username;
        });
    } else {
        time_el.style.paddingLeft = '0px';
    }

    var content_el = goog.dom.createDom('div', 'content');
    content_el.innerHTML = post_info.post.content;
    goog.dom.appendChild(post_el, subject_el);
    goog.dom.appendChild(meta_el, author_el);
    goog.dom.appendChild(meta_el, time_el);
    goog.dom.appendChild(post_el, meta_el);
    goog.dom.appendChild(post_el, content_el);
    goog.dom.appendChild(this.right_posts, post_el);
}
