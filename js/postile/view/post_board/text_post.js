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
    var dummy_span = goog.dom.createDom('span', "dummy_span");
    goog.dom.appendChild(this.wrap_el, dummy_span);
    dummy_span.innerHTML = this.postData.post.content;
    console.log(dummy_span);
    var width = dummy_span.offsetWidth;
    var height = dummy_span.offsetHeight;
    console.log(width);

    var wrapper_width = this.wrap_el.offsetWidth;
    var wrapper_height = this.wrap_el.offsetHeight;
    console.log(wrapper_width);
    goog.dom.removeNode(dummy_span);

    if(height < 20) { // one line only
        if(wrapper_width > 1.5 * width){
            elements.postContent_el.style.textAlign = 'center';
            var marginTop = wrapper_height / 2 - 55; // by seeing the board....
            elements.postContent_el.style.marginTop = marginTop + 'px';
            elements.postContent_el.style.fontSize = '20px'
        }
    }

    elements.postContent_el.innerHTML = this.postData.post.content;
    elements.postContent_el.style.height = this.wrap_el.offsetHeight - 70 + 'px';

    // set gradient position
    elements.postGradientMask_el.style.width = elements.postContent_el.offsetWidth + 'px';
}

postile.view.post.text_post.TextPost.prototype.enterEditMode = function(req) {
    goog.base(this, 'enterEditMode', req);

    var elements = this.editModeElements;

    elements.postContent_el.focus();
    elements.postContent_el.style.cursor = 'auto';
    elements.postContent_el.style.height = this.wrap_el.offsetHeight - 30 + 'px';

    if (req) {
        elements.postContent_el.innerHTML = this.postData.post.content;
    }
}

postile.view.post.text_post.TextPost.prototype.submitChange = function() {
    var elements = this.editModeElements;

    var title = elements.postTitle_el.value;
    var content = elements.postContent_el.innerHTML;

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
