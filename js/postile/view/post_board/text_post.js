goog.provide('postile.view.post.text_post');

goog.require('postile.view.post');

postile.view.post.text_post.TextPost = function(postData, board, mode) {
    goog.base(this, postData, board, mode);

    goog.dom.classes.add(this.wrap_el, 'text_post');
}

goog.inherits(postile.view.post.text_post.TextPost, postile.view.post.Post);

postile.view.post.text_post.TextPost.prototype.enterDisplayMode = function() {
    goog.base(this, 'enterDisplayMode');

    var elements = this.displayModeElements;

    // This is really ugly
    // If the text is too short, we need to put that in the center
    var dummy_span = goog.dom.createDom('div', "dummy_span");
    dummy_span.style.display = 'table-cell';
    goog.dom.appendChild(this.wrap_el, dummy_span);
    dummy_span.innerHTML = this.postData.post.content;

    var width = dummy_span.offsetWidth;
    var height = dummy_span.offsetHeight;

    var wrapper_width = this.wrap_el.offsetWidth;
    var wrapper_height = this.wrap_el.offsetHeight;

    goog.dom.removeNode(dummy_span);

    var marginTop = 0;

    if(wrapper_width > 1.7 * width){
        // check the height:

        if(height > wrapper_height){
            marginTop = 0;
        }
        else{
            marginTop = wrapper_height / 2 - height / 2 - 45; // number get by seeing the board....
        }
        elements.postContent_el.style.textAlign = 'center';
        elements.postContent_el.style.marginTop = marginTop + 'px';
        elements.postContent_el.style.fontSize = '20px';
    }
    else {
        elements.postContent_el.style.textAlign = '';
        marginTop = 0;
        elements.postContent_el.style.marginTop = marginTop + 'px';
        elements.postContent_el.style.fontSize = '10pt';
    }

    if (this.postData.post.content) {
        elements.postContent_el.innerHTML = postile.parseBBcode(this.postData.post.content);
    }

    elements.postContent_el.style.height = this.wrap_el.offsetHeight - 70 - marginTop + 'px';
    postile.bbcodePostProcess(elements.postContent_el);

    // set gradient position
    elements.postGradientMask_el.style.width = elements.postContent_el.offsetWidth + 'px';
}

postile.view.post.text_post.TextPost.prototype.enterEditMode = function(req) {
    goog.base(this, 'enterEditMode', req);

    var elements = this.editModeElements;

    elements.postContent_el.focus();
    elements.postContent_el.style.cursor = 'auto';
    elements.postContent_el.style.height = this.wrap_el.offsetHeight - 30 + 'px';

    elements.postContentPlaceHolder_el.style.display = 'block';
    elements.postContentPlaceHolder_el.style.width = elements.postContent_el.offsetWidth + 'px';

    var content = this.postData.post.content;

    if (content) {
        elements.postContent_el.innerHTML = postile.parseBBcode(content);
        postile.bbcodePostProcess(elements.postContent_el);
    }

    if (goog.string.isEmpty(content) || content == '<br>') {
        elements.postContentPlaceHolder_el.style.display = 'block';
    } else {
        elements.postContentPlaceHolder_el.style.display = 'none';
    }

    this.y_editor = new postile.WYSIWYF.Editor(elements.postContent_el, 
            elements.postWysiwyfIconContainer, this);
}

postile.view.post.text_post.TextPost.prototype.submitChange = function() {
    var elements = this.editModeElements;

    var title = elements.postTitle_el.value;
    var content = this.y_editor.getBbCode();

    if (!content) { // content is empty
        return;
    }

    postile.ajax([ 'post', 'submit_change' ], 
            {
                post_id: this.postData.post.id,
                title: title,
                content: content,
            }, 
            function(data) {
                this.postData.post.title = title;
                this.postData.post.content = content;
                this.enterDisplayMode();
                this.board.disableMovingCanvas = false;
            }.bind(this));
}
