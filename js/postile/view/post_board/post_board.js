/**

Some notice for the current demo:

The minimum unit of the grid is set to 75*50px, plus a margin of 14px and padding of 8px

TODO: implement realclick event which will not be triggered if dragging is activated

**/

goog.provide('postile.view.post_board');
goog.provide('postile.view.post_board.handlers');

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
goog.require('goog.events.KeyHandler');
goog.require('postile.toast');
goog.require('postile.events');
goog.require('postile.view.post_in_board');
goog.require('postile.view.board_more_pop');
goog.require('postile.view.confirm_delete');
goog.require('postile.view.profile');
goog.require('postile.view.notification');
goog.require('postile.view.search_box');

postile.view.post_board.handlers.canvas_mousedown = function(e) {
    if (!e.isButton(0)) { return; }
    var i;
    if(this.rel_data.disableMovingCanvas) { return; }
    this.rel_data.disableMovingCanvas = true;
    this.rel_data.mousedownCoord = [e.clientX, e.clientY];
    for(i in this.rel_data.direction_controllers) { //hide all dirction control arrows
        this.rel_data.direction_controllers[i].style.display = 'none';
    }
    if (this.rel_data.canva_shadow_animation) {
        this.rel_data.canva_shadow_animation.stop(); //stop current animation
    }
};

postile.view.post_board.handlers.canvas_mouseup = function(e) { 
    var post_board = this.rel_data;
    if (!e.isButton(0)) { return; }
    if (!this.rel_data.mousedownCoord) { return; } //not legally mouse-downed
    post_board.disableMovingCanvas = false;
    if (e.clientX == post_board.mousedownCoord[0] && e.clientY == post_board.mousedownCoord[1]) { post_board.mousedownCoord = null; return; }
    post_board.mousedownCoord = null;
    post_board.canvasCoord = [parseFloat(this.style.left),parseFloat(this.style.top)];
    //animation of outbound shadow
    var init = post_board.shadowCoord.slice();
    var total = Math.max(Math.abs(post_board.shadowCoord[0]),Math.abs(post_board.shadowCoord[1]));
    if (post_board.shadowCoord[0] || post_board.shadowCoord[1]) {
        post_board.canva_shadow_animation = new postile.fx.Animate(function(i){
            var now = i * total;
            if (init[0] < 0) { post_board.shadowCoord[0] = now > -init[0] ? 0 : init[0] + now; }
            else if (init[0] > 0) { post_board.shadowCoord[0] = now > init[0] ? 0 : init[0] - now; }
            if (init[1] < 0) { post_board.shadowCoord[1] = now > -init[1] ? 0 : init[1] + now; }
            else if (init[1] > 0) { post_board.shadowCoord[1] = now > init[1] ? 0 : init[1] - now; }
            post_board.canvasOutBoundAnimation();
        }, 800, postile.fx.ease.cubic_ease_out);
    }
    //update display status of dirction control arrows
    if (post_board.shadowCoord[1] <= 0) { post_board.direction_controllers['up'].style.display = 'block'; }
    if (post_board.shadowCoord[0] >= 0) { post_board.direction_controllers['right'].style.display = 'block'; }
    if (post_board.shadowCoord[1] >= 0) { post_board.direction_controllers['down'].style.display = 'block'; }
    if (post_board.shadowCoord[0] <= 0) { post_board.direction_controllers['left'].style.display = 'block'; }
    //update subscribe area
    post_board.updateSubsribeArea();
};

