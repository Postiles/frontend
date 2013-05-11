goog.provide('postile.view.new_navigator');

goog.require('goog.events');
goog.require('goog.dom');

postile.view.new_navigator.NewNavigator = function(boardData){
    postile.view.NormalView.call(this);
    this.boardId = boardData.board_id;
    this.current_index = null;
    this.info = null;
    
    var instance = this;
    postile.ajax(['board', 'get_all_posts_by_time'], { board_id: instance.boardId }, function(r) {
        instance.info = r.message;
        if (!instance.info.length) { return; }
        
        postile.ui.load(instance.container, postile.conf.staticResource(['_new_navigator.html']));

        instance.container.id = 'new_navigator_wrapper';

        instance.navigate_button = postile.dom.getDescendantsByClass(instance.container, 'new_navigator_button');
        instance.next_button = postile.dom.getDescendantsByClass(instance.container, 'new_navigator_next');

        // Click on the button
        goog.events.listen((instance.navigate_button)[0], goog.events.EventType.CLICK, function(){
            // next appear
            instance.go(0);
        });

        // Click on the newxt button
        goog.events.listen((instance.next_button)[0], goog.events.EventType.CLICK, function(){
            // go to the next posts
            instance.go(instance.current_index + 1);
        });

        instance.current_index = 0;
    });
    
}

goog.inherits(postile.view.new_navigator.NewNavigator, postile.view.NormalView);

postile.view.new_navigator.NewNavigator.prototype.go = function(index) {
    this.current_index = index;
    if (index >= this.info.length - 1) {
        goog.dom.classes.remove(this.next_button[0], 'next_navigate_out');
    } else {
        goog.dom.classes.add(this.next_button[0], 'next_navigate_out');
    }
    postile.view.switchToPost(this.info[index]);
}

postile.view.new_navigator.NewNavigator.prototype.unloaded_stylesheets = ['new_navigator.css'];
