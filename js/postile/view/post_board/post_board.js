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
goog.require('postile.utils.ajax');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');

postile.view.post_board.PostBoard = function() { //constructor
    var i;
    var keyHandler;
    var instance = this;
    postile.view.View.call(this);
    /* BEGINNING OF MEMBER DEFINITION */
    this.mousedownCoord = null; //record the mouse position when mousedown triggered
    this.canvasCoord = null; //current canvas position relative to the canvas viewport
    this.shadowCoord = [0, 0]; //current shadow (the boundary-out(boundout) effect)
    this.canvasSize = [3872, 2592]; //the size of the canvas currently
    this.canva_shadow_animation = null; //the animation for the outbound shadow
    this.disableMovingCanvas = false; //when true, moving canvas is disabled temporarily
    this.currentArray = null; //an array containing all posts shown //TODO: is this really needed? anyway it is required at this moment
    this.newPostStartCoord = null; //hold the starting point of a new post in an array with the unit of "grid unit"
    this.viewport = goog.dom.createDom('div', 'canvas_viewport'); //disable text selecting
    this.canvas = goog.dom.createDom('div', 'canvas'); //the canvas being dragged
    this.mask = goog.dom.createDom('div', 'canvas_mask'); //the mask used when creating new post
    this.mask_notice = goog.dom.createDom('div', 'mask_notice'); //text
    this.direction_controllers = []; //the conntrol arrows
    this.currentSubscribeArea = null; //a valid area for which we've got all data we need and keep refreshing from the server
    /* END OF MEMBER DEFINITION */
    postile.browser_compat.setCss(this.viewport, 'userSelect', 'none');
    goog.events.listen(this.viewport, goog.events.EventType.SELECTSTART, function(){ return false; }); //disable text selecting
    goog.dom.appendChild(goog.dom.getElement('wrapper'), this.viewport);
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
    this.direction_controllers.push(goog.dom.createDom('div', {'class': 'arrow_control', 'title': 'up'}));
    this.direction_controllers.push(goog.dom.createDom('div', {'class': 'arrow_control', 'title': 'right'}));
    this.direction_controllers.push(goog.dom.createDom('div', {'class': 'arrow_control', 'title': 'down'}));
    this.direction_controllers.push(goog.dom.createDom('div', {'class': 'arrow_control', 'title': 'left'}));
    for (i in this.direction_controllers) {
        goog.dom.appendChild(this.viewport, this.direction_controllers[i]);
        goog.events.listen(this.direction_controllers[i], goog.events.EventType.CLICK, postile.view.post_board.handlers.arrow_control_click);
    }
    keyHandler = new goog.events.KeyHandler(document);
    goog.events.listen(keyHandler, 'key', function(e) {
        e.preventDefault();
        switch (e.keyCode) {
            case goog.events.KeyCodes.LEFT:
                instance.moveCanvas('left');
                break;
            case goog.events.KeyCodes.RIGHT:
                instance.moveCanvas('right');
                break;
            case goog.events.KeyCodes.UP:
                instance.moveCanvas('up');
                break;
            case goog.events.KeyCodes.DOWN:
                instance.moveCanvas('down');
                break;
            }	
    });
    /*end*/
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.canvas_mousedown);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.canvas_mousemove);
    goog.events.listen(this.canvas, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.canvas_mouseup);
    goog.events.listen(this.canvas, goog.events.EventType.DBLCLICK, postile.view.post_board.handlers.canvas_dblclick);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEDOWN, postile.view.post_board.handlers.mask_mousedown);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEMOVE, postile.view.post_board.handlers.mask_mousemove);
    goog.events.listen(this.mask, goog.events.EventType.MOUSEUP, postile.view.post_board.handlers.mask_mouseup);
    goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(e){ e.preventDefault(); this.style.display = 'none'; });
    this.resize();
}

goog.inherits(postile.view.post_board.PostBoard, postile.view.View);

postile.view.post_board.PostBoard.prototype.unloadedStylesheets = ['post_board.css'];

postile.view.post_board.PostBoard.prototype.resize = function(){ //called on window.resize
    this.canvas.style.display = 'block'; 
    this.viewport.style.width = window.innerWidth + 'px';
    this.viewport.style.height = window.innerHeight + 'px';
    this.canvasCoord = [(this.viewport.offsetWidth - this.canvasSize[0])/2, (this.viewport.offsetHeight - this.canvasSize[1])/2]; //To be replaced
    this.canvas.style.left = this.canvasCoord[0] + 'px'; this.canvas.style.top = this.canvasCoord[1] + 'px';   
}