postile.view.post_board.handlers.canvas_mousemove = function(e) {
    if (!this.rel_data.mousedownCoord) { return; } //mouse key not down yet
    var leftTarget = e.clientX - this.rel_data.mousedownCoord[0] + this.rel_data.canvasCoord[0];
    var topTarget = e.clientY - this.rel_data.mousedownCoord[1] + this.rel_data.canvasCoord[1];
    var rightTarget = leftTarget - this.parentNode.offsetWidth + this.offsetWidth;
    var bottomTarget = topTarget - this.parentNode.offsetHeight + this.offsetHeight;
    this.rel_data.shadowCoord[0] = 0;
    this.rel_data.shadowCoord[1] = 0;
    if (leftTarget > 0) { //test left boundout(attempt to drag out of the boundary)
        this.rel_data.shadowCoord[0] = leftTarget;
        leftTarget = 0;
    } else if (rightTarget < 0) { //test right boundout
        this.rel_data.shadowCoord[0] = rightTarget;
        leftTarget -= rightTarget;
    }
    if (topTarget > 0) { //test top boundout
        this.rel_data.shadowCoord[1] = topTarget;
        topTarget = 0;
    } else if (bottomTarget < 0) { //test bottom boundout
        this.rel_data.shadowCoord[1] = bottomTarget;
        topTarget -= bottomTarget;
    }
    this.style.left = leftTarget + 'px';
    this.style.top = topTarget + 'px'; //apply the shadow boundout effect
    this.rel_data.canvasOutBoundAnimation();
};

//mouseevents for the mask
postile.view.post_board.handlers.mask_mousedown = function(e){ //find the closest grid point
    this.rel_data.newPostStartCoord = [Math.round(this.rel_data.xPosFrom(e.clientX - this.rel_data.canvasCoord[0])), Math.round(this.rel_data.yPosFrom(e.clientY - this.rel_data.canvasCoord[1]))]; //record current coordinate in the unit of "grid unit" //TODO: detect if the start point is legal (if there is available space around it)
    this.post_preview_origin_spot.style.left = this.rel_data.xPosTo(this.rel_data.newPostStartCoord[0])+this.rel_data.canvasCoord[0]-17+'px';
    this.post_preview_origin_spot.style.top = this.rel_data.yPosTo(this.rel_data.newPostStartCoord[1])+this.rel_data.canvasCoord[1]-17+'px';
    this.post_preview_origin_spot.style.display = 'block';
};

postile.view.post_board.handlers.mask_mousemove = function(e){ //mouse key not down yet
    if (!this.rel_data.newPostStartCoord) { return; }
    var current = [this.rel_data.xPosFrom(e.clientX - this.rel_data.canvasCoord[0]), this.rel_data.yPosFrom(e.clientY - this.rel_data.canvasCoord[1])];
    var delta = [0, 0];
    var end = [0, 0];
    var i;
    for (i = 0; i < 2; i++) {
        delta[i] = current[i] - this.rel_data.newPostStartCoord[i]; //calculate the expected width/height in the unit of "grid unit"
        if (delta[i] < 0) { //if in doubt, use brute force
            if (delta[i] > -1) { delta[i] = -1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.rel_data.newPostStartCoord[i] + delta[i];
            end[i] = this.rel_data.newPostStartCoord[i];
        } else {
            if (delta[i] < 1) { delta[i] = 1; } else { delta[i] = Math.round(delta[i]); }
            current[i] = this.rel_data.newPostStartCoord[i];
            end[i] = this.rel_data.newPostStartCoord[i] + delta[i];
        }
    }
    //now "current" saves the smaller value and "end" saves the larger one
    //check if available
    var intersect = false;
    for (i in this.rel_data.currentPosts) {
        //from http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
        if(!(current[0] >= this.rel_data.currentPosts[i].post.coord_x_end || end[0] <= this.rel_data.currentPosts[i].post.coord_x || current[1] >=this.rel_data.currentPosts[i].post.coord_y_end || end[1] <= this.rel_data.currentPosts[i].post.coord_y)) { 
            intersect = true;
            break;
        }
    }
    //draw on the canvas
    this.position = { coord_x: current[0], coord_y: current[1], span_x: Math.abs(delta[0]), span_y: Math.abs(delta[1]) };
    this.preview.style.left = this.rel_data.xPosTo(this.position.coord_x) + this.rel_data.canvasCoord[0] + 'px';
    this.preview.style.top = this.rel_data.yPosTo(this.position.coord_y) + this.rel_data.canvasCoord[1] + 'px';
    this.preview.style.width = this.rel_data.widthTo(this.position.span_x) + 'px';
    this.preview.style.height = this.rel_data.heightTo(this.position.span_y) + 'px';
    this.legal = (!intersect) && this.position.span_x > 1 && this.position.span_y > 1;
    this.preview.style.backgroundColor = this.legal ? '#e4eee4': '#f4dcdc';
    this.preview.style.display = 'block';
};

postile.view.post_board.handlers.mask_mouseup = function(e){
    this.rel_data.disableMovingCanvas = false;
    this.rel_data.newPostStartCoord = null;
    this.post_preview_origin_spot.style.display = 'none';
    if (!this.legal) {
        return;
    }
    this.preview.style.display = 'none';
    this.legal = false;
    this.rel_data.createPost(this.position);
};

//activated double click event for creating new boxes
postile.view.post_board.handlers.canvas_dblclick = function(e){
    this.rel_data.disableMovingCanvas = true;
    this.rel_data.mask.style.display = 'block';
};

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
    this.parentNode.rel_data.direction_controllers_animation = new postile.fx.Animate(function(iter) { hover.style[css_name] = 40-40*iter + 'px'; }, 500, false, function(){ hover.parentNode.style.display = 'none'; rel_data.preMoveCanvas(direction); });
}

