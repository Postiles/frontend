goog.provide('postile.view.new_board');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.string');

postile.view.new_board.NewBoard = function() {
    var instance = this;
    postile.view.PopView.call(this);
    this.container.style.width = '500px';
    postile.ui.load(this.container, postile.conf.staticResource(['new_board.html']));
    this.create_button = postile.dom.getDescendantByCondition(this.container, function(tag) { return tag.tagName && tag.tagName.toUpperCase() == 'A'; });
    this.ipt_name = postile.dom.getDescendantByClass(this.container, "name");
    this.ipt_desc = postile.dom.getDescendantByClass(this.container, "desc");
    goog.events.listen(this.create_button, goog.events.EventType.CLICK, function() {
        var name = goog.string.trim(instance.ipt_name.value);
        var desc = goog.string.trim(instance.ipt_desc.value);
        if (!name.length || !desc.length) {
            alert("Please fill fields.");
            return;
        }
        postile.ajax(['board', 'new'], { topic_id: 1, name: name, description: desc }, function(r) {
            console.log(r);
            postile.router.dispatch('board/' + r.message.board.id);
        });
    });

    this.addCloseButton(this.container);
}

goog.inherits(postile.view.new_board.NewBoard, postile.view.PopView);

postile.view.new_board.NewBoard.prototype.unloaded_stylesheets = ['new_board.css'];
