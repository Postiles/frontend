goog.provide('postile.view');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('postile.conf');
goog.require('postile.events');
goog.require('postile.fx.effects');

/**
 * === How to create a normal view ===
 *
 * 1. Have a class inherits "positle.view.NormalView".
 * 2. [optional, only when you need to load css] have a
 *    "unloaded_stylesheets" in its prototype,
 *    which is an array containing css files that need to be loaded.
 * 
 * Just put your things into this.container
 * 
 * === How to create a pop-up view ===
 * 
 * 1. Have a class inherits "postile.view.PopView".
 * 2. The same as normal view.
 * 
 * Just put your things into this.container,
 * and use "open" and "close" if needed
 * 
 * can set onclose method
 * 
 * === How to create a fullscreen view ===
 * 
 * 1. have a class inherits "postile.view.FullScreenView",
 *    and use "html_segment" property to represent the HTML that
 *    need to be loaded into document.body
 * 2. have a "close" method as destrcutor if needed
 * 3. the same as normal view
 * 
 * === How to create a tip view ===
 * 
 * 1. have a class inherits "postile.view.TipView".
 * 2. the same as normal view
 * 
 * just put your things into this.container,
 * and use "open" and "close" if needed.
 * 
 * the "open: functon will receive a parameter indicating the reference
 * element and container element of the tip view. If the reference element
 * is not set, the parent element of the reference element will be used
 * 
 * directly set "container.style.left" and "container.style.top"
 * to further offset the container
 * 
 * can set onclose method
 */

/**
 * Loaded stylesheet name cache.
 * @type {Object.<string, boolean>}
 * @see View
 */
postile.loaded_stylesheets = {};

/**
 * Loads some css files if not being previously loaded.
 * @param {Array.<string>} css_files Css files to be loaded
 */
postile.view.loadCss = function(css_files) {
    goog.array.forEach(css_files, function(path) {
        if (!(path in postile.loaded_stylesheets)) {
            postile.loaded_stylesheets[path] = true;
            var css_elem = goog.dom.createDom('link', {
                type: 'text/css',
                rel: 'stylesheet',
                href: postile.conf.cssResource([path])
            });
            goog.dom.appendChild(
                document.getElementsByTagName('head')[0], css_elem);
        }
    });
};

/**
 * "Do not use this class directly."
 * @abstract
 * @constructor
 */
postile.view.View = function() {
    var i;
    var instance = this;

    postile.view.loadCss(this.unloaded_stylesheets);
    /**** Function below is not activated yet
    if (this.urlHash) {
        window.location.hash = '#' + this.urlHash;
    }
    */
}

/**
 * Specifies a list of css files that a view needs to load.
 * @type {Array.<string>}
 */
postile.view.View.prototype.unloaded_stylesheets = [];

/**
 * PopView is a blocking view which, when enabled, will block background
 * interaction so that the user can focus on looking at this view.
 * Known subclasses are user profile viewer and image uploader.
 * @constructor
 */
postile.view.PopView = function() {
    goog.base(this);

    this.container = goog.dom.createDom('div', 'pop_container');

    this.container_wrap = goog.dom.createDom('div');
    this.container_wrap.style.zIndex = '300';
    goog.dom.classes.add(this.container_wrap, 'pop_popup');
    goog.dom.appendChild(this.container_wrap, this.container);
    this.mask = goog.dom.createDom('div', 'pop_mask');

    /* handle outside click event */
    /*
    goog.events.listen(this.mask, goog.events.EventType.CLICK, function(e) {
        console.log(e.target);
    }.bind(this));
    */

    this.mask.style.position = 'absolute';
    this.mask.style.top = '0px';
    this.mask.style.zIndex = '300';

    goog.dom.appendChild(this.mask, this.container_wrap);
}

goog.inherits(postile.view.PopView, postile.view.View);

/**
 * Shows itself, makes a mask to block things in the back,
 * and installs event handlers.
 * @param {number=} opt_width View width (optional)
 */
postile.view.PopView.prototype.open = function(opt_width) {
    if (!goog.isDef(opt_width) || opt_width > document.body.clientWidth) {
        // Not specified or too large for screen
        this.container.style.width = document.body.clientWidth + 'px';
    } else {
        this.container.style.width = opt_width + 'px';
    }

    goog.dom.appendChild(document.body, this.mask);
    postile.fx.effects.flowDown(this.container);
    new postile.fx.Animate(goog.bind(function(i) {
        this.mask.style.opacity = i;
    }, this), 400);

    // Create a binded function for removing events
    this.esc = this.escPressed.bind(this);
    goog.events.listen(document, goog.events.EventType.KEYUP, this.esc);
}

/* add the close button at the top right corner of the view */
postile.view.PopView.prototype.addCloseButton = function(view) {
    this.closeButton_el = goog.dom.createDom('div', 'close-button');
    goog.dom.appendChild(view, this.closeButton_el);

    this.closeButtonX_el = goog.dom.createDom('div', 'x');
    this.closeButtonX_el.innerHTML = 'x';
    goog.dom.appendChild(this.closeButton_el, this.closeButtonX_el);

    goog.events.listen(this.closeButton_el, goog.events.EventType.CLICK, function(e) {
        this.close();
    }.bind(this));
}

