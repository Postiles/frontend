goog.provide('postile.view.post_board');
goog.provide('postile.view.post_board.handlers');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.Textarea');
goog.require('goog.userAgent');
goog.require('goog.events.KeyHandler');
goog.require('postile.DelayedThrottle');
goog.require('postile.conf');
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
goog.require('postile.view.post');
goog.require('postile.view.board_more_pop');
goog.require('postile.view.confirm_delete');
goog.require('postile.view.profile');
goog.require('postile.view.notification');
goog.require('postile.view.image_upload');
goog.require('postile.view.video_upload');
goog.require('postile.view.search_box');
goog.require('postile.view.post_board.post_picker');
goog.require('postile.view.onlinepeople');

/**
 * Smallest unit size for a post, in pixel.
 * @const
 */
postile.view.post_board.POST_WIDTH = 100;
postile.view.post_board.POST_HEIGHT = 80;
postile.view.post_board.POST_MARGIN = 10;

/**
 * Callback function for PostBoard.direction_controllers' mouseclick event.
 * "In chrome, mouseout will automatically be called."
 * @see PostBoard.bindKeyEvents Event binding is done there.
 * @see PostBoard.direction_controllers
 */
postile.view.post_board.handlers.arrow_control_click = function() {
    this.parentNode.rel_data.preMoveCanvas(this.direction);
}

/**
 * Callback function for PostBoard.direction_controllers' mousemove event.
 * Moves the arrow button horizontally or vertically so as to keep aligned
 * with user's mouse.
 * @param {goog.events.Event}
 * @see PostBoard.bindKeyEvents
 * @see PostBoard.direction_controllers
 */
postile.view.post_board.handlers.arrow_control_mousemove = function(e) {
    if (this.direction == 'up' || this.direction == 'down') {
        this.button.style.left = (e.offsetX - 60)+'px';
    } else {
        this.button.style.top = (e.offsetY - 60)+'px';
    }
}

/**
 * Callback function for PostBoard.direction_controllers' mouseover event.
 * Does two things: First is to show the zebra crossing animation when
 * the cursor is moved over the arrow button. Second is to set up a delayed
 * canvas move, which can be canceld by moving the cursor out of the button.
 *
 * @param {goog.events.Event} e
 * @see PostBoard.bindKeyEvents
 * @see PostBoard.direction_controllers
 * @see handlers.arrow_control.mouseout Cancels the canvas move.
 */
postile.view.post_board.handlers.arrow_control_mouseover = function(e) {
    e.preventDefault();

    this.button.style.display = 'block';
    var direction = this.direction;
    var css_name = postile.view.post_board.direction_norm_to_css[direction];
    var hover = this.button.firstChild;
    var rel_data = this.parentNode.rel_data;

    hover.style[css_name] = '-40px';

    this.parentNode.rel_data.direction_controllers_animation =
        new postile.fx.Animate(function(iter) {
            hover.style[css_name] = 40 - 40 * iter + 'px';
        },
        500, {
            callback: function() {
                hover.parentNode.style.display = 'none';
                rel_data.preMoveCanvas(direction);
            }
        });
}

/**
 * Callback function for PostBoard.direction_controllers' mouseout event.
 * Cancels the canvas move issued by the mouseover callback, and hide
 * the arrow button.
 *
 * @see PostBoard.bindKeyEvents
 * @see PostBoard.direction_controllers
 * @see handlers.arrow_control.mouseover Initializes the animation.
 */
postile.view.post_board.handlers.arrow_control_mouseout = function() {
    this.parentNode.rel_data.direction_controllers_animation.stop();
    this.button.style.display = 'none';
}

/**
 * Resize the viewport. This is called when the PostBoard is first initialized,
 * or on window.resize event.
 * @param {postile.view.post_board.PostBoard} instance The postboard instance
 * to resize (XXX: Shall we change this into a method of PostBoard?)
 */
