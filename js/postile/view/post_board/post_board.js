goog.provide('postile.view.post_board');
goog.provide('postile.view.post_board.handlers');

goog.require('postile.view.post_board.mask');
goog.require('postile.view.post_board.MouseMoveScroll');
goog.require('postile.view');
goog.require('postile.fx');
goog.require('postile.fx.effects');
goog.require('postile.ajax');
goog.require('postile.faye');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.Textarea');
goog.require('postile.view.post_board.Header');
goog.require('goog.events.KeyHandler');
goog.require('postile.events');
goog.require('postile.view.post_in_board');
goog.require('postile.view.board_more_pop');
goog.require('postile.view.confirm_delete');
goog.require('postile.view.profile');
goog.require('postile.view.notification');
goog.require('postile.view.image_upload');
goog.require('postile.view.search_box');
goog.require('postile.view.post_board.post_picker');

postile.view.post_board.POST_WIDTH = 75;
postile.view.post_board.POST_HEIGHT = 50;
postile.view.post_board.POST_MARGIN = 14;

postile.view.post_board.handlers.arrow_control_click = function() { //in chrome, mouseout will automatically be called
    this.parentNode.rel_data.preMoveCanvas(this.direction);
}

postile.view.post_board.handlers.arrow_control_mousemove = function(e) {
    if (this.direction == 'up' || this.direction == 'down') {
        this.button.style.left = (e.offsetX - 60)+'px';
    } else {
        this.button.style.top = (e.offsetY - 60)+'px';
    }
}

postile.view.post_board.handlers.arrow_control_mouseover = function(e) {
    e.preventDefault();

    this.button.style.display = 'block';
    var direction = this.direction;
    var css_name = postile.view.post_board.direction_norm_to_css[direction];
    var hover = this.button.firstChild;
    var rel_data = this.parentNode.rel_data;

    hover.style[css_name] = '-40px';

    this.parentNode.rel_data.direction_controllers_animation = new postile.fx.Animate(function(iter) { 
        hover.style[css_name] = 40-40*iter + 'px'; }, 
        500, 
        false, 
        function() { 
            hover.parentNode.style.display = 'none'; rel_data.preMoveCanvas(direction); 
        });
}

postile.view.post_board.handlers.arrow_control_mouseout = function() {
    this.parentNode.rel_data.direction_controllers_animation.stop();
    this.button.style.display = 'none';
}

postile.view.post_board.handlers.resize = function(instance){ //called on window.resize
    instance.canvas.style.display = 'block'; 
    var new_viewport_size = [window.innerWidth,  window.innerHeight - 45]; //45 is the menu bar height

    if (!instance.canvasCoord) { //first time (initialize)
        instance.canvasCoord = [
            (new_viewport_size[0] - instance.canvasSize[0]) / 2, 
            (new_viewport_size[1] - instance.canvasSize[1]) / 2 ];
    } else { //window resize
        //keep the center in the same position
        instance.canvasCoord[0] += (new_viewport_size[0] - parseInt(instance.catchall.style.width))/2;
        instance.canvasCoord[1] += (new_viewport_size[1] - parseInt(instance.catchall.style.height))/2;
    }

    instance.catchall.style.width = new_viewport_size[0] + 'px'; 
    instance.catchall.style.height = new_viewport_size[1] + 'px';

    instance.viewport.scrollLeft = - instance.canvasCoord[0];
    instance.viewport.scrollTop = - instance.canvasCoord[1];
    instance.viewport_position = goog.style.getRelativePosition(instance.viewport, document.body); //or document.documentElement perhaps?

    instance.updateSubsribeArea(); //update according to the new subscribe area
}

postile.view.post_board.handlers.keypress = function(instance, e){
    switch (e.keyCode) {
        case goog.events.KeyCodes.LEFT:
            if (instance.preMoveCanvas('left')) { e.preventDefault(); }
            break;
        case goog.events.KeyCodes.RIGHT:
            if (instance.preMoveCanvas('right')) { e.preventDefault(); }
            break;
        case goog.events.KeyCodes.UP:
            if (instance.preMoveCanvas('up')) { e.preventDefault(); }
            break;
        case goog.events.KeyCodes.DOWN:
            if (instance.preMoveCanvas('down')) { e.preventDefault(); }
            break;
    }    
}

