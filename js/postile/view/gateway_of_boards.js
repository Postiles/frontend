goog.provide('postile.view.BoardList');

goog.require('goog.dom');
goog.require('postile.view');
goog.require('goog.events');
goog.require('postile.dom');

/**
 * @constructor
 * @param {int} topic the id of the parent topic
 */
postile.view.BoardList = function(topic) {
    goog.base(this);
    this.container.className = 'board_list_catchall';
    this.wrap_el = postile.dom.getDescendantByClass(this.container, "board_list");
    this.subject = postile.dom.getDescendantByClass(this.container, "subject");
    this.subject.innerHTML = 'All boards in the current topic';
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
    var item_el = goog.dom.createDom('div', 'board_single');
    var img_el = goog.dom.createDom('img');
    img_el.src = postile.conf.uploadsResource([data.board.image_small_url]);
    var meta_el = goog.dom.createDom('div', 'board_meta');
    var title_el = goog.dom.createDom('div', 'title');
    title_el.innerHTML = data.board.name;
    var description_el = goog.dom.createDom('div', 'description');
    description_el.innerHTML = data.board.description;
    var meta_meta_el = goog.dom.createDom('div', 'meta');
    var meta_count_el = goog.dom.createDom('span');
    var meta_creator_el = goog.dom.createDom('span');
    postile.ajax([ 'board', 'get_post_count' ], { board_id: data.board.id }, function(new_data) {
        meta_count_el.innerHTML = new_data.message.post_count + ' posts. ';
    });
    postile.data_manager.getUserData(data.board.creator_id, function(data) {
        meta_creator_el.innerHTML = 'Created by <i>' + data.username + '</i>';
    });
    goog.dom.appendChild(item_el, img_el);
    goog.dom.appendChild(meta_el, title_el);
    goog.dom.appendChild(meta_el, description_el);
    goog.dom.appendChild(meta_meta_el, meta_count_el);
    goog.dom.appendChild(meta_meta_el, meta_creator_el);
    goog.dom.appendChild(meta_el, meta_meta_el);
    goog.dom.appendChild(item_el, meta_el);
    goog.dom.appendChild(item_el, goog.dom.createDom('div', 'clear'));
    goog.dom.insertSiblingAfter(item_el, this.subject);
}