postile.view.post_board.handlers.resize = function(instance) {
    instance.canvas.style.display = 'block';
    var new_viewport_size = [window.innerWidth,  window.innerHeight - 45]; //45 is the menu bar height

    if (!instance.canvasCoord) {
        /**
         * When called the first time, initialize canvasCoord.
         * @see PostBoard
         */
        instance.canvasCoord = [
            (new_viewport_size[0] - instance.canvasSize[0]) / 2,
            (new_viewport_size[1] - instance.canvasSize[1]) / 2 ];
    } else {
        // Window resize. Keep the center in the same position.
        instance.canvasCoord[0] += (new_viewport_size[0] - parseInt(instance.catchall.style.width))/2;
        instance.canvasCoord[1] += (new_viewport_size[1] - parseInt(instance.catchall.style.height))/2;
    }

    instance.catchall.style.width = new_viewport_size[0] + 'px';
    instance.catchall.style.height = new_viewport_size[1] + 'px';

    instance.viewport.scrollLeft = - instance.canvasCoord[0];
    instance.viewport.scrollTop = - instance.canvasCoord[1];

    // XXX: Or document.documentElement perhaps?
    instance.viewport_position = goog.style.getRelativePosition(instance.viewport, document.body);

    // Update according to the new subscribe area.
    instance.updateSubscribeArea();
}

/**
 * Callback function for document's key event.
 * Checks for arrow keys and issue canvas moves.
 * Currently only handles single direction.
 *
 * @param {goog.events.Event} e
 * @see PostBoard.bindKeyEvents
 */
