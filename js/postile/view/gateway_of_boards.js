goog.provide('postile.view.BoardList');

goog.require('goog.dom');
goog.require('postile.view.new_board');
goog.require('postile.view');
goog.require('goog.events');
goog.require('postile.dom');

/**
 * @constructor
 * @param {int} topic the id of the parent topic
 */
postile.view.BoardList = function(topic) {
    goog.base(this);
    this.currentBoardId = null;
    this.container.className = 'gateway';
    this.title = postile.dom.getDescendantByClass(this.container, "title");
    this.add = postile.dom.getDescendantByClass(this.title, "add");
    this.right = postile.dom.getDescendantByClass(this.container, "right");
    this.right_title = postile.dom.getDescendantByClass(this.right, "title");
    this.right_count = postile.dom.getDescendantByClass(this.right, "count");
    this.right_desc = postile.dom.getDescendantByClass(this.right, "desc");
    this.right_posts = postile.dom.getDescendantByClass(this.right, "posts");
    this.right_button = postile.dom.getDescendantByClass(this.right, "button");
    this.right_button.style.display = 'none';
    var new_board = new postile.view.new_board.NewBoard();
    goog.events.listen(this.add, goog.events.EventType.CLICK, function() {
        new_board.open(500);
    });
    goog.events.listen(this.right_button, goog.events.EventType.CLICK, function() {
        postile.router.dispatch('board/'+this.currentBoardId);
    }.bind(this));
    postile.ajax([ 'board', 'get_boards_in_topic' ], { topic_id: topic }, function(data) {
        /* handle the data return after getting the boards information back */
        var boardArray = data.message.boards;
        for(i in boardArray) {
            this.renderBoardListItem(boardArray[i]);
        }
    }.bind(this));
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
    var meta_creator_el = goog.dom.createDom('span', 'created');
    var meta_count_el = goog.dom.createDom('span', 'count');
    postile.ajax([ 'board', 'get_post_count' ], { board_id: data.board.id }, function(new_data) {
        meta_count_el.innerHTML = new_data.message.post_count != 1 ? new_data.message.post_count + ' posts' : '1 post';
    });
    postile.data_manager.getUserData(data.board.creator_id, function(data) {
        meta_creator_el.innerHTML = data.username;
    });
    goog.events.listen(item_el, goog.events.EventType.CLICK, function() {
        postile.router.dispatch('board/'+data.board.id);
    });
    goog.events.listen(item_el, goog.events.EventType.MOUSEOVER, function() {
        instance.right_title.innerHTML = title_el.innerHTML;
        instance.right_count.innerHTML = meta_count_el.innerHTML;
        instance.right_desc.innerHTML = description_el.innerHTML;
        instance.currentBoardId = data.board.id;
        instance.right_button.style.display = 'block';
        postile.ajax(['board', 'get_recent_posts'], { board_id: data.board.id }, function(new_data) {
            goog.dom.removeChildren(instance.right_posts);
            for (i in new_data.message) {
                instance.renderRecentPostItem(new_data.message[i]);
            }
        });
    });
    goog.dom.appendChild(item_el, img_el);
    goog.dom.appendChild(meta_el, title_el);
    goog.dom.appendChild(meta_el, description_el);
    goog.dom.appendChild(meta_meta_el, meta_creator_el);
    goog.dom.appendChild(meta_meta_el, meta_count_el);
    goog.dom.appendChild(meta_el, meta_meta_el);
    goog.dom.appendChild(item_el, meta_el);
    goog.dom.appendChild(item_el, goog.dom.createDom('div', 'clear'));
    goog.dom.insertSiblingAfter(item_el, this.title);
}

postile.view.BoardList.prototype.renderRecentPostItem = function(post_info) {
    var post_el = goog.dom.createDom('div', 'one_recent_post');
    goog.dom.appendChild(post_el, goog.dom.createDom('div', 'ball'));
    var subject_el = goog.dom.createDom('div', 'subject');
    subject_el.innerHTML = post_info.post.title;
    var meta_el = goog.dom.createDom('div', 'author');
    var author_el = goog.dom.createDom('span');
    postile.data_manager.getUserData(post_info.post.creator_id, function(data) {
        author_el.innerHTML = data.username;
    });
    var time_el = goog.dom.createDom('small');
    time_el.innerHTML = post_info.post.created_at;
    var content_el = goog.dom.createDom('div', 'content');
    content_el.innerHTML = post_info.post.content;
    goog.dom.appendChild(post_el, subject_el);
    goog.dom.appendChild(meta_el, author_el);
    goog.dom.appendChild(meta_el, time_el);
    goog.dom.appendChild(post_el, meta_el);
    goog.dom.appendChild(post_el, content_el);
    goog.dom.appendChild(this.right_posts, post_el);
}