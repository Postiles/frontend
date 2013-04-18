goog.provide('postile.view.At');

goog.require('goog.string');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');
goog.require('postile.events');

postile.view.At = function(el) {
    postile.view.TipView.call(this);

    var instance = this;
    this.ipel = el;
    this.container.className = 'at_box';
    this.container.innerHTML = '<div class="at-hint">Enter a user name to @</div>';
    this.editlsnr = new postile.events.ContentChangeListener(el, function(e){ instance.realPress(e); });

    goog.events.listen(el, goog.events.EventType.KEYUP, instance.keyUpHandler.bind(this));
    goog.events.listen(el, goog.events.EventType.KEYDOWN, instance.keyDownHandler.bind(this));
}

goog.inherits(postile.view.At, postile.view.TipView);

postile.view.At.prototype.unloaded_stylesheets = ['_at.css'];

postile.view.At.prototype.keyUpHandler = function(e) {
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

postile.view.At.prototype.keyDownHandler = function(e) {
    this.lastEvent = e;
}

postile.view.At.prototype.realPress = function() {
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

postile.view.At.prototype.renderUser = function(profile) {
    var instance = this;

    var tmpDiv = goog.dom.createDom('div', 'at_single');
    var avaDiv = goog.dom.createDom('img', 'at_image');
    var usnDiv = goog.dom.createDom('div', 'at_name');

    avaDiv.src = postile.conf.uploadsResource([ profile.image_url ]);
    usnDiv.innerHTML = profile.username;

    goog.dom.appendChild(tmpDiv, avaDiv);
    goog.dom.appendChild(tmpDiv, usnDiv);
    goog.dom.appendChild(tmpDiv, goog.dom.createDom('div', 'clear'));

    goog.events.listen(tmpDiv, goog.events.EventType.CLICK, function() {
        var atNode = goog.dom.createDom('span', 'at_tag');
        atNode.contentEditable = true;
        atNode.innerHTML = '@' + profile.username

        atNode.setAttribute('at-user-name', profile.username);
        atNode.setAttribute('at-user', profile.user_id);
        
        instance.range.deleteContents();

        instance.range.insertNode(atNode);
        instance.range.collapse();
        
        instance.range.insertNode(document.createTextNode('\u00a0'));
        instance.range.collapse();

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
                    } else {
                        ats[i].innerHTML = corr;
                    }
                }
            });
            instance.ipel._at_consist_listener.listen();
        }
    });
    return tmpDiv;
}

postile.view.At.prototype.fetchAndRender = function(keyword) {
    var instance = this;
    postile.ajax(['search','search_user'], { keyword: keyword }, function(r) {
        var usr = r.message.users;
        if (!usr.length) { return; }
        goog.dom.removeChildren(instance.container);
        for (var i in usr) {
            goog.dom.appendChild(instance.container, instance.renderUser(usr[i].profile));
        }
    });
}

postile.view.At.prototype.open = function() {
    var sel = window.getSelection();
    if (!sel.rangeCount) { return; }
    this.oRange = sel.getRangeAt(0);
    if (!this.oRange.collapsed) { return; }
    var start = this.oRange.startOffset - 1;
    this.oRange.setStart(this.oRange.startContainer, start);
    this.range = this.oRange.cloneRange();
    postile.view.TipView.prototype.open.call(this, this.ipel);
    this.editlsnr.listen();
}

postile.view.At.prototype.close = function() {
    this.editlsnr.unlisten();
    postile.view.TipView.prototype.close.call(this);
}

/*
this function is used for inline commenting. for posting, a similar function in postile.WYSIWYF is used
*/
postile.view.At.prototype.toBBcode = function() {
    var ats = postile.dom.getDescendantsByCondition(this.ipel, function(cel) {
        return cel.tagName && cel.getAttribute('at-user');
    });
    for (var i in ats) {
        goog.dom.replaceNode(goog.dom.createTextNode('[at]' + ats[i].getAttribute('at-user') + '[/at]'), ats[i]);
    }
}