postile.view.post_board.handlers.arrow_control_mouseout = function() {
    this.parentNode.rel_data.direction_controllers_animation.stop();
    this.button.style.display = 'none';
}

postile.view.post_board.handlers.resize = function(instance){ //called on window.resize
    instance.canvas.style.display = 'block'; 
    var new_viewport_size = [window.innerWidth,  window.innerHeight - 45]; //45 is the menu bar height
    if (!instance.canvasCoord) { //first time (initialize)
        instance.canvasCoord = [(new_viewport_size[0] - instance.canvasSize[0])/2, (new_viewport_size[1] - instance.canvasSize[1])/2];
    } else { //window resize
        //keep the center in the same position
        instance.canvasCoord[0] += (new_viewport_size[0] - parseInt(instance.viewport.style.width))/2;
        instance.canvasCoord[1] += (new_viewport_size[1] - parseInt(instance.viewport.style.height))/2;
    }
    instance.viewport.style.width = new_viewport_size[0] + 'px'; instance.viewport.style.height = new_viewport_size[1] + 'px';
    instance.canvas.style.left = instance.canvasCoord[0] + 'px'; instance.canvas.style.top = instance.canvasCoord[1] + 'px';   
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

postile.view.post_board.PostBoard = function(topic_id) { //constructor
    var i;
    var keyHandler;
    var instance = this;
    postile.view.FullScreenView.call(this);

    /* BEGINNING OF MEMBER DEFINITION */
    this.topic_id = topic_id;
    this.channel_str = null;
    this.mousedownCoord = null; //record the mouse position when mousedown triggered
    this.canvasCoord = null; //current canvas position relative to the canvas viewport
    this.shadowCoord = [0, 0]; //current shadow (the boundary-out(boundout) effect)
    this.canvasSize = [3872, 2592]; //the size of the canvas currently
    this.canva_shadow_animation = null; //the animation for the outbound shadow
    this.disableMovingCanvas = false; //when true, moving canvas is disabled temporarily
    this.currentPosts = {}; //an object containing all posts, as key = post_id and value = Post object
    this.newPostStartCoord = null; //hold the starting point of a new post in an array with the unit of "grid unit"
    this.viewport = goog.dom.createDom('div', 'canvas_viewport'); //disable text selecting
    this.canvas = goog.dom.createDom('div', 'canvas'); //the canvas being dragged
    this.mask = goog.dom.createDom('div', 'canvas_mask'); //the mask used when creating new post
    this.mask_notice = goog.dom.createDom('div', 'mask_notice'); //text
    this.direction_controllers = {}; //the control arrows
    this.direction_controllers_animation = null;
    this.right = goog.dom.createDom('div', 'right_clicker'); //right click display
    this.currentSubscribeArea = null; //a valid area for which we've got all data we need and keep refreshing from the server
    this.window_resize_event_handler = new postile.events.EventHandler(window, goog.events.EventType.RESIZE, function() { postile.view.post_board.handlers.resize(instance); });
    this.window_resize_event_handler.listen();
    this.keyboard_event_handler = new postile.events.EventHandler(postile.getGlobalKeyHandler(), goog.events.KeyHandler.EventType.KEY, function(e) { postile.view.post_board.handlers.keypress(instance, e); });
    this.keyboard_event_handler.listen();
    this.maxZIndex = 0; //max zIndex of posts currently
    /* END OF MEMBER DEFINITION */
    goog.events.listen(this.viewport, goog.events.EventType.SELECTSTART, function(){ return false; }); //disable text selecting, for ie

    goog.dom.appendChild(goog.dom.getElement("wrapper"), this.viewport);

    this.function_buttons = goog.dom.getElementsByClass('function_button');
    for (var i = 0; i < this.function_buttons.length; i++) {
        new postile.view.post_board.FunctionButton(this.function_buttons[i]);
    }

    /*
    this.search_input_field = goog.dom.getElement("search_input_field");
    goog.events.listen(this.search_input_field, goog.events.EventType.KEYUP, postile.view.post_board.handlers.search);

    // search button container
    this.search_button = goog.dom.getElement("search_button");

    // popup search box
    this.search_box = goog.dom.getElement("search_box");

    goog.events.listen(this.search_button, goog.events.EventType.CLICK, function(e) {
        this.search_box.style.display = "block";

        // hides all the search result containers
        this.search_result_containers = goog.dom.getElementsByClass("search_result_category");
        for (i = 0; i < this.search_result_containers.length; i++) {
            goog.style.showElement(this.search_result_containers[i], false);
        }
    }.bind(this));
    */

    var search_button = goog.dom.getElement("search_button");
    goog.events.listen(search_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.search_box.SearchBox(search_button)).open(search_button);
    });

    var switch_board_button = goog.dom.getElement("switch_board_button");
    goog.events.listen(switch_board_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.board_more_pop.OtherBoard(switch_board_button)).open(switch_board_button);
    });

    var message_button = goog.dom.getElement("message_button");
    goog.events.listen(message_button, goog.events.EventType.CLICK, function(e) {
        (new postile.view.notification.Notification(message_button)).open(message_button);
    });

    goog.dom.appendChild(this.viewport, this.canvas);
    goog.dom.appendChild(this.viewport, this.mask);
    goog.dom.appendChild(this.mask, this.mask_notice);
    this.mask_notice.innerHTML = 'Click & Drag to add a post<br />Double click again to quit';
    this.viewport.rel_data = this;
    this.canvas.rel_data = this;
    this.mask.rel_data = this;
    this.mask.preview = goog.dom.createDom('div', 'post_preview');
    goog.dom.appendChild(this.mask, this.mask.preview);
    this.mask.post_preview_origin_spot = goog.dom.createDom('div', {'class': 'post_preview_origin_spot'});
    goog.dom.appendChild(this.mask, this.mask.post_preview_origin_spot);
    /*start: controllers for moving the viewport*/
    goog.dom.appendChild(this.viewport, this.right);
    goog.events.listen(this.viewport, goog.events.EventType.CONTEXTMENU, function(e) { e.preventDefault(); });
    goog.events.listen(this.viewport, goog.events.EventType.MOUSEDOWN, function(e) {
        if (!e.isButton(2)) { return; }
        this.rel_data.right.style.left = e.clientX - 53 + 'px';
        this.rel_data.right.style.top = e.clientY - 53 + 'px';
        this.rel_data.right.style.display = 'block';
        this.rel_data.right._start_point = [e.clientX, e.clientY];
    });
    goog.events.listen(this.viewport, goog.events.EventType.MOUSEUP, function(e) {
        if (!e.isButton(2)) { return; }
        this.rel_data.right.style.display = 'none';
        var dy = e.clientY - this.rel_data.right._start_point[1];
        var dx = e.clientX - this.rel_data.right._start_point[0];
        var length = Math.sqrt(Math.pow(dx, 2)+Math.pow(dy, 2));
        this.rel_data.moveCanvas(dx / 2 / length * this.offsetWidth, dy / 2 / length * this.offsetHeight);
    });
    for (i in postile.view.post_board.direction_norm_to_css) {
        this.direction_controllers[i] = goog.dom.createDom('div', ['arrow_detect', i]);
        this.direction_controllers[i].direction = i;
        this.direction_controllers[i].button = goog.dom.createDom('div', 'arrow_button'); //each one has a .button property pointing to the child
        goog.dom.appendChild(this.direction_controllers[i], this.direction_controllers[i].button);
        goog.dom.appendChild(this.direction_controllers[i].button, goog.dom.createDom('div'));
        goog.dom.appendChild(this.direction_controllers[i], goog.dom.createDom('div', 'arrow_covering'));
        goog.dom.appendChild(this.viewport, this.direction_controllers[i]);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.CLICK, postile.view.post_board.handlers.arrow_control_click);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.arrow_control_mousemove);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEOVER, postile.view.post_board.handlers.arrow_control_mouseover);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.MOUSEOUT, postile.view.post_board.handlers.arrow_control_mouseout);
    }
    /*end*/
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.canvas_mousedown);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.canvas_mousemove);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.canvas_mouseup);
    goog.events.listen(this.canvas, goog.events.EventType.DBLCLICK, postile.view.post_board.handlers.canvas_dblclick);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.mask_mousedown);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.mask_mousemove);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.mask_mouseup);
    goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(e){ e.preventDefault(); this.style.display = 'none'; });
    //initialize according to topic_id
    postile.ajax(['topic','enter_topic'], { topic_id: topic_id }, function(data) {
        instance.channel_str = data.message.channel_str;
        postile.faye.subscribe(data.message.channel_str, function(status, data) { instance.fayeHandler(status, data); });
        //initialize viewport size
        postile.view.post_board.handlers.resize(instance);
    });
}