postile.view.post_board.PostBoard.prototype.canvasOutBoundAnimation = function(){ //called while the animation iteration
    this.canvas.style.boxShadow = this.shadowCoord[0]/10+'px '+this.shadowCoord[1]/10+'px '+Math.sqrt(Math.pow(this.shadowCoord[0], 2)+Math.pow(this.shadowCoord[1], 2))/10+'px 0 rgba(255, 255, 255, 0.75) inset';
};

postile.view.post_board.PostBoard.prototype.moveCanvas = function(direction) {
    if (this.disableMovingCanvas) { return; } //do not respond to actions if the user is actually dragging
    var leftTarget = this.canvasCoord[0];
    var topTarget = this.canvasCoord[1];
    var i;
    var instance = this;
    var arrow_hide = [false, false, false, false]; //the arrow index to hide
    switch(direction) {
        case 'up':
            topTarget += 0.5 * this.viewport.offsetHeight;
            break;
        case 'down':
            topTarget -= 0.5 * this.viewport.offsetHeight;
            break;
        case 'left':
            leftTarget += 0.5 * this.viewport.offsetWidth;
            break;
        case 'right':
            leftTarget -= 0.5 * this.viewport.offsetWidth;
            break;
    }
    if (topTarget >= 0) { topTarget = 0; arrow_hide[0] = true; }
    if (topTarget <= this.viewport.offsetHeight - this.canvasSize[1]) { topTarget = this.viewport.offsetHeight - this.canvasSize[1]; arrow_hide[2] = true; }
    if (leftTarget >= 0) { leftTarget = 0; arrow_hide[3] = true; }
    if (leftTarget <= this.viewport.offsetWidth - this.canvasSize[0]) { leftTarget = this.viewport.offsetWidth - this.canvasSize[0]; arrow_hide[1] = true; }
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
}

//convent length from "unit length" of the grid to pixel.
postile.view.post_board.PostBoard.prototype.widthTo = function(u) { return (u*(75+30) - 30); };
postile.view.post_board.PostBoard.prototype.heightTo = function(u) { return (u*(50+30) - 30); };
postile.view.post_board.PostBoard.prototype.xPosTo = function(u) { return (u*(75+30) + this.canvasSize[0]/2); };
postile.view.post_board.PostBoard.prototype.yPosTo = function(u) { return (u*(50+30) + this.canvasSize[1]/2); };
//convent length to "unit length" of the grid from pixel. it is from the center grid points so margins and paddings are ignored.
postile.view.post_board.PostBoard.prototype.xPosFrom = function(px) { return ((px + 7 - this.canvasSize[0]/2)/(75+30)); };
postile.view.post_board.PostBoard.prototype.yPosFrom = function(px) { return ((px + 7 - this.canvasSize[1]/2)/(50+30)); };

postile.view.post_board.PostBoard.prototype.getVisibleArea = function(source) { //get visible area in the unit of "grid unit" //source is esxpected to be this.canvasCoord or [parseInt(this.canvas.style.left), parseInt(this.canvas.style.top)]
    return { left: Math.floor(this.xPosFrom(-source[0])), top: Math.floor(this.yPosFrom(-source[1])), right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth - source[0])), bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight - source[1]))};
}

postile.view.post_board.PostBoard.prototype.getSubscribeArea = function(source) { //get subscribe area in the unit of "grid unit"
    var preloadRadio = 1; //the size of preloaded area. 0 for exactly visible area (no preload), n for extend n screen length on all directions.
    return { left: Math.floor(this.xPosFrom(-source[0] - preloadRadio*this.viewport.offsetWidth)), top: Math.floor(this.yPosFrom(-source[1] - preloadRadio*this.viewport.offsetHeight)), right: Math.ceil(this.xPosFrom(this.viewport.offsetWidth*(1+preloadRadio) - source[0])), bottom: Math.ceil(this.yPosFrom(this.viewport.offsetHeight*(1+preloadRadio) - source[1]))};
}

postile.view.post_board.PostBoard.prototype.updateSubsribeArea = function() { //fetch the posts in the new area and subscribe it
    var currentLoc = [parseInt(this.canvas.style.left), parseInt(this.canvas.style.top)];
    var to_sub = this.getSubscribeArea(currentLoc);
    var instance = this;
    if (!this.isAreaFullInside(this.currentSubscribeArea, this.getVisibleArea(currentLoc))) {
        //display loading
    }
    postile.utils.ajax( , , function() {
        instance.currentSubscribeArea = to_sub;
    }, 'Loading posts...');
}

