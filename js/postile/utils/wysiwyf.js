goog.provide('postile.WYSIWYF');

goog.require('goog.dom');
goog.require('postile.conf');
goog.require('postile.dom');
goog.require('postile.view.At');

/*******************************************************
Note: content below does not use ANY Google Closure code
*******************************************************/

postile.WYSIWYF = {
    /******预加载装置******/
    //定义一些常量, and methods
    doSpanize: function (cont, a, b, style) { //a is char array, b is breakpoint list
        style = style || {
            Bold: false,
            Italic: false,
            Underline: false
        };
        if (cont.nodeType == 3) { //text
            var l = cont.nodeValue.length;
            if (l < 1) {
                return;
            }
            for (var i = 0; i < l; i++) {
                if (i > 0 && cont.nodeValue.substr(i, 1) == ' ' && a[a.length - 1].Content == ' ') { //ignore continous blanks
                    continue;
                }
                a.push({content: cont.nodeValue.substr(i, 1), style: style});
                b[a.length] = '';
            }
        } else if (cont.nodeType == 1) { //htmlElement
            //var enclose = 0;
            var t = cont.tagName.toUpperCase();
            //CLONE STYLE TO cStyle
            var cStyle = new Object();
            for (var i in style) {
                cStyle[i] = style[i];
            }
            //[STYLING I]
            if (t == 'B' || t == 'STRONG') {
                cStyle.Bold = true;
            } else if (t == 'I' || t == 'EM') {
                cStyle.Italic = true;
            } else if (t == 'U') {
                cStyle.Underline = true;
            } else if (t == 'SPAN' || t == 'FONT') {
                var ltid = cont.getAttribute('at-user');
                if (ltid) {
                    b[a.length] += '[at]' + ltid + '[/at]';
                    return;
                }
                if (cont.style.fontWeight == 'normal') {
                    cStyle.Bold = false;
                } else if (cont.style.fontWeight == 'bold') {
                    cStyle.Bold = true;
                }
                if (cont.style.fontStyle == 'italic') {
                    cStyle.Italic = true;
                } else if (cont.style.fontWeight == 'normal') {
                    cStyle.Italic = false;
                }
                if (cont.style.textDecoration == 'none') {
                    cStyle.Underline = false;
                } else if (cont.style.textDecoration == 'underline') {
                    cStyle.Underline = true;
                }
            }
            //END of [STYLING I]
            if (t == 'IMG') {
                var ltid = cont.getAttribute('link-to-post-id');
                if (ltid) {
                    b[a.length] += '[link]' + ltid + '[/link]';
                } else {
                    b[a.length] += '[img]' + cont.src + '[/img]';
                }
                return;
            }
            if (t == 'A') {
                b[a.length] += '[url]' + cont.href + '[/url]';
                return; //does not allow "A" to have children
            }
            if (t == 'P' || t == 'DIV' || t == 'BR') {
                b[a.length] += "\r\n";
            }
            var n = cont.childNodes;
            for (var i = 0; i < n.length; i++) {
                this.doSpanize(n[i], a, b, cStyle);
            }
        }
    },
    Editor: function(editor_el, icon_container_el, post) { //can use the "container" property of this.
        var editor = this;
        editor.post = post;
        editor.editor_el = editor_el;
        editor_el.contentEditable = true;
        //Placing buttons
        l = postile.WYSIWYF.editButtons.length;
        editor.buttons = new Array(l);
        goog.dom.removeChildren(icon_container_el);
        for (var i = 0; i < l; i++) {
            editor.buttons[i] = document.createElement('div');
            editor.buttons[i].className = 'post_icon';
            editor.buttons[i].setAttribute('type', 'button');
            editor.buttons[i].style.border = '0 none';
            editor.buttons[i].style.backgroundImage = 'url('+postile.conf.imageResource(['editor_sprite.png'])+')';
            editor.buttons[i].style.width = '13px';
            editor.buttons[i].style.height = '13px';
            editor.buttons[i].style.padding = '0';
            editor.buttons[i].style.cursor = 'pointer';
            editor.buttons[i].style.cssFloat = 'left';
            editor.buttons[i].style.marginLeft = '8px';
            editor.buttons[i].style.backgroundPosition = postile.WYSIWYF.editButtons[i].bgPos;
            editor.buttons[i].addEventListener('mousedown', function(evt) { evt.preventDefault(); });
            editor.buttons[i].onclick = function() { if (!editor.selectionInEditor()) { return; } editor.buttonOperate(this.style.backgroundPosition.toLowerCase()); } 
            icon_container_el.appendChild(editor.buttons[i]);
        }
        editor.toDisplayMode(0);
        if (editor.post) {
            editor.onEditListener = new postile.events.ContentChangeListener(editor.editor_el, function(){
                var i;
                var links = postile.dom.getDescendantsByCondition(editor.editor_el, function(el) {
                    return el.tagName && el.tagName.toUpperCase() == 'IMG'
                           && el.src.indexOf(postile.conf.imageResource(['link_icon.png'])) > -1;
                });
                var lels = editor.post.board.picker.all_lkd_el;
                for (i in lels) {
                    lels[i].style.display = 'none';
                }
                for (i in links) {
                    var id = links[i].getAttribute('link-to-post-id'); 
                    if (id) {
                        lels[id].style.display = 'block';
                    }
                }
            });
            editor.onEditListener.listen();
        }
        editor.at = new postile.view.At(this.editor_el);
    },
    /******Define buttons and corresponding operations******/
    editButtons: new Array(
    {
        bgPos: '-' + (13 * 8) + 'px 0px',
        callback: function (editor) {
            if (!editor.post) { alert('Cannot link to post when expanded.'); return; }
            //Link to post
            var picker = editor.post.board.picker;
            var img_el;
            document.execCommand('InsertImage', false, postile.conf.imageResource(['link_icon.png']));
            img_el = postile.dom.getDescendantByCondition(editor.editor_el, function(el) { 
                return el.tagName && el.tagName.toUpperCase() == 'IMG'
                       && el.src.indexOf(postile.conf.imageResource(['link_icon.png'])) > -1
                       && !el.getAttribute('link-to-post-id');
            });
            if (!img_el) { return; }
            picker.open(function(post){ 
                if (post) { 
                    img_el.setAttribute('link-to-post-id', post.postData.post.id);
                    img_el.onmouseover = function() {
                        var lels = editor.post.board.picker.all_lkd_el;
                        for (i in lels) {
                            lels[i].className = 'post_mark_linked_low';
                        }
                        lels[this.getAttribute('link-to-post-id')].className = 'post_mark_linked';
                    }
                    img_el.onmouseout = function() {
                        for (i in lels) {
                            lels[i].className = 'post_mark_linked';
                        }
                    }
                } else { goog.dom.removeNode(img_el); }
            }, editor.post);
        },
        display: [true, true]
    }, /* {
        bgPos: '-' + (13 * 2) + 'px 0px',
        callback: function (editor) {
            //Img
            var srcTo = prompt('Enter image address (URL)', 'http://');
            if (srcTo && srcTo != '' && srcTo != 'http://') {
                document.execCommand('InsertImage', false, srcTo);
            }
        },
        display: [true, true]
    }, */ {
        bgPos: '-' + (13 * 7) + 'px 0px',
        callback: function (editor) {
            editor.toDisplayMode(1);
        },
        display: [true, false]
    }, {
        bgPos: '0px 0px',
        callback: function (editor) {
            //Bold
            document.execCommand('bold', false, null);
        },
        display: [false, true]
    }, {
        bgPos: '-' + (13 * true) + 'px 0px',
        callback: function (editor) {
            //Italic
            document.execCommand('italic', false, null);
        },
        display: [false, true]
    }, {
        bgPos: '-' + (13 * 5) + 'px 0px',
        callback: function (editor) {
            //Underline
            document.execCommand('Underline', false, null);
        },
        display: [false, true]
    }, {
        bgPos: '-' + (13 * 6) + 'px 0px',
        callback: function (editor) {
            editor.toDisplayMode(0);
        },
        display: [false, true]
    }),
    /*
    input parameters for "merge"
        characters (array)
          |- (object)
            |- content (string)
            |- style (object)
              |- Bold (bool)
              |- Italic (bool)
              |- Underline (bool)
        breakpoints (array)
          |- (string)
    */
    merge: function(chars, bps) {
        if (!chars.length) { return bps[0]; }
        var last_style;
        var tag_stack = new Array();
        var op = '';
        var pop_stack = function(tag_name) {
            var i;
            var tmp;
            for (i = tag_stack.length - 1; i >= 0; i--) {
                if (tag_stack[i].tag == tag_name) {
                    break;
                }
            }
            if (i < 0) { return; }
            while(tag_stack.length > i) {
                tmp = tag_stack.pop();
                op += '[/' + tmp.tag + ']';
            }
        };
        var stack_add = function(tag_name, value) {
            for (var i = tag_stack.length - 1; i >= 0; i--) {
                if (tag_stack[i].tag == tag_name) {
                    if (value && value != tag_stack[i].value) {
                        pop_stack(tag_name);
                    } else {
                        return;
                    }
                }
            }
            tag_stack.push({tag: tag_name, value: value});
            op += '['+tag_name+(value ? '=' + value : '')+']'
        };
        for(var i = 0; i < chars.length; i++) {
            if (!chars[i].style.Underline) { pop_stack('u'); }
            if (!chars[i].style.Italic) { pop_stack('i'); }
            if (!chars[i].style.Bold) { pop_stack('b'); }
            if (chars[i].style.Bold) { stack_add('b'); }
            if (chars[i].style.Italic) { stack_add('i'); }
            if (chars[i].style.Underline) { stack_add('u'); }
            op += bps[i];
            op += chars[i].content;
        }
        op += bps[i]; pop_stack('u'); pop_stack('i'); pop_stack('b');
        return op;
        /*
        This section: an un-finished version

        //Phase 1: combine charters to some all-same groups
        var group_endings = [0];
        for(var i = 1; i < chars.length; i++) {
            if (chars[i].style.Bold != chars[i-1].style.Bold || chars[i].style.Italic != chars[i-1].style.Italic || chars[i].style.Color != chars[i-1].style.Color || chars[i].style.Underline != chars[i-1].style.Underline) {
                group_endings.push(i);
            }
        }
        group_endings.push(chars.length); //the last group will have a pseudo-end at characters.length
        //Phase 2: merge groups
            //TODO
        //Phase 3: output each group immediately |._.|
        var stl;
        var op = '';
        for (var i = 0; i < group_endings.length - 1; i++) {
            stl = chars[group_endings[i]].style;
            if (stl.Color) { op += '[color='+stl.Color+']'; }
            if (stl.Bold) { op += '[b]'; }
            if (stl.Italic) { op += '[i]'; }
            if (stl.Underline) { op += '[u]'; }
            for (var j = group_endings[i]; j < group_endings[i+1]; j++) {
                op += bps[j];
                op += chars[j].content;
            }
            if (stl.Underline) { op += '[/u]'; }
            if (stl.Italic) { op += '[/i]'; }
            if (stl.Bold) { op += '[/b]'; }
            if (stl.Color) { op += '[/color]'; }
        }
        op += bps[bps.length - 1];
        return op;

        */
    }
};