goog.inherits(postile.view.post_board.PostBoard, postile.view.FullScreenView);

//postile.view.View required component
postile.view.post_board.PostBoard.prototype.unloaded_stylesheets = ['fonts.css', 'post_board.css'];

postile.view.post_board.PostBoard.prototype.html_segment = postile.staticResource(['post_board.html']);

//postile.view.View required component
postile.view.post_board.PostBoard.prototype.close = function() {
    this.window_resize_event_handler.unlisten();
    this.keyboard_event_handler.unlisten();
    //informing the server that I'm fucking leaving
    var instance = this;
    postile.ajax(['topic','leave_topic'], { channel_str: this.channel_str }, function(data){
        if (data.message != instance.topic_id) {
            alert("Some error occured when leaving the topic.");
        }
    });
}

postile.view.post_board.PostBoard.prototype.canvasOutBoundAnimation = function(){ //called while the animation iteration
    this.canvas.style.boxShadow = this.shadowCoord[0]/10+'px '+this.shadowCoord[1]/10+'px '+Math.sqrt(Math.pow(this.shadowCoord[0], 2)+Math.pow(this.shadowCoord[1], 2))/10+'px 0 rgba(153, 153, 153, 0.75) inset';
};

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
    if (this.disableMovingCanvas) { return false; } //do not respond to actions if the user is actually dragging
    var leftTarget = this.canvasCoord[0];
    var topTarget = this.canvasCoord[1];
    var i;
    var instance = this;
    var arrow_hide = {}; //the arrow index to hide
    for (i in postile.view.post_board.direction_norm_to_css) { arrow_hide[i] = false; }
    leftTarget -= dx; topTarget -= dy;
    if (topTarget >= 0) { topTarget = 0; arrow_hide['up'] = true; }
    if (topTarget <= this.viewport.offsetHeight - this.canvasSize[1]) { topTarget = this.viewport.offsetHeight - this.canvasSize[1]; arrow_hide['down'] = true; }
    if (leftTarget >= 0) { leftTarget = 0; arrow_hide['left'] = true; }
    if (leftTarget <= this.viewport.offsetWidth - this.canvasSize[0]) { leftTarget = this.viewport.offsetWidth - this.canvasSize[0]; arrow_hide['right'] = true; }
    if (leftTarget != instance.canvasCoord[0] || topTarget != instance.canvasCoord[1]) {
        this.disableMovingCanvas = true;
        for (i in instance.direction_controllers) {
            instance.direction_controllers[i].style.display = 'none';
        }
        new postile.fx.Animate(function(iter) {
           instance.canvas.style.left = instance.canvasCoord[0]*(1-iter) + leftTarget*iter + 'px';
           instance.canvas.style.top = instance.canvasCoord[1]*(1-iter) + topTarget*iter + 'px';
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
                instance.direction_controllers[i].style.display = 'none';
            }
        }
    }
    instance.updateSubsribeArea();
    return true;
}

