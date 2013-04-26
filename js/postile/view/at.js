goog.provide('postile.view.at');

goog.require('goog.string');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.events');

/**
 * Decorates a dom element to provide `at' functionality.
 *
 * Usecase:
 * - When decorating a comment textarea
 *   at = new postile.view.at.At(el)
 *   at.toBBcode()  // pre-process the innerhtml
 *   // And submit el.inerHTML to backend
 *
 * - When decorating a post textarea
 *   ???
 */

/**
 * Enables `at' functionality for the given element.
 * @param {Element} el A div element that has its contentEditable
 * set to true.
 */
postile.view.at.At = function(el) {
    postile.view.TipView.call(this);

    var instance = this;
    this.ipel = el;
    this.container.className = 'at_box';
    this.current_person = null;
    this.container.innerHTML = '<div class="at-hint">Enter a user name to @</div>';
    this.editlsnr = new postile.events.ContentChangeListener(el, function(e){ instance.realPress(e); });

    goog.events.listen(el, goog.events.EventType.KEYUP, instance.keyUpHandler.bind(this));
    goog.events.listen(el, goog.events.EventType.KEYDOWN, instance.keyDownHandler.bind(this));
    
    this.keyboard_event_handler = new postile.events.EventHandler(this.ipel.parentNode,
            goog.events.EventType.KEYDOWN, function(e) {
                instance.keypress(e);
            }, true);
}

goog.inherits(postile.view.at.At, postile.view.TipView);

postile.view.at.At.prototype.unloaded_stylesheets = ['_at.css'];

postile.view.at.At.prototype.keyUpHandler = function(e) {
    if (!this.opened) {
        if (e.keyCode == goog.events.KeyCodes.TWO && e.shiftKey) {
            this.open();
        } else if (e.keyCode == goog.events.KeyCodes.SHIFT) {
            if (this.lastEvent && this.lastEvent.keyCode == goog.events.KeyCodes.TWO
                    && this.lastEvent.shiftKey) {
                this.open();
            }
        }
    }
    this.lastEvent = e;
}

postile.view.at.At.prototype.keyDownHandler = function(e) {
    this.lastEvent = e;
}

postile.view.at.At.prototype.realPress = function() {
    this.range.setEndAfter(this.range.startContainer);
    var tmpVal = this.range.toString();
    if(tmpVal.charAt(0)!='@') {
        this.close(); return;
    }
    tmpVal = tmpVal.split(/\s/, 1)[0];
    var atPos = this.oRange.getBoundingClientRect();
    var ipelPos = this.ipel.getBoundingClientRect();
    this.container.style.left = (atPos.left - ipelPos.left) + 'px';
    this.container.style.top = (atPos.bottom - ipelPos.top) + 'px';
    this.fetchAndRender(goog.string.trim(tmpVal).substr(1));
}

postile.view.at.At.prototype.renderUser = function(profile) {
    var instance = this;

    var tmpDiv = goog.dom.createDom('div', 'at_single');
    var avaDiv = goog.dom.createDom('img', 'at_image');
    var usnDiv = goog.dom.createDom('div', 'at_name');

    avaDiv.src = postile.conf.uploadsResource([ profile.image_url ]);
    usnDiv.innerHTML = profile.username;

    goog.dom.appendChild(tmpDiv, avaDiv);
    goog.dom.appendChild(tmpDiv, usnDiv);
    goog.dom.appendChild(tmpDiv, goog.dom.createDom('div', 'clear'));
    tmpDiv.assoc_profile = profile;
    
    goog.events.listen(tmpDiv, goog.events.EventType.CLICK, function() {
        instance.choose(this.assoc_profile);
    });

    goog.events.listen(tmpDiv, goog.events.EventType.MOUSEOVER, function() {
        instance.setCurrent(this);
    });
    goog.events.listen(tmpDiv, goog.events.EventType.MOUSEOUT, function() {
        instance.setCurrent(this);
    });
    return tmpDiv;
}