postile.view.post_board.handlers.keypress = function(instance, e) {
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

/**
 * A collection of all the posts for a particular board id.
 * @constructor
 * @extends postile.view.FullScreenView
 * @param {string} board_id Unique identifier for a board.
 */
postile.view.post_board.PostBoard = function(board_id) {
    var instance = this;

    postile.view.FullScreenView.call(this);

    /** @private */
    this.board_id = board_id;

    /**
     * @type {?string} Faye channel id
     * @private
     */
    this.channel_str = null;

    /**
     * Current canvas position relative to the canvas viewport, in pixel.
     * @type {Array.<number>}
     * @see handlers.resize, since it's firstly initialized there.
     */
    this.canvasCoord = null;

    /**
     * The size of the canvas currently.
     * @type {Array.<number>}
     */
    this.canvasSize = [5000, 4000];

    /**
     * "The animation for the outbound shadow."
     * @type {postile.fx.Animate}
     * @see mousemove.js:MouseMoveScroll.viewport_mouseup Initialized there.
     */
    this.canva_shadow_animation = null;

    /**
     * "When true, moving canvas is disabled temporarily."
     * XXX: This variable is used by many files -- consider refactoring it?
     * @type {boolean}
     * @see PostBoard.locateCanvas
     */
    this.disableMovingCanvas = false;

    /**
     * "An object containing all posts,
     *  as key = post_id and value = Post object"
     * @type {Object.<number, postile.view.post.Post>}
     * @see createPost, removePost, moveToPost, renderArray, fayeHandler.
     */
    this.currentPosts = {};

    /**
     * The parent dom for the viewport and all the direction_controllers.
     * Blocks user action: context menu, text selecting, etc. Its size is
     * modified in handlers.resize.
     *
     * @type {Element}
     * @private
     * @see bindMouseEvents, bindKeyEvents
     */
    this.catchall = goog.dom.createDom('div', 'viewport_container');

    /**
     * Canvas container. "Disable text selecting."
     * @type {Element}
     */
    this.viewport = goog.dom.createDom('div', 'canvas_viewport');

    /**
     * "The canvas being dragged."
     * @type {Element}
     */
    this.canvas = goog.dom.createDom('div', 'canvas');

    /**
     * "Viewport's position relative to the window."
     * @type {goog.math.Coordinate}
     * @see handlers.resize
     */
    this.viewport_position = null;

    /**
     * The control arrow elements, contains 4 element (up, down, left, right)
     * for each direction.
     * @type {Object.<number, Element>
     * @see PostBoard.bindKeyEvents Since it's initialized there.
     */
    this.direction_controllers = {};

    /**
     * @type {postile.fx.Animate}
     * @see handlers.arrow_control_mouseover Initialized there.
     */
    this.direction_controllers_animation = null;

    /**
     * "Right click display"
     * @type {Element}
     * @see bindMouseEvents
     */
    this.right = goog.dom.createDom('div', 'right_clicker');

    /**
     * A valid area for which we've got all data we need and keep refreshing from the server.
     * @type {postile.view.post_board.Area}
     * @deprecated This variable is currently not being used.
     */
    this.currentSubscribeArea = null;

    /**
     * "Max zIndex of posts currently."
     * @type {number}
     */
    this.maxZIndex = 100; //defined in post_board.js

    /**
     * Saves the coord of cursor when a mousedown event occurs.
     * @type {Array.<number>}
     * @see bindMouseEvents
     */
    this.click_start_point = null;

    /**
     * Saves the coord of cursor when a mousedown event occurs.
     * @type {Object.<direction, number>}
     * @see updateSubscribeArea
     */
    this.subscribedArea = null;

    /**
     * Throttle subscription updating when scrolling
     * @type {postile.delayedThrottle}
     */
    // this.scrollUpdateThrottle = new postile.DelayedThrottle(function() { instance.updateSubscribeArea(); }, 500);

    // Initialize according to board_id
    postile.ajax([ 'board', 'enter_board' ], { board_id: board_id }, function(data) {
        instance.boardData = data.message.board;

        instance.userData = postile.data_manager.getUserData(localStorage.postile_user_id, function(data) {
            instance.userData = data;

            instance.channel_str = instance.boardData.id;

            postile.faye.subscribe(instance.channel_str, function(status, data) {
                instance.fayeHandler(status, data);
            });
            postile.faye.subscribe('status/'+instance.boardData.id, function(status, data){
                instance.onlinepeople.count = data.count;
                instance.onlinepeople.id = data.users;
                if(instance.onlinepeople.is_expended) {
                    instance.updateOnlinePeople();
                }else{
                    instance.updateOnlineCount();
                }
            });
            postile.faye.subscribe('status/board/'+instance.boardData.id+'/user/'+instance.userData.id, function(status, data) {
            });


            instance.initView();
            instance.initEvents();

            // Initialize viewport size
            postile.view.post_board.handlers.resize(instance);

            // Get to the post, if set in URL
            var new_post = parseInt(window.location.hash.substr(1));
            if (new_post) {
                instance.moveToPost(new_post);
            }
        });
    });
}

goog.inherits(postile.view.post_board.PostBoard, postile.view.FullScreenView);

/**
 * "Postile.view.View required component."
 * @override
 */
postile.view.post_board.PostBoard.prototype.unloaded_stylesheets = ['fonts.css', 'post_board.css', '_post_in_board.css'];

/**
 * @type {string}
 * @const
 */
postile.view.post_board.PostBoard.prototype.html_segment = postile.conf.staticResource(['post_board.html']);

/**
 * Initialize view components. Called after receiving initial board data.
 * @see PostBoard
 */
postile.view.post_board.PostBoard.prototype.initView = function() {
    var instance = this;

    this.picker = new postile.view.post_board.PostPicker(this);
    this.header = new postile.view.post_board.Header(this);
    this.postCreator = new postile.view.post_board.PostCreator(this);


    goog.dom.appendChild(this.catchall, this.viewport);
    goog.dom.appendChild(this.viewport, this.canvas);

    goog.dom.appendChild(goog.dom.getElement("wrapper"), this.header.container);
    goog.dom.appendChild(goog.dom.getElement("wrapper"), this.catchall);
    // We have to append the header before add the online people bar,
    // otherwise there is no way to get the size of the header bar.
    this.onlinepeople = new Object();
    this.onlinepeople.view = new postile.view.onlinepeople.OnlinePeople(this.header);
    this.onlinepeople.count = 0;
    this.onlinepeople.view.render();
    this.onlinepeople.is_expended = false;
    goog.events.listen(this.onlinepeople.view.container, goog.events.EventType.CLICK, function() {
        if(!instance.onlinepeople.is_expended){
            instance.onlinepeople.is_expended = true;
            instance.updateOnlinePeople();
        }else {
            instance.onlinepeople.is_expended = false;
            instance.onlinepeople.view.online_list.innerHTML = " ";
        }
    });

    /**
     * Main viewport and canvas
     */
    this.catchall.rel_data = this;
    this.viewport.rel_data = this;
    this.canvas.rel_data = this;

    if (!goog.userAgent.MAC) {
        new postile.view.post_board.MouseMoveScroll(this);
    }
}

/**
 * Initialize event listeners. Called after initializing views.
 * @see PostBoard
 */
postile.view.post_board.PostBoard.prototype.initEvents = function() {
    this.bindWindowEvents();
    this.bindMouseEvents();
    this.bindKeyEvents();
}

/**
 * Initialize mouse event listeners.
 * @see initEvents
 */
postile.view.post_board.PostBoard.prototype.bindMouseEvents = function() {
    var instance = this;

    // Disable text selecting, for IE.
    goog.events.listen(this.viewport, goog.events.EventType.SELECTSTART, function() {
        return false;
    });

    goog.events.listen(this.viewport, goog.events.EventType.SCROLL, function() {
        instance.canvasCoord[0] = - instance.viewport.scrollLeft;
        instance.canvasCoord[1] = - instance.viewport.scrollTop;
        // instance.scrollUpdateThrottle.kick();
    });

    // Start: controllers for moving the viewport
    goog.dom.appendChild(this.catchall, this.right);

    goog.events.listen(this.catchall, goog.events.EventType.CONTEXTMENU, function(e) {
        e.preventDefault();
    });

    // See issue #12 - disable right-click drag
    // Also see below.
    //goog.events.listen(this.catchall, goog.events.EventType.MOUSEDOWN, function(e) {
    //    instance.click_start_point = [e.clientX, e.clientY];

    //    if (!e.isButton(2)) {
    //        // Right mouse button
    //        return;
    //    }

    //    instance.right.style.left = e.clientX - 53 + 'px'; // TODO: replace the magic number
    //    instance.right.style.top = e.clientY - 53 + 'px'; // TODO: replace the magic number
    //    instance.right.style.display = 'block';
    //});

    goog.events.listen(this.catchall, goog.events.EventType.CLICK, function(e) {
        if (!instance.click_start_point) { return; }
        var dy = e.clientY - instance.click_start_point[1];
        var dx = e.clientX - instance.click_start_point[0];
        if (Math.abs(dy) > 2 && Math.abs(dx) > 2) {
            // Left dragging
            e.stopPropagation();
        }
    }, true);

    // (Continued) disable right-click drag
    //goog.events.listen(this.catchall, goog.events.EventType.MOUSEUP, function(e) {
    //    var dy = e.clientY - instance.click_start_point[1];
    //    var dx = e.clientX - instance.click_start_point[0];

    //    if (!e.isButton(2) || Math.abs(dx) + Math.abs(dy) < 3) {
    //        // Right mouse button
    //        return;
    //    }

    //    this.rel_data.right.style.display = 'none';
    //    var length = Math.sqrt(Math.pow(dx, 2)+Math.pow(dy, 2));

    //    this.rel_data.moveCanvas(dx / 2 / length * this.offsetWidth, dy / 2 / length * this.offsetHeight);
    //});
    //goog.events.listen(this.canvas, goog.events.EventType.DBLCLICK,
    //        function(){ instance.postCreator.open(); });
};

/**
 * Initialize key event listeners.
 * @see initEvents
 */
postile.view.post_board.PostBoard.prototype.bindKeyEvents = function() {
    var instance = this;

    this.keyboard_event_handler = new postile.events.EventHandler(postile.conf.getGlobalKeyHandler(),
            goog.events.KeyHandler.EventType.KEY, function(e) {
                postile.view.post_board.handlers.keypress(instance, e);
            });
    this.keyboard_event_handler.listen();

    // See issue #12 - disable arrow button move
    return;

    //for (i in postile.view.post_board.direction_norm_to_css) {
    //    this.direction_controllers[i] = goog.dom.createDom('div', ['arrow_detect', i]);
    //    this.direction_controllers[i].direction = i;

    //    // Each one has a .button property pointing to the child
    //    this.direction_controllers[i].button = goog.dom.createDom('div', 'arrow_button');

    //    goog.dom.appendChild(this.direction_controllers[i], this.direction_controllers[i].button);
    //    goog.dom.appendChild(this.direction_controllers[i].button, goog.dom.createDom('div'));
    //    goog.dom.appendChild(this.direction_controllers[i], goog.dom.createDom('div', 'arrow_covering'));
    //    goog.dom.appendChild(this.catchall, this.direction_controllers[i]);

    //    goog.events.listen(this.direction_controllers[i], goog.events.EventType.CLICK,
    //            postile.view.post_board.handlers.arrow_control_click);
    //    goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEMOVE,
    //            postile.view.post_board.handlers.arrow_control_mousemove);
    //    goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEOVER,
    //            postile.view.post_board.handlers.arrow_control_mouseover);
    //    goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEOUT,
    //            postile.view.post_board.handlers.arrow_control_mouseout);
    //}

}

/**
 * Initialize window event listeners.
 * @see initEvents
 */
postile.view.post_board.PostBoard.prototype.bindWindowEvents = function() {
    var instance = this;
    this.window_resize_event_handler = new postile.events.EventHandler(window,
            goog.events.EventType.RESIZE, function() {
                postile.view.post_board.handlers.resize(instance);
            });
    this.window_resize_event_handler.listen();
}

/**
 * "Postile.view.View required component."
 * @override
 */
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

/**
 * "Return true only when it's movable"
 * Move the canvas in the given direction by half of the screen size.
 * @param {string} direction Which direction to move to.
 * @return {boolean} true if is movable.
 * @see moveCanvas
 */
postile.view.post_board.PostBoard.prototype.preMoveCanvas = function(direction) {
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

/**
 * Adjust the screen to center the given post.
 * @param {number} pid The post id to move to.
 */
postile.view.post_board.PostBoard.prototype.moveToPost = function(pid) {
    var instance = this;
    var doFunc = function() {
        var p = instance.currentPosts[pid].post;
        instance.locateCanvas(-(instance.xPosTo(p.pos_x) + instance.widthTo(p.span_x) / 2 - instance.viewport.offsetWidth / 2), -(instance.yPosTo(p.pos_y) + instance.heightTo(p.span_y) / 2 - instance.viewport.offsetHeight / 2));
    };
    if (pid in this.currentPosts) {
        doFunc();
    } else {
        this.renderById(pid, doFunc);
    }
}

/**
 * Move the canvas by a certain offset.
 * @param {number} dx Distance to move, in x axis.
 * @param {number} dy Distance to move, in y axis.
 * @return {boolean} Whether the canvas is movable (and thus moved).
 */
postile.view.post_board.PostBoard.prototype.moveCanvas = function(dx, dy) {
    if (this.disableMovingCanvas) {
        // Do not respond to actions if the user is actually dragging.
        return false;
    }
    this.locateCanvas(this.canvasCoord[0] - dx, this.canvasCoord[1] - dy);
    return true;
}

/**
 * Move the canvas to a certain position.
 * @param {number} leftTarget Target x-coord to move to.
 * @param {number} topTarget Target y-coord to move to.
 * @return {boolean} Whether the canvas is movable (and thus moved).
 */
postile.view.post_board.PostBoard.prototype.locateCanvas = function(
        leftTarget,
        topTarget) {

    var i;
    var instance = this;
    var arrow_hide = {}; // The arrow index to hide.

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
           instance.viewport.scrollLeft = - (instance.canvasCoord[0] * (1 - iter) + leftTarget * iter);
           instance.viewport.scrollTop = - (instance.canvasCoord[1] * (1 - iter) + topTarget * iter);
        }, 600, {
            ease: postile.fx.ease.sin_ease,
            callback: function() {
                instance.canvasCoord[0] = leftTarget;
                instance.canvasCoord[1] = topTarget;
                var i;
                instance.disableMovingCanvas = false;
                for (i in instance.direction_controllers) {
                    if (!arrow_hide[i]) {
                        instance.direction_controllers[i].style.display = 'block';
                    }
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
    instance.updateSubscribeArea();
}

/**
 * "Convent length from 'unit length' of the grid to pixel."
 * @param {number} u Grid length to be converted
 * @return {number} Corresponding pixel length
 * @see heightTo, xPosTo, yPosTo
 */
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

/**
 * "Convent length to 'unit length' of the grid from pixel.
 *  It is from the center grid points so margins and paddings are ignored."
 * @param {number} px Pixel length to be converted
 * @return {number} Corresponding grid length
 * @see yPosFrom
 */
postile.view.post_board.PostBoard.prototype.xPosFrom = function(px) {
    return ((px + postile.view.post_board.POST_MARGIN / 2 - this.canvasSize[0] / 2)
            / (postile.view.post_board.POST_WIDTH + postile.view.post_board.POST_MARGIN));
};

postile.view.post_board.PostBoard.prototype.yPosFrom = function(px) {
    return ((px + postile.view.post_board.POST_MARGIN / 2 - this.canvasSize[1] / 2)
            / (postile.view.post_board.POST_HEIGHT + postile.view.post_board.POST_MARGIN));
};

/**
 * Maps a certain direction to its corresponding css attribute.
 * @enum {string}
 */
postile.view.post_board.direction_norm_to_css = {
    up:    'top',
    down:  'bottom',
    left:  'left',
    right: 'right'
};

/**
 * Represents an area, contains 4 attributes: left, top, right and bottom.
 * @typedef {Object.<string, number>}
 */
postile.view.post_board.Area;

/**
 * Get visible area in the unit of "grid unit".
 * @param {Array.<number>} source The relative base point.
 * It is expected to be this.canvasCoord or [parseInt(this.canvas.style.left), parseInt(this.canvas.style.top)]
 * @return {postile.view.post_board.Area}
 * @deprecated This function is not being used at the moment.
 */
postile.view.post_board.PostBoard.prototype.getVisibleArea = function(source) {
    return {
        left: Math.floor(this.xPosFrom(-source[0])),
        top: Math.floor(this.yPosFrom(-source[1])),
        right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth - source[0])),
        bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight - source[1]))
    };
}

