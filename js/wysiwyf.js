/**********************全文开始**********************/

goog.provide('WYSIWYF');

var WYSIWYF = {
    /******容器******/
    editors: new Array(),
    IEQuirk: (document.compatMode == 'BackCompat' && navigator.userAgent.indexOf('MSIE') != -1),
    /******预加载装置******/
    autoLoadExecuted: false,
    add: function (el) {
        this.editors.push(new this.load(el));
    },
    //定义一些常量, and methods
    toCopyStyle: new Array('left', 'right', 'top', 'bottom', 'marginLeft', 'marginTop', 'marginBottom', 'marginRight', 'position'),
    doSpanize: function (cont, a, b, style) { //a is char array, b is breakpoint list
        style = style || {
            Bold: false,
            Italic: false,
            Color: '#000000',
            Underline: false,
        };
        if (cont.nodeType == 3) { //text
            var l = cont.nodeValue.length;
            if (l < 1) {
                return;
            }
            if (style.Color == '#000000' || style.Color == 'rgb(0,0,0)' || style.Color == 'rgb(0, 0, 0)') {
                style.Color = false;
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
                cStyle.Color = cont.getAttribute('color') || cStyle.Color;
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
                if (cont.style.Color && cont.style.Color != '') {
                    cStyle.Color = cont.style.Color;
                }
            }
            //END of [STYLING I]
            if (t == 'IMG') {
                b[a.length] += '[img]' + cont.src + '[/img]';
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
    dbgCirahOut: function (editor) {
        var Chars = new Array();
        var BreakPoints = new Array('');
        editor.ifmDocument.body.innerHTML = editor.ifmDocument.body.innerHTML.replace(/\r\n|\n\r|\r|\n/g, '');
        this.doSpanize(editor.ifmDocument.body, Chars, BreakPoints, false);
        editor.ifmDocument.body.innerHTML = editor.textarea.value = this.merge(Chars, BreakPoints);
    },
    getRange: function (docDocument, docWindow) {
        var userSelectionRange;
        if (docWindow.getSelection) {
            var userSelection = docWindow.getSelection();
            if (userSelection.toString().length < 1) {
                return false;
            }
        } else if (docDocument.selection) {
            userSelectionRange = docDocument.selection.createRange();
            if (userSelectionRange.text.length < 1) {
                return false;
            }
        }
        return true;
    },
    //干正事：建立一个eHolder(editor holder，编辑器大容器)，并将其放到原textarea位置，然后将原textarea隐形(initialize editor)
    load: function (el) { //创建一个editor实例,存储于editors中
        var editor = this;
        editor.textarea = el;
        //编辑器iframe
        editor.ifmElement = document.createElement('iframe');
        editor.ifmLoaded = false;
        if (editor.ifmElement.attachEvent) {
            editor.ifmElement.attachEvent("onload", function () {
                editor.ifmLoaded = true;
            });
        } else {
            editor.ifmElement.onload = function () {
                editor.ifmLoaded = true;
            };
        }
        //编辑器总容器
        editor.eHolder = document.createElement('div');
        //编辑器菜单
        editor.eMenu = document.createElement('div');
        var l = WYSIWYF.toCopyStyle.length;
        for (var i = 0; i < l; i++) {
            eval('editor.ifmElement.style.' + WYSIWYF.toCopyStyle[i] + '=editor.textarea.style.' + WYSIWYF.toCopyStyle[i]);
        }
        editor.eHolder.style.width = editor.eMenu.style.width = editor.ifmElement.style.width = (editor.textarea.offsetWidth - 2) + 'px';
        editor.eHolder.style.height = (editor.textarea.offsetHeight - 2) + 'px';
        editor.ifmElement.style.height = (editor.textarea.offsetHeight - 27) + 'px';
        editor.ifmElement.frameBorder = '0';
        editor.ifmElement.style.border = '0 none';
        editor.eHolder.style.border = '1px solid #999';
        editor.eMenu.style.height = '25px';
        editor.eMenu.style.background = '#CCC';
        editor.textarea.parentNode.insertBefore(editor.eHolder, editor.textarea);
        editor.eHolder.appendChild(editor.eMenu);
        editor.eHolder.appendChild(editor.ifmElement);
        editor.textarea.style.display = 'none'; //debug_switch如需进行debug，将此行注释掉即可（不隐藏原textarea）
        var ifmOnLoad = function () {
            editor.ifmDocument = (editor.ifmElement.contentWindow || editor.ifmElement.contentDocument);
            if (editor.ifmDocument.document) {
                editor.ifmWindow = editor.ifmDocument;
                editor.ifmDocument = editor.ifmWindow.document;
            } else {
                editor.ifmWindow = editor.ifmDocument.getParentNode();
            }
            //TODO: THERE IS A BUG UNDER IE. Maybe anything associated with ifmDoc.body should load after ifmWin is loaded.
            editor.ifmDocument.body.innerHTML = editor.textarea.value; //初始化时将textarea内的内容复制到iframe中
            //editor.ifmDocument.body.style.backgroundColor = '#FCC';
            editor.ifmDocument.body.style.fontSize = '15px';
            editor.ifmDocument.body.style.backgroundColor = '#FFF';
            editor.ifmDocument.designMode = 'on';
        }
        //if not loaded, add to "onload", otherwise, execute immediately
        if (editor.ifmLoaded == true) {
            ifmOnLoad();
        } else {
            if (editor.ifmElement.attachEvent) {
                editor.ifmElement.attachEvent("onload", ifmOnLoad);
            } else {
                editor.ifmElement.onload = ifmOnLoad;
            }
        }
        var buttonOperate = function () { //when button being clicked
            var l = WYSIWYF.editButtons.length;
            for (var i = 0; i < l; i++) {
                if (this.style.backgroundPosition.toLowerCase() == WYSIWYF.editButtons[i].bgPos) {
                    if (WYSIWYF.editButtons[i].requireSel) {
                        if (!WYSIWYF.getRange(editor.ifmDocument, editor.ifmWindow)) {
                            alert('Select something first please.');
                            return;
                        }
                    } else {
                        if (WYSIWYF.getRange(editor.ifmDocument, editor.ifmWindow)) {
                            alert('You cannot select anything when doing this action.');
                            return;
                        }
                    }
                    WYSIWYF.editButtons[i].callback(editor);
                }
            }
        }
        //Placing buttons
        l = WYSIWYF.editButtons.length;
        editor.buttons = new Array(l);
        for (var i = 0; i < l; i++) {
            editor.buttons[i] = document.createElement('input');
            editor.buttons[i].setAttribute('type', 'button');
            editor.buttons[i].style.backgroundColor = '#E0E0E0';
            editor.buttons[i].style.border = '0 none';
            editor.buttons[i].style.backgroundImage = 'url(//ssl.gstatic.com/ui/v1/icons/mail/html_editor.png)';
            editor.buttons[i].style.width = '21px';
            editor.buttons[i].style.height = '21px';
            editor.buttons[i].style.margin = '2px 0px 0 3px';
            editor.buttons[i].style.padding = '0';
            editor.buttons[i].style.backgroundPosition = WYSIWYF.editButtons[i].bgPos;
            editor.buttons[i].onclick = buttonOperate;
            editor.eMenu.appendChild(editor.buttons[i]);
        }
        //HANDLE MERGING WHEN {form submitted}
        var fms = document.getElementsByTagName('form');
        var temp;
        for (var i = 0; i < fms.length; i++) {
            temp = fms[i].onsubmit;
            fms[i].onsubmit = function () {
                WYSIWYF.dbgCirahOut(editor);
                if (typeof temp == 'function') {
                    temp();
                }
            };
        }
        //HANDLE MERGING WHEN {ifm lose focus}
    },
    /******Define buttons and corresponding operations******/
    editButtons: new Array(
    //requireSql true: must selected; false: must NOT selected
    {
        bgPos: '0px 0px',
        callback: function (editor) {
            //Bold
            editor.ifmDocument.execCommand('bold', false, null);
        },
        requireSel: true
    }, {
        bgPos: '-' + (21 * 1) + 'px 0px',
        callback: function (editor) {
            //Italic
            editor.ifmDocument.execCommand('italic', false, null);
        },
        requireSel: true
    }, {
        bgPos: '-' + (21 * 5) + 'px 0px',
        callback: function (editor) {
            //Color
            WYSIWYF.colorSelector(function (co) {
                editor.ifmDocument.execCommand('ForeColor', false, co);
            });
        },
        requireSel: true
    }, {
        bgPos: '-' + (21 * 18) + 'px 0px',
        callback: function (editor) {
            //Img
            var srcTo = prompt('Enter image address (URL)', 'http://');
            if (srcTo && srcTo != '' && srcTo != 'http://') {
                editor.ifmDocument.execCommand('InsertImage', false, srcTo);
            }
        },
        requireSel: false
    }, {
        bgPos: '-' + (21 * 7) + 'px 0px',
        callback: function (editor) {
            //Link
            editor.ifmDocument.execCommand('CreateLink', false, prompt('Enter link address (URL)', 'http://'));
        },
        requireSel: false
    }, {
        bgPos: '-' + (21 * 2) + 'px 0px',
        callback: function (editor) {
            //Underline
            editor.ifmDocument.execCommand('Underline', false, null);
        },
        requireSel: true
    }, {
        bgPos: '-' + (17 * 21) + 'px 0px',
        callback: function (editor) {
            //Preview
            WYSIWYF.dbgCirahOut(editor);
        },
        requireSel: false
    }),
    /******实用工具一枚：颜色选择器******/
    //默认颜色值
    defaultColors: new Array('#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
        '#FF0000', '#00FF00', '#0000FF', '#00FFFF', '#FF00FF', '#FFFF00',
        '#660000', '#006600', '#000066', '#006666', '#660066', '#666600',
        '#FF6666', '#66FF66', '#6666FF', '#66FFFF', '#FF66FF', '#FFFF66',
        '#FF9999', '#99FF99', '#9999FF', '#99FFFF', '#FF99FF', '#FFFF99', '#FFCCCC'),
    colorSelector: function (callback) { //parameters: what to do after color selected(the callback function must receive a paramter suggesting the selected color in '#000000' format)
        var csPanel = document.createElement('div');
        csPanel.style.width = '120px';
        csPanel.style.paddingLeft = '2px';
        csPanel.style.paddingTop = '2px';
        csPanel.style.height = '120px';
        if (WYSIWYF.IEQuirk) {
            csPanel.style.width = '122px';
            csPanel.style.height = '122px';
        }
        csPanel.style.position = 'static';
        var l = WYSIWYF.defaultColors.length;
        var btns = new Array();
        for (var i = 0; i < l; i++) {
            btns[i] = document.createElement('button');
            btns[i].style.width = '18px';
            btns[i].style.height = '18px';
            btns[i].style.border = '0 none';
            btns[i].style.padding = '0';
            btns[i].style.overflow = 'hidden';
            btns[i].style.backgroundColor = WYSIWYF.defaultColors[i];
            btns[i].style.margin = '2px 2px 0 0';
            csPanel.appendChild(btns[i]);
            btns[i].onclick = function () {
                callback(this.style.backgroundColor);
                WYSIWYF.closeBox(this.parentNode.parentNode);
            };
            //TO SEE: http://blog.csdn.net/yuanweihuayan/article/details/6330520
        }
        var selectorInput = document.createElement('input');
        var selectorTag = document.createElement('input');
        selectorInput.type = selectorTag.type = 'text';
        selectorTag.readOnly = 'true';
        selectorInput.value = WYSIWYF.defaultColors[WYSIWYF.defaultColors.length - 1];
        selectorTag.value = '自选';
        selectorInput.style.width = '58px';
        selectorTag.style.width = '38px';
        selectorInput.style.height = selectorTag.style.height = '18px';
        selectorInput.style.padding = selectorTag.style.padding = '0';
        selectorInput.style.border = selectorTag.style.border = '0 none';
        selectorInput.style.margin = selectorTag.style.margin = '2px 2px 0 0';
        csPanel.appendChild(selectorInput);
        csPanel.insertBefore(selectorTag, btns[btns.length - 1]);
        selectorInput.style.fontSize = '12px';
        selectorInput.onchange = selectorInput.onkeydown = selectorInput.onkeyup = function () {
            WYSIWYF.defaultColors[WYSIWYF.defaultColors.length - 1] = btns[btns.length - 1].style.backgroundColor = this.value;
        };
        this.openBox(122, 122).appendChild(csPanel);
    },
    openBox: function (width, height) {
        var holder = document.createElement('div');
        var mask = document.createElement('div');
        document.body.appendChild(mask);
        holder.style.width = (width) + 'px';
        holder.style.height = (height) + 'px';
        mask.style.zIndex = '19520';
        mask.style.top = '0';
        mask.style.left = '0';
        if (navigator.userAgent.indexOf('MSIE') != -1) {
            mask.style.background = 'url(about:blank)';
            mask.style.filter = 'progid:DXImageTransform.Microsoft.gradient(startcolorstr=#66444444,endcolorstr=#99000000)';
        } else if (navigator.userAgent.indexOf('WebKit') != -1) {
            mask.style.background = '-webkit-gradient(linear, 0 0, 0 bottom, from(rgba(68, 68, 68, 0.4)), to(rgba(0, 0, 0, 0.6)))';
        } else if (navigator.userAgent.indexOf('Firefox') != -1) {
            mask.style.background = '-moz-linear-gradient(top, rgba(68, 68, 68, 0.4), rgba(0, 0, 0, 0.6))';
        } else if (navigator.userAgent.indexOf('Presto') != -1) {
            mask.style.background = '-o-linear-gradient(top, rgba(68, 68, 68, 0.4), rgba(0, 0, 0, 0.6))';
        } else {
            mask.style.background = '#999999';
        }
        holder.style.position = 'absolute';
        holder.style.background = '#FFF';
        holder.style.border = '12px solid #CCC';
        holder.style.zIndex = '52';
        holder.style.padding = '10px';
        /* IE6 way */
        if (document.compatMode == 'BackCompat') {
            var equiv = document.body;
        } else {
            var equiv = document.documentElement;
        }
        if (navigator.userAgent.indexOf('MSIE 6.0') != -1 || WYSIWYF.IEQuirk) {
            mask.style.position = 'absolute';
            mask.style.width = Math.max((equiv.scrollWidth), (equiv.clientWidth)) + 'px';
            mask.style.height = Math.max((equiv.scrollHeight), (equiv.clientHeight)) + 'px';
            holder.style.top = ((equiv.scrollTop) + ((equiv.clientHeight) - height - 40) / 2) + 'px';
            holder.style.left = ((equiv.scrollLeft) + ((equiv.clientWidth) - width - 40) / 2) + 'px';
            /* Following lines are a better solution, but does not support IE6 */
        } else {
            mask.style.position = 'fixed';
            mask.style.width = '100%';
            mask.style.height = '100%';
            holder.style.top = ((equiv.clientHeight) - height - 40) / 2 + 'px';
            holder.style.left = ((equiv.clientWidth) - width - 40) / 2 + 'px';
        }
        if (WYSIWYF.IEQuirk) {
            holder.style.width = (width + 44) + 'px';
            holder.style.height = (height + 44) + 'px';
        }
        mask.appendChild(holder);
        return holder;
    },
    closeBox: function (holder) { //holder from openbox
        document.body.removeChild(holder.parentNode);
    },
    /*
    input parameters for "merge"
        characters (array)
          |- (object)
            |- content (string)
            |- style (object)
              |- Bold (bool)
              |- Italic (bool)
              |- Color (string)
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
            if (!chars[i].style.Color) { pop_stack('color'); }
            if (chars[i].style.Color) {
                stack_add('color', chars[i].style.Color);
            }
            if (chars[i].style.Bold) { stack_add('b'); } 
            if (chars[i].style.Italic) { stack_add('i'); } 
            if (chars[i].style.Underline) { stack_add('u'); }         
            op += bps[i];
            op += chars[i].content;
        }
        op += bps[i]; pop_stack('u'); pop_stack('i'); pop_stack('b'); pop_stack('color');
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

/**********************全文结束**********************/