postile.view.at.At.prototype.choose = function(profile) {
    var instance = this;
    var atNode = goog.dom.createDom('span', 'at_tag');
    atNode.contentEditable = true;
    atNode.innerHTML = '@' + profile.username

    atNode.setAttribute('at-user-name', profile.username);
    atNode.setAttribute('at-user', profile.user_id);
    
    instance.range.deleteContents();

    instance.range.insertNode(atNode);
    instance.range.collapse(false);
    
    instance.range.insertNode(document.createTextNode('\u00a0'));
    instance.range.collapse(false);

    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(instance.range);
    
    instance.close();
    
    if (!instance.ipel._at_consist_listener) {
        instance.ipel._at_consist_listener = new postile.events.ContentChangeListener(instance.ipel, function() {
            var ats = postile.dom.getDescendantsByCondition(instance.ipel, function(cel) {
                return cel.tagName && cel.getAttribute('at-user');
            });
            var corr;
            for (var i in ats) {
                corr = '@' + ats[i].getAttribute('at-user-name');
                if (ats[i].innerHTML.length < corr.length) {
                    ats[i].fontStyle = 'normal';
                    goog.dom.removeNode(ats[i]);
                } else if (ats[i].innerHTML.length > corr.length) {
                    ats[i].innerHTML = corr;
                    (function() {
                        var newNode = goog.dom.createTextNode(" ");
                        goog.dom.insertSiblingAfter(newNode, ats[i]);
                        var range = document.createRange();
                        range.selectNodeContents(newNode);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    })();
                } else {
                    ats[i].innerHTML = corr;
                }
            }
        });
        instance.ipel._at_consist_listener.listen();
    }
}

postile.view.at.At.prototype.setCurrent = function(current) {
    if (!current) { return; }
    if (this.current_person) {
        goog.dom.classes.remove(this.current_person, 'hover');
    }
    goog.dom.classes.add(current, 'hover');
    this.current_person = current;
}

postile.view.at.At.prototype.fetchAndRender = function(keyword) {
    var instance = this;
    postile.ajax(['search','search_user'], { keyword: keyword }, function(r) {
        var usr = r.message.users.slice(0, 5);
        if (!usr.length) { return; }
        goog.dom.removeChildren(instance.container);
        for (var i in usr) {
            goog.dom.appendChild(instance.container, instance.renderUser(usr[i].profile));
        }
        if (usr.length) {
            instance.setCurrent(instance.container.firstChild);
        } else {
            instance.current_person = null;
        }
    });
}

postile.view.at.At.prototype.keypress = function(e) {
    if (!this.current_person) { return; }
    switch (e.keyCode) {
        case goog.events.KeyCodes.UP:
            this.setCurrent(this.current_person.previousSibling);
            break;
        case goog.events.KeyCodes.DOWN:
            this.setCurrent(this.current_person.nextSibling);
            break;
        case goog.events.KeyCodes.ENTER:
            this.choose(this.current_person.assoc_profile);
            e.stopPropagation();
            e.preventDefault();
    }
}

postile.view.at.At.prototype.open = function() {
    var sel = window.getSelection();
    if (!sel.rangeCount) { return; }
    this.oRange = sel.getRangeAt(0);
    if (!this.oRange.collapsed) { return; }
    var start = this.oRange.startOffset - 1;
    this.oRange.setStart(this.oRange.startContainer, start);
    this.range = this.oRange.cloneRange();
    postile.view.TipView.prototype.open.call(this, this.ipel);
    this.editlsnr.listen();
    this.keyboard_event_handler.listen();
}

postile.view.at.At.prototype.close = function() {
    this.editlsnr.unlisten();
    this.keyboard_event_handler.unlisten();
    postile.view.TipView.prototype.close.call(this);
}

postile.view.at.At.prototype.asBBCode = function() {
    return postile.view.at.asBBCode(this.ipel.innerHTML);
}

/**
 * The same as toBBcode, but rather than modifying the element inplace,
 * this function returns the bbcode instead.
 * XXX: keep in sync with toBBcode.
 * @return {string} The converted BBCode.
 */
postile.view.at.asBBCode = function(html) {
    var i;
    // Deep copy
    var el = goog.dom.createDom('div', {
        'innerHTML': goog.string.trim(html)
    });
    // replace Ats
    var ats = postile.dom.getDescendantsByCondition(el, function(cel) {
        return cel.tagName && cel.getAttribute('at-user');
    });
    for (i in ats) {
        goog.dom.replaceNode(goog.dom.createTextNode('[at]' + ats[i].getAttribute('at-user') + '[/at]'), ats[i]);
    }
    // replace other tags
    return el.textContent;
};