postile.WYSIWYF.Editor.prototype.getBbCode = function() {
    var Chars = new Array();
    var BreakPoints = new Array('');
    this.editor_el.innerHTML = this.editor_el.innerHTML.replace(/\r\n|\n\r|\r|\n/g, '');
    postile.WYSIWYF.doSpanize(this.editor_el, Chars, BreakPoints, false);
    return postile.WYSIWYF.merge(Chars, BreakPoints).replace(/^[\r\n\s]*/, '').replace(/[\r\n\s]*$/, ''); //trim
};

postile.WYSIWYF.Editor.prototype.buttonOperate = function(bgpIpt) { //when button being clicked
    var l = postile.WYSIWYF.editButtons.length;
    for (var i = 0; i < l; i++) {
        if (bgpIpt == postile.WYSIWYF.editButtons[i].bgPos) {
            postile.WYSIWYF.editButtons[i].callback(this);
        }
    }
};

postile.WYSIWYF.Editor.prototype.toDisplayMode = function (displayOptionIndex){
    for(var i in this.buttons) {
        if (postile.WYSIWYF.editButtons[i].display[displayOptionIndex]) {
            this.buttons[i].style.display = 'inline';
        } else {
            this.buttons[i].style.display = 'none';
        }
    }
};

postile.WYSIWYF.Editor.prototype.selectionInEditor = function() {
    var sel = window.getSelection();
    if (!sel.rangeCount) { return; }
    var range = sel.getRangeAt(0);
    var temp = range.commonAncestorContainer;
    do {
        if (temp == this.editor_el) { return true; }
    } while (temp = temp.parentNode);
    return false;
}