postile.view.post_board.PostBoard = function(board_id) { //constructor
    var i;
    var keyHandler;
    var instance = this;
    postile.view.FullScreenView.call(this);

    /* BEGINNING OF MEMBER DEFINITION */
    this.board_id = board_id;
    this.channel_str = null;
    this.canvasCoord = null; //current canvas position relative to the canvas viewport
    this.canvasSize = [3872, 2592]; //the size of the canvas currently
    this.canva_shadow_animation = null; //the animation for the outbound shadow
    this.disableMovingCanvas = false; //when true, moving canvas is disabled temporarily
    this.currentPosts = {}; //an object containing all posts, as key = post_id and value = Post object
    this.catchall = goog.dom.createDom('div', 'viewport_container'); //disable text selecting
    this.viewport = goog.dom.createDom('div', 'canvas_viewport'); //disable text selecting
    this.canvas = goog.dom.createDom('div', 'canvas'); //the canvas being dragged
    this.viewport_position = null; //viewport's position relative to the window
    this.direction_controllers = {}; //the control arrows
    this.direction_controllers_animation = null;
    this.right = goog.dom.createDom('div', 'right_clicker'); //right click display
    this.currentSubscribeArea = null; //a valid area for which we've got all data we need and keep refreshing from the server
    this.maxZIndex = 0; //max zIndex of posts currently
    this.click_start_point = null;

    //initialize according to board_id
    postile.ajax(['board','enter_board'], { board_id: board_id }, function(data) {
        instance.boardData = data.message.board;
        instance.userData = data.message.user;
        instance.profileData = data.message.profile;

        instance.channel_str = instance.boardData.id;

        postile.faye.subscribe(instance.channel_str, function(status, data) {
            instance.fayeHandler(status, data);
        });

        instance.initView();
        instance.initEvents();

        //initialize viewport size
        postile.view.post_board.handlers.resize(instance);
    });
}

goog.inherits(postile.view.post_board.PostBoard, postile.view.FullScreenView);

//postile.view.View required component
postile.view.post_board.PostBoard.prototype.unloaded_stylesheets = ['fonts.css', 'post_board.css'];

postile.view.post_board.PostBoard.prototype.html_segment = postile.staticResource(['post_board.html']);

postile.view.post_board.PostBoard.prototype.initView = function() {
    var instance = this;

    this.picker = new postile.view.post_board.PostPicker(this);
    this.header = new postile.view.post_board.Header(this);
    this.postCreator = new postile.view.post_board.PostCreator(this);

    goog.dom.appendChild(this.catchall, this.viewport);
    goog.dom.appendChild(this.viewport, this.canvas);

    goog.dom.appendChild(goog.dom.getElement("wrapper"), this.header.container);
    goog.dom.appendChild(goog.dom.getElement("wrapper"), this.catchall);

    /**
     * main viewport and canvas
     */
    this.catchall.rel_data = this;
    this.viewport.rel_data = this;
    this.canvas.rel_data = this;

    if (!postile.browser_compat.isMacOsX()) { // is not mac os
        new postile.view.post_board.MouseMoveScroll(this);
    }
}

postile.view.post_board.PostBoard.prototype.initEvents = function() {
    this.bindWindowEvents();
    this.bindMouseEvents();
    this.bindKeyEvents();
}

postile.view.post_board.PostBoard.prototype.bindMouseEvents = function() {
    var instance = this;

    goog.events.listen(this.viewport, goog.events.EventType.SELECTSTART, function() {
        return false; 
    }); //disable text selecting, for ie

    goog.events.listen(this.viewport, goog.events.EventType.SCROLL, function() {
        instance.canvasCoord[0] = - instance.viewport.scrollLeft;
        instance.canvasCoord[1] = - instance.viewport.scrollTop;
    }) 

    /* start: controllers for moving the viewport */
    goog.dom.appendChild(this.catchall, this.right);

    goog.events.listen(this.catchall, goog.events.EventType.CONTEXTMENU, function(e) {
        e.preventDefault(); 
    });

    goog.events.listen(this.catchall, goog.events.EventType.MOUSEDOWN, function(e) {
        instance.click_start_point = [e.clientX, e.clientY];
    
        if (!e.isButton(2)) { // right mouse button
            return; 
        }

        instance.right.style.left = e.clientX - 53 + 'px'; // TODO: replace the magic number
        instance.right.style.top = e.clientY - 53 + 'px'; // TODO: replace the magic number
        instance.right.style.display = 'block';
    });

    goog.events.listen(this.catchall, goog.events.EventType.CLICK, function(e) {
        var dy = e.clientY - instance.click_start_point[1];
        var dx = e.clientX - instance.click_start_point[0];
        if (Math.abs(dy) > 2 && Math.abs(dx) > 2) { //left draging
            e.stopPropagation();
        }
    }, true);
    
    goog.events.listen(this.catchall, goog.events.EventType.MOUSEUP, function(e) {
        var dy = e.clientY - instance.click_start_point[1];
        var dx = e.clientX - instance.click_start_point[0];
    
        if (!e.isButton(2) || Math.abs(dx) + Math.abs(dy) < 3) { // right mouse button
            return; 
        }

        this.rel_data.right.style.display = 'none';
        var length = Math.sqrt(Math.pow(dx, 2)+Math.pow(dy, 2));

        this.rel_data.moveCanvas(dx / 2 / length * this.offsetWidth, dy / 2 / length * this.offsetHeight);
    });

    goog.events.listen(this.canvas, goog.events.EventType.DBLCLICK, 
            function(){ instance.postCreator.open(); });
}