/**
 * Get subscribe area in the unit of "grid unit".
 * @param {Array.<number>} source The relative base point.
 * @return {postile.view.post_board.Area}
 */
postile.view.post_board.PostBoard.prototype.getSubscribeArea = function(source) {
    /**
     * The size of preloaded area, in screen length.
     * 0 for exactly visible area (no preload),
     * n for extend n screen length on all directions.
     * @type {number}
     */
    var preloadRadio = 1;

    return {
        left: Math.floor(this.xPosFrom(-source[0] - preloadRadio*this.viewport.offsetWidth)),
        top: Math.floor(this.yPosFrom(-source[1] - preloadRadio*this.viewport.offsetHeight)),
        right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth*(1+preloadRadio) - source[0])),
        bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight*(1+preloadRadio) - source[1]))
    };
}

/**
 * Fetch the posts in the new area and subscribe it.
 */
postile.view.post_board.PostBoard.prototype.updateSubscribeArea = function() {
    var instance = this;
    var current_loc = this.canvasCoord;
    var to_subscribe = this.getSubscribeArea(current_loc);
    do {
        if (!this.subscribedArea) { break; }
        if (to_subscribe.left != this.subscribedArea.left) { break; }
        if (to_subscribe.right != this.subscribedArea.right) { break; }
        if (to_subscribe.top != this.subscribedArea.top) { break; }
        if (to_subscribe.bottom != this.subscribedArea.bottom) { break; }
        return;
    } while(false);
    /*
    if (!this.isAreaFullInside(this.currentSubscribeArea, this.getVisibleArea(currentLoc))) {
        // TODO: display loading
    }
    */
    to_subscribe.board_id = instance.board_id;
    postile.ajax(['board', 'move_to'], to_subscribe, function(data) {
        instance.subscribedArea = to_subscribe;
        instance.renderArray(data.message.posts);
    }, 'Loading posts...', true);
}