//convent length from "unit length" of the grid to pixel.
postile.view.post_board.PostBoard.prototype.widthTo = function(u) { return (u*(75+14) - 14); };
postile.view.post_board.PostBoard.prototype.heightTo = function(u) { return (u*(50+14) - 14); };
postile.view.post_board.PostBoard.prototype.xPosTo = function(u) { return (u*(75+14) + this.canvasSize[0]/2); };
postile.view.post_board.PostBoard.prototype.yPosTo = function(u) { return (u*(50+14) + this.canvasSize[1]/2); };
//convent length to "unit length" of the grid from pixel. it is from the center grid points so margins and paddings are ignored.
postile.view.post_board.PostBoard.prototype.xPosFrom = function(px) { return ((px - 7 - this.canvasSize[0]/2)/(75+14)); };
postile.view.post_board.PostBoard.prototype.yPosFrom = function(px) { return ((px - 7 - this.canvasSize[1]/2)/(50+14)); };
postile.view.post_board.direction_norm_to_css = { up: 'top', down: 'bottom', left: 'left', right: 'right' };

postile.view.post_board.PostBoard.prototype.getVisibleArea = function(source) { //get visible area in the unit of "grid unit" //source is esxpected to be this.canvasCoord or [parseInt(this.canvas.style.left), parseInt(this.canvas.style.top)]
    return { left: Math.floor(this.xPosFrom(-source[0])), top: Math.floor(this.yPosFrom(-source[1])), right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth - source[0])), bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight - source[1]))};
}