postile.view.post_board.PostBoard.prototype.bindKeyEvents = function() {
    var instance = this;

    this.keyboard_event_handler = new postile.events.EventHandler(postile.getGlobalKeyHandler(), 
            goog.events.KeyHandler.EventType.KEY, function(e) { 
                postile.view.post_board.handlers.keypress(instance, e); 
            });
    this.keyboard_event_handler.listen();

    for (i in postile.view.post_board.direction_norm_to_css) {
        this.direction_controllers[i] = goog.dom.createDom('div', ['arrow_detect', i]);
        this.direction_controllers[i].direction = i;
        this.direction_controllers[i].button = goog.dom.createDom('div', 'arrow_button'); //each one has a .button property pointing to the child

        goog.dom.appendChild(this.direction_controllers[i], this.direction_controllers[i].button);
        goog.dom.appendChild(this.direction_controllers[i].button, goog.dom.createDom('div'));
        goog.dom.appendChild(this.direction_controllers[i], goog.dom.createDom('div', 'arrow_covering'));
        goog.dom.appendChild(this.catchall, this.direction_controllers[i]);

        goog.events.listen(this.direction_controllers[i], goog.events.EventType.CLICK, 
                postile.view.post_board.handlers.arrow_control_click);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEMOVE, 
                postile.view.post_board.handlers.arrow_control_mousemove);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEOVER, 
                postile.view.post_board.handlers.arrow_control_mouseover);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEOUT, 
                postile.view.post_board.handlers.arrow_control_mouseout);
    }

}

postile.view.post_board.PostBoard.prototype.bindWindowEvents = function() {
    var instance = this;
    this.window_resize_event_handler = new postile.events.EventHandler(window, 
            goog.events.EventType.RESIZE, function() { 
                postile.view.post_board.handlers.resize(instance);
            });
    this.window_resize_event_handler.listen();
}

//postile.view.View required component
postile.view.post_board.PostBoard.prototype.close = function() {
    var instance = this;

    if (this.window_resize_event_handler) {
        this.window_resize_event_handler.unlisten();
    }
    if (this.keyboard_event_handler) {
        this.keyboard_event_handler.unlisten();
    }

    /*
    postile.ajax(['topic','leave_topic'], { channel_str: this.channel_str }, function(data){
        if (data.message != instance.board_id) {
            alert("Some error occured when leaving the topic.");
        }
    });
    */
}

postile.view.post_board.PostBoard.prototype.preMoveCanvas = function(direction) { //return true only when it's movable
    switch(direction) {
        case 'up':
            return this.moveCanvas(0, -0.5 * this.viewport.offsetHeight);
        case 'down':
            return this.moveCanvas(0, 0.5 * this.viewport.offsetHeight);
        case 'left':
            return this.moveCanvas(-0.5 * this.viewport.offsetWidth, 0);
        case 'right':
            return this.moveCanvas(0.5 * this.viewport.offsetWidth, 0);
    }
}

postile.view.post_board.PostBoard.prototype.moveCanvas = function(dx, dy) { //return true only when it's movable
    if (this.disableMovingCanvas) { 
        return false; 
    } //do not respond to actions if the user is actually dragging
    this.locateCanvas(this.canvasCoord[0] - dx, this.canvasCoord[1] - dy);   
    return true;
}