/**
 * Test if one area fully contains the other area. Note that this function
 * will return true if the two areas are equal in size.
 * @param {postile.view.post_board.Area} parent The outer area to test.
 * @param {postile.view.post_board.Area} child The inner area to test.
 * @return {boolean} true if fully contains, false otherwise.
 * @deprecated This function is current not being used.
 */
postile.view.post_board.PostBoard.prototype.isAreaFullInside = function(parent, child) {
    return (parent.left <= child.left
            && parent.right >= child.right
            && parent.top <= child.top
            && parent.bottom >= child.bottom);
}

/**
 * Object { post: <post attrs>, username: <string> }
 * @typedef
 */
postile.view.post_board.NamedPostData;

/**
 * Add post objects to the screen.
 * Note this function only adds and does not care about any duplicate.
 * @param {Array.<postile.view.post_board.NamedPostData} array
 */
postile.view.post_board.PostBoard.prototype.renderArray = function(array) {
    for (var i in array) {
        this.renderPost(array[i]);
    }
};

/**
 * @param {postData} post to render
 * @param {mode} the mode that the post starts with
 */
postile.view.post_board.PostBoard.prototype.renderPost = function(postData, mode) {
    mode = mode || postile.view.post.Post.PostMode.DISPLAY; // default to display mode

    if (!postData.post.id) { // invalid post
        return;
    }

    var postId = postData.post.id;

    if (postId in this.currentPosts) { // old post to update
        // update postData attributes
        for (var i in this.currentPosts[postId].postData.post) {
            if (postData.post[i] && this.currentPosts[postId].postData.post[i] != postData.post[i]) {
                this.currentPosts[postId].postData.post[i] = postData.post[i];
            }
        }

        this.currentPosts[postId].changeCurrentMode(mode);
    } else { // new post to add to list
        this.currentPosts[postId] = postile.view.post.createPostFromJSON(postData, this, mode);
    }

    if (postData.post.in_edit) {
        if (!this.currentPosts[postId].isSelfPost()) {
            this.currentPosts[postId].changeCurrentMode(postile.view.post.Post.PostMode.LOCKED);
        }
    }
}

/**
 * @param {number} pid Post id to render.
 * @param {Function} callback Function to be called after fetching and
 * rendering are done.
 */
postile.view.post_board.PostBoard.prototype.renderById = function(pid, callback) {
    var instance = this;
    postile.ajax(['post', 'get_post'], { post_id: pid }, function(r) {
        if (r.message.post.board_id != instance.board_id) {
            new postile.toast.Toast(10, "The post is not in the current board. [Click to go] to another board and view.", [function() {
                postile.router.dispatch('board/' + r.message.post.board_id + '#' + pid);
            }]);
            return;
        }
        instance.renderArray([r.message]);
        callback();
    });
}

/**
 * Handles faye's response and manipulates the board.
 * @param {postile.view.post_board.faye_status} status
 * @param {Object} data Faye response
 */
postile.view.post_board.PostBoard.prototype.fayeHandler = function(status, data) {
    switch (status) {
    case postile.view.post_board.faye_status.FINISH:
        var currPost = this.currentPosts[data.post.id];

        if (!currPost.isSelfPost()) { // not my own post
            this.renderPost(data, postile.view.post.Post.PostMode.DISPLAY);
        }
        break;

    case postile.view.post_board.faye_status.START:
        var currPost = this.currentPosts[data.post.id];
        if (data.post.id in this.currentPosts) { // already exists
            if (!currPost.isSelfPost()) { // not my own post
                currPost.changeCurrentMode(postile.view.post.Post.PostMode.LOCKED);
            }
        } else { // newly created
            this.renderPost(data, postile.view.post.Post.PostMode.NEW);
        }
        break;

    case postile.view.post_board.faye_status.DELETE:
        var currPost = this.currentPosts[data.post.id];
        if (data.post.id in this.currentPosts) {
            if (!currPost.isSelfPost()) {
                this.removePost(data.post.id);
            }
        }
        break;
    case postile.view.post_board.faye_status.INLINE_COMMENT:
        if (data.inline_comment.post_id in this.currentPosts) {
            var currPost = this.currentPosts[data.inline_comment.post_id];
            currPost.resetCommentPreview(data);
            currPost.hideNoCommentEl();

            if (!currPost.inlineCommentRendered(data)) {
                currPost.inline_comments.push(data);
                currPost.appendInlineComment(data);
            }
        }
        break;
    }
}