postile.view.post_board.PostBoard.prototype.getSubscribeArea = function(source) { //get subscribe area in the unit of "grid unit"
    var preloadRadio = 1; //the size of preloaded area. 0 for exactly visible area (no preload), n for extend n screen length on all directions.
    return { left: Math.floor(this.xPosFrom(-source[0] - preloadRadio*this.viewport.offsetWidth)), top: Math.floor(this.yPosFrom(-source[1] - preloadRadio*this.viewport.offsetHeight)), right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth*(1+preloadRadio) - source[0])), bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight*(1+preloadRadio) - source[1]))};
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
    to_subscribe.channel_str = this.channel_str;
    postile.ajax(['topic', 'move_to'], to_subscribe, function(data) {
        instance.renderArray(data.message);
    }, 'Loading posts...', true);
}

postile.view.post_board.PostBoard.prototype.isAreaFullInside = function(parent, child) {
    return (parent.left <= child.left && parent.right >= child.right && parent.top <= child.top && parent.bottom >= child.bottom);
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
            //waiting for lunba to give username
            if (data.id in this.currentPosts) {
                this.currentPosts[data.post.id].disable();
            } else {
                this.renderArray([data]);
            }
            break;
        case postile.view.post_board.faye_status.DELETE:
             //waiting for lunba to give username
            if (data.id in this.currentPosts) {
                this.currentPosts[data.post.id].removeFromBoard();
            }
            break;
    }
}

postile.view.post_board.PostBoard.prototype.createPost = function(info) {
    var req = goog.object.clone(info);
    var ret = goog.object.clone(info);
    var instance = this;
    req.topic_id = this.topic_id;
    ret.text_content = '';
    postile.ajax(['post','new'], req, function(data) {
        ret.id = data.message;
        instance.mask.style.display = 'none';
        instance.renderArray([{post: ret, username: ''}]);
        instance.currentPosts[ret.id].edit();
    });
}

postile.view.post_board.PostBoard.prototype.removePost = function(id) {
    if (this.currentPosts[id].wrap_el) { goog.dom.removeNode(this.currentPosts[id].wrap_el); } //remove original element
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
    START: 0,
    DELETE: 1,
    TERMINATE: 2,
    FINISH: 3,
    INLINE_COMMENT: 4,
    LINK_TO: 5,
}