postile.view.post_board.PostBoard.prototype.isAreaFullInside = function(parent, child) {
    return (parent.left <= child.left && parent.right >= child.right && parent.top <= child.top && parent.bottom >= child.bottom);
}

postile.view.post_board.PostBoard.prototype.renderArray = function(array) { //add post objects to the screen //NOTICE: just add, no not care the duplicate
    var i;
    this.currentArray = array;
    for (i in array) {
        array[i].x_pos_end = array[i].x_pos + array[i].width; //precalculate this two so that future intersect test will be faster
        array[i].y_pos_end = array[i].y_pos + array[i].height;
        array[i].divEl = goog.dom.createDom('div', {'class':'post'});
        goog.dom.appendChild(this.canvas, array[i].divEl);
        array[i].divEl.rel_data = array[i];
        array[i].divEl.style.left = this.xPosTo(array[i].x_pos) + 'px';
        array[i].divEl.style.top = this.yPosTo(array[i].y_pos) + 'px';
        array[i].divEl.style.width = this.widthTo(array[i].width) + 'px';
        array[i].divEl.style.height = this.heightTo(array[i].height) + 'px';
        goog.events.listen(this.mask, goog.events.EventType.DBLCLICK, function(event){event.stopPropagation();}); //prevent dbl click from triggering "creating new post"
        array[i].divEl.innerHTML = array[i].content;
        postile.fx.effects.resizeIn(array[i].divEl);
    }
};

postile.view.post_board.handlers.canvas_mousedown = function(e) {
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
    post_board.disableMovingCanvas = false;
    post_board.mousedownCoord = null;
    post_board.canvasCoord = [parseFloat(this.style.left),parseFloat(this.style.top)];
    //animation of outbound shadow
    var init = post_board.shadowCoord.slice();
    var total = Math.max(Math.abs(this.rel_data.shadowCoord[0]),Math.abs(this.rel_data.shadowCoord[1]));
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
    if (this.rel_data.shadowCoord[1] <= 0) { this.rel_data.direction_controllers[0].style.display = 'block'; }
    if (this.rel_data.shadowCoord[0] >= 0) { this.rel_data.direction_controllers[1].style.display = 'block'; }
    if (this.rel_data.shadowCoord[1] >= 0) { this.rel_data.direction_controllers[2].style.display = 'block'; }
    if (this.rel_data.shadowCoord[0] <= 0) { this.rel_data.direction_controllers[3].style.display = 'block'; }
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
    for (i in this.rel_data.currentArray) {
        //from http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
        if(!(current[0] >= this.rel_data.currentArray[i].x_pos_end || end[0] <= this.rel_data.currentArray[i].x_pos || current[1] >=this.rel_data.currentArray[i].y_pos_end || end[1] <= this.rel_data.currentArray[i].y_pos)) { 
            intersect = true;
            break;
        }
    }
    //draw on the canvas
    this.preview.style.left = this.rel_data.xPosTo(current[0]) + this.rel_data.canvasCoord[0] + 'px';
    this.preview.style.top = this.rel_data.yPosTo(current[1]) + this.rel_data.canvasCoord[1] + 'px';
    this.preview.style.width = this.rel_data.widthTo(Math.abs(delta[0])) + 'px';
    this.preview.style.height = this.rel_data.heightTo(Math.abs(delta[1])) + 'px';
    this.preview.style.backgroundColor = intersect ? '#F00' : '#0F0';
    this.preview.style.display = 'block';
    this.legal = !intersect;
};

postile.view.post_board.handlers.mask_mouseup = function(e){
    this.rel_data.disableMovingCanvas = false;
    this.rel_data.newPostStartCoord = null;
    this.post_preview_origin_spot.style.display = 'none';
    if (!this.legal) {
        this.preview.style.display = 'none'; return;
    }
    this.legal = false;
};

//activated double click event for creating new boxes
postile.view.post_board.handlers.canvas_dblclick = function(e){
    this.rel_data.disableMovingCanvas = true;
    this.rel_data.mask.style.display = 'block';
};

postile.view.post_board.handlers.arrow_control_click = function() {
    this.parentNode.rel_data.moveCanvas(this.getAttribute('title'));
}