postile.view.post_board.PostBoard.prototype.locateCanvas = function(leftTarget, topTarget) { //return true only when it's movable
    var i;
    var instance = this;
    var arrow_hide = {}; //the arrow index to hide

    for (i in postile.view.post_board.direction_norm_to_css) { 
        arrow_hide[i] = false; 
    }

    if (topTarget >= 0) { 
        topTarget = 0; arrow_hide['up'] = true; 
    }

    if (topTarget <= this.viewport.offsetHeight - this.canvasSize[1]) { 
        topTarget = this.viewport.offsetHeight - this.canvasSize[1]; arrow_hide['down'] = true; 
    }

    if (leftTarget >= 0) { 
        leftTarget = 0; arrow_hide['left'] = true; 
    }

    if (leftTarget <= this.viewport.offsetWidth - this.canvasSize[0]) { 
        leftTarget = this.viewport.offsetWidth - this.canvasSize[0]; arrow_hide['right'] = true; 
    }

    if (leftTarget != instance.canvasCoord[0] || topTarget != instance.canvasCoord[1]) {
        this.disableMovingCanvas = true;
        for (i in instance.direction_controllers) {
            instance.direction_controllers[i].style.display = 'none';
        }

        new postile.fx.Animate(function(iter) {
           instance.viewport.scrollLeft = - (instance.canvasCoord[0]*(1-iter) + leftTarget*iter);
           instance.viewport.scrollTop = - (instance.canvasCoord[1]*(1-iter) + topTarget*iter);
        }, 600, postile.fx.ease.sin_ease, function() {
            instance.canvasCoord[0] = leftTarget;
            instance.canvasCoord[1] = topTarget;
            var i;
            instance.disableMovingCanvas = false;
            for (i in instance.direction_controllers) {
                if (!arrow_hide[i]) {
                    instance.direction_controllers[i].style.display = 'block';
                }
            }
        });
    } else {
        for (i in arrow_hide) {
            if (arrow_hide[i]) {
                instance.direction_controllers[i].style.display = 'block';
            }
        }
    }
    instance.updateSubsribeArea();
}

//convent length from "unit length" of the grid to pixel.
postile.view.post_board.PostBoard.prototype.widthTo = function(u) { 
    return (u*(postile.view.post_board.POST_WIDTH+postile.view.post_board.POST_MARGIN) 
            - postile.view.post_board.POST_MARGIN); 
};

postile.view.post_board.PostBoard.prototype.heightTo = function(u) { 
    return (u*(postile.view.post_board.POST_HEIGHT+postile.view.post_board.POST_MARGIN) 
            - postile.view.post_board.POST_MARGIN); 
};

postile.view.post_board.PostBoard.prototype.xPosTo = function(u) { 
    return (u*(postile.view.post_board.POST_WIDTH+postile.view.post_board.POST_MARGIN) 
            + this.canvasSize[0]/2); 
};

postile.view.post_board.PostBoard.prototype.yPosTo = function(u) { 
    return (u*(postile.view.post_board.POST_HEIGHT+postile.view.post_board.POST_MARGIN) 
            + this.canvasSize[1]/2); 
};

//convent length to "unit length" of the grid from pixel. it is from the center grid points so margins and paddings are ignored.
postile.view.post_board.PostBoard.prototype.xPosFrom = function(px) { 
    return ((px + postile.view.post_board.POST_MARGIN / 2 - this.canvasSize[0] / 2) 
            / (postile.view.post_board.POST_WIDTH + postile.view.post_board.POST_MARGIN)); 
};

postile.view.post_board.PostBoard.prototype.yPosFrom = function(px) { 
    return ((px + postile.view.post_board.POST_MARGIN / 2 - this.canvasSize[1] / 2) 
            / (postile.view.post_board.POST_HEIGHT + postile.view.post_board.POST_MARGIN)); 
};

postile.view.post_board.direction_norm_to_css = { up: 'top', down: 'bottom', left: 'left', right: 'right' };

postile.view.post_board.PostBoard.prototype.getVisibleArea = function(source) { // //get visible area in the unit of "grid unit" //source is expected to be this.canvasCoord or [parseInt(this.canvas.style.left), parseInt(this.canvas.style.top)]
    return { 
        left: Math.floor(this.xPosFrom(-source[0])), 
        top: Math.floor(this.yPosFrom(-source[1])), 
        right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth - source[0])), 
        bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight - source[1]))
    };
}

postile.view.post_board.PostBoard.prototype.getSubscribeArea = function(source) { //get subscribe area in the unit of "grid unit"
    var preloadRadio = 1; //the size of preloaded area. 0 for exactly visible area (no preload), n for extend n screen length on all directions.
    return { 
        left: Math.floor(this.xPosFrom(-source[0] - preloadRadio*this.viewport.offsetWidth)), 
        top: Math.floor(this.yPosFrom(-source[1] - preloadRadio*this.viewport.offsetHeight)), 
        right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth*(1+preloadRadio) - source[0])), 
        bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight*(1+preloadRadio) - source[1]))
    };
}