/**
 * Hides itself and detachs event handlers.
 */
postile.view.PopView.prototype.close = function() {
    if (this.onclose) { this.onclose(); }
    goog.dom.removeNode(this.mask);
    goog.events.unlisten(document, goog.events.EventType.KEYUP, this.esc);
}

/**
 * Checks for ESC and when it's pressed, close this view.
 * @see PopView.open
 */
postile.view.PopView.prototype.escPressed = function(e) {
    if (e.keyCode == 27) { // esc pressed
        this.close();
    }
};

postile.view.closeCurrentFullScreenView = function() {
    var cv = postile.router.current_view;
    if (cv && cv.close) {
        // Destruct the original fullscreenview
        cv.close();
    }
};

/**
 * Do NOT call a constructor of a FullScreenView directly. use postile.router.dispatch instead
 * Known subclasses are login screen and post board.
 * @constructor
 */
postile.view.FullScreenView = function() {
    postile.view.closeCurrentFullScreenView();
    goog.base(this);
    this.container = document.body;
    this.container.className = '';
    postile.ui.load(this.container, this.html_segment);
}
goog.inherits(postile.view.FullScreenView, postile.view.View);

/**
 * The page url that needs to be loaded for this view.
 * Should be overridden by subclasses.
 * @type {?string}
 */
postile.view.FullScreenView.prototype.html_segment = null;

/**
 * Smaller view. Known subclasses are inline comment view and post
 * deletion confirmation dialog, notification
 * @constructor
 */
postile.view.AbstractTipView = function() {
    goog.base(this);
    this.container = goog.dom.createDom('div');
    this.container.style.position = 'absolute';

    this.container_wrap = goog.dom.createDom('div');
    this.container_wrap.style.position = 'absolute';

    this.listeners = [];
    
    goog.dom.appendChild(this.container_wrap, this.container);
}

goog.inherits(postile.view.AbstractTipView, postile.view.View);

postile.view.AbstractTipView.prototype.open = function(reference, parent) {
    if (!parent) {
        parent = reference.parentNode;
    }
    var coord = goog.style.getRelativePosition(reference, parent);
    goog.style.setPosition(this.container_wrap, coord);
    goog.dom.appendChild(parent, this.container_wrap);
    for (var i in this.listeners) {
        this.listeners[i].listen();
    }
}

postile.view.AbstractTipView.prototype.close = function() {
    for (var i in this.listeners) {
        this.listeners[i].unlisten();
    }
    if (this.onclose) { this.onclose(); }
    goog.dom.removeNode(this.container_wrap);
}

/**
 * So-called hover TipView. Opened by hovering and closed by mouseout.
 * @constructor
 */
postile.view.HoverTipView = function() {
    goog.base(this);
    
    this.timer = null;
   
    this.listeners.push(new postile.events.EventHandler(this.container, goog.events.EventType.MOUSEOUT, this.mouseout.bind(this)));
    this.listeners.push(new postile.events.EventHandler(this.container, goog.events.EventType.MOUSEOVER, this.mouseover.bind(this)));
}

goog.inherits(postile.view.HoverTipView, postile.view.AbstractTipView);

postile.view.HoverTipView.prototype.mouseout = function(){
    if (this.timer) { clearTimeout(this.timer); }
    this.timer = setTimeout(function() { this.close(); }.bind(this), 200);
};

postile.view.HoverTipView.prototype.mouseover = function(evt){
    if (this.timer) { clearTimeout(this.timer); }
}

postile.view.HoverTipView.prototype.open = function(reference, parent) {
    this.listeners.push(new postile.events.EventHandler(reference, goog.events.EventType.MOUSEOUT, this.mouseout.bind(this)));
    this.listeners.push(new postile.events.EventHandler(reference, goog.events.EventType.MOUSEOVER, this.mouseover.bind(this)));
    postile.view.AbstractTipView.prototype.open.call(this, reference, parent);
}

 /**
 * So-called traditional TipView. Opened by clicking and closed by clicking outside.
 * @constructor
 */
postile.view.TipView = function() {
    goog.base(this);
    var instance = this;
  
    // When user clicks on the background: close this view.
    this.listeners.push(new postile.events.EventHandler(document.body,
        goog.events.EventType.CLICK,
        function(){
            instance.close();
        }));

    // When user clicks on this view: prevent its parent from
    // receiving the event.
    this.listeners.push(new postile.events.EventHandler(
        this.container, goog.events.EventType.CLICK, function(evt){
        evt.stopPropagation();
    }));
}

goog.inherits(postile.view.TipView, postile.view.AbstractTipView);

postile.view.NormalView = function() {
    postile.view.View.call(this);
    this.container = goog.dom.createDom('div');
}

postile.view.NormalView.prototype.close = function() {
    goog.dom.removeNode(this.container);
}

goog.inherits(postile.view.NormalView, postile.view.View);
