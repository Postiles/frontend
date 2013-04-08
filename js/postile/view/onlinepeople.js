goog.provide('postile.view.onlinepeople');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.math');
goog.require('postile.dom');

postile.view.onlinepeople.OnlinePeople = function(header) {
    this.BAR_WIDTH = 302;
    var instance = this;
    this.title_bar = header;
    //inherits TipView
    postile.view.TipView.call(this);
    postile.ui.load(this.container,
            postile.conf.staticResource(['_onlinepeople.html']));
    this.container.style.top = '0px';
    this.container.style.left = '0px';
    this.expanded = false;
    goog.events.listen(this.container, goog.events.EventType.CLICK, function() {
        console.log("Expanding");
    });
}


goog.inherits(postile.view.onlinepeople.OnlinePeople, postile.view.TipView);


postile.view.onlinepeople.OnlinePeople.prototype.render = function() {
    var title_bar_bound = goog.style.getBounds(this.title_bar.container);
    console.log(title_bar_bound);
    var coord = new goog.math.Coordinate(title_bar_bound.width,
                             title_bar_bound.height);
    coord.x = coord.x - this.BAR_WIDTH;
    goog.style.setPosition(this.container_wrap, coord);
    goog.dom.appendChild(this.title_bar.container, this.container_wrap);
}