postile.view.post_board.PostBoard.prototype.updateSubsribeArea = function() { //fetch the posts in the new area and subscribe it
    var instance = this;
    var current_loc = this.canvasCoord;
    var to_subscribe = this.getSubscribeArea(current_loc);
    /*
    if (!this.isAreaFullInside(this.currentSubscribeArea, this.getVisibleArea(currentLoc))) {
        //TODO: display loading
    }
    */
    to_subscribe.board_id = instance.board_id;
    postile.ajax(['board', 'move_to'], to_subscribe, function(data) {
        instance.renderArray(data.message.posts);
    }, 'Loading posts...', true);
}

postile.view.post_board.PostBoard.prototype.isAreaFullInside = function(parent, child) {
    return (parent.left <= child.left 
            && parent.right >= child.right 
            && parent.top <= child.top 
            && parent.bottom >= child.bottom);
}

/**
 * The parameter "array" is an array of returned objects, which contains a post object and a username:
 *  Array: [ 
 *      Object {
 *          post { post attrs },
 *          username: <str>
 *      },
 *      Object { ... }
 *  ]
 */
postile.view.post_board.PostBoard.prototype.renderArray = function(array) { //add post objects to the screen //NOTICE: just add, no not care the duplicate
    var i;
    var animation = null;
    for (i in array) {
        if (!array[i].post.id) { return; }
        if (array[i].post.id in this.currentPosts) { //if so // so what?
            this.currentPosts[array[i].post.id].render(array[i]);
        } else {
            this.currentPosts[array[i].post.id] = new postile.view.post_in_board.Post(array[i], this);
        }
    }
};

postile.view.post_board.PostBoard.prototype.fayeHandler = function(status, data) {
    switch (status) {
        case postile.view.post_board.faye_status.FINISH:
            this.currentPosts[data.post.id].enable();
            this.renderArray([data]);
            break;
        case postile.view.post_board.faye_status.START:
            if (data.post.id in this.currentPosts) {
                this.currentPosts[data.post.id].disable();
            } else {
                this.renderArray([data]);
            }
            break;
        case postile.view.post_board.faye_status.DELETE:
            if (data.post.id in this.currentPosts) {
                this.currentPosts[data.post.id].removeFromBoard();
            }
            break;
    }
}

postile.view.post_board.PostBoard.prototype.createPost = function(info) {
    var req = goog.object.clone(info);
    var ret = goog.object.clone(info);
    var instance = this;
    req.board_id = this.board_id;
    ret.text_content = '';

    postile.ajax(['post','new'], req, function(data) {
        instance.renderArray([ { post: data.message.post, creator: data.message.creator } ]);
        instance.currentPosts[data.message.post.id].edit();
    });
}

postile.view.post_board.PostBoard.prototype.removePost = function(id) {
    if (this.currentPosts[id].wrap_el) {
        goog.dom.removeNode(this.currentPosts[id].wrap_el); //remove original element
    }
    delete this.currentPosts[id];
}

/* define the function buttons class */
postile.view.post_board.FunctionButton = function(dom) { // constructor
    this.body_el = dom;
    this.image_el = goog.dom.getElementsByTagNameAndClass('img', null, this.body_el)[0];

    this.id = this.body_el.id;

    goog.events.listen(this.body_el, goog.events.EventType.CLICK, function(e) {
        this.open();

        if (this.id == 'switch_board_button') {
        } else if (this.id == 'message_button') {
        } else if (this.id == 'search_button') {
        } else if (this.id == 'popup_button') {
        }
    }.bind(this));
}

postile.view.post_board.FunctionButton.prototype.open = function() {
    this.body_el.style.backgroundColor = '#024d61'
    this.image_el.style.webkitFilter = 'brightness(95%)';
}

postile.view.post_board.FunctionButton.prototype.close = function() {
    this.body_el.style.backgroundColor = '#f1f1f1';
    this.image_el.style.webkitFilter = '';
}

postile.view.post_board.faye_status = {
    START: 'start',
    DELETE: 'delete',
    TERMINATE: 'terminate',
    FINISH: 'finish',
    INLINE_COMMENT: 'inline_comment',
    NOTIFICATION: 'notification',
}