postile.view.post_board.PostBoard.prototype.updateOnlinePeople = function() {
    this.updateOnlineCount();
    var online_list = this.onlinepeople.view.online_list;
    online_list.innerHTML="";
    for(var i = 0; i < this.onlinepeople.id.users.length; i++) {
        var item = new postile.view.onlinepeople.Item();
        item.renderItem(this.onlinepeople.view, this.onlinepeople.id.users[i]);
    }
}

postile.view.post_board.PostBoard.prototype.updateOnlineCount = function() {
    var thecount = this.onlinepeople.count;
    var count_container = postile.dom.getDescendantById(this.onlinepeople.view.container
        ,'count');
    count_container.innerHTML = thecount;
}
postile.view.post_board.PostBoard.prototype.createPost = function(info) {
    var req = goog.object.clone(info);
    var ret = goog.object.clone(info);
    req.is_image = false;
    req.is_video = false;
    var instance = this;
    req.board_id = this.board_id;
    ret.text_content = '';

    postile.ajax(['post', 'new'], req, function(data) {
        instance.renderPost(data.message, postile.view.post.Post.PostMode.EDIT);
    });
}

postile.view.post_board.PostBoard.prototype.createImagePost = function(info, image_uri){
    var req = goog.object.clone(info);
    req.is_image = true;
    req.image_uri = image_uri;
    var ret = goog.object.clone(info);
    var instance = this;
    req.board_id = this.board_id;

    postile.ajax(['post', 'new'], req, function(data) {
        instance.renderArray([ { post: data.message.post, creator: data.message.creator} ]);
        instance.currentPosts[data.message.post.id].edit("title");
        //postile.ajax(['post','submit_change'], {post_id: data.message.post.post_id},function(data){console.log(data);});
    });
}

postile.view.post_board.PostBoard.prototype.createVideoPost = function(info, video_uri){
    var req = goog.object.clone(info);
    req.is_video = true;
    req.video_link = video_uri;
    var ret = goog.object.clone(info);
    var instance = this;
    req.board_id = this.board_id;

    postile.ajax(['post', 'new'], req, function(data) {
        instance.renderArray([ { post: data.message.post, creator: data.message.creator} ]);
        instance.currentPosts[data.message.post.id].edit("title");
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

/**
 * Status code. Must be kept in sync with backend.
 * @enum {string}
 */
postile.view.post_board.faye_status = {
    START: 'start',
    DELETE: 'delete',
    TERMINATE: 'terminate',
    FINISH: 'finish',
    INLINE_COMMENT: 'inline comment',
    NOTIFICATION: 'notification'
}

