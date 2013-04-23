goog.provide('postile.view.tutorial');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.conf');
goog.require('postile.view');

goog.require('postile.view');

postile.view.tutorial.TutorialView = function(change_password) {
    goog.base(this);

    postile.ui.load(this.container,
        postile.conf.staticResource(['tutorial.html']));

    var $ = function(nodeCls) {
        return postile.dom.getDescendantByClass(this.container, nodeCls);
    }.bind(this);

    this.currView = 0;

    this.elements = {
        slideshow_el: $('slideshow'),
        viewList_el: $('view_list'),
        leftArrow_el: $('left_arrow'),
        rightArrow_el: $('right_arrow'),
        skipButton_el: $('skip_button')
    }

    // dot indicators at the bottom
    this.dots = postile.dom.getDescendantsByClass(this.container, 'dot');

    for (var i in this.dots) {
        var bindDotClickEvent = function(i) {
            var index = parseInt(i);
            goog.events.listen(
                this.dots[index],
                goog.events.EventType.CLICK,
                function(e) {
                    this.switchToView(index);
                }.bind(this));
        }.bind(this);

        bindDotClickEvent(i);
    }

    this.numItems = this.dots.length;

    goog.events.listen(
        document.body, 
        goog.events.EventType.KEYDOWN,
        function(e) {
            var key = e.keyCode;
            if (e.keyCode == 37) {
                if (this.currView > 0) {
                    this.switchToView(this.currView - 1);
                }
            } else if (e.keyCode == 39 || e.keyCode == 13 || e.keyCode == 32) {
                if (this.currView < this.numItems - 1) {
                    this.switchToView(this.currView + 1);
                    e.preventDefault();
                } else if (this.currView == this.numItems - 1) {
                    this.endTutorial();
                }
            }
        }.bind(this));

    goog.events.listen(
        this.elements.leftArrow_el,
        goog.events.EventType.CLICK,
        function(e) {
            if (this.currView > 0) {
                this.switchToView(this.currView - 1);
            }
        }.bind(this));

    goog.events.listen(
        this.elements.rightArrow_el,
        goog.events.EventType.CLICK,
        function(e) {
            if (this.currView < this.numItems - 1) {
                this.switchToView(this.currView + 1);
            } else if (this.currView == this.numItems - 1) {
                this.endTutorial();
            }
        }.bind(this));

    goog.events.listen(
        this.elements.skipButton_el,
        goog.events.EventType.CLICK,
        function(e) {
            this.endTutorial();
        }.bind(this));
        
    if (change_password) {
        new postile.view.change_password.ChangePassword(change_password).open(500);
    }
}

goog.inherits(postile.view.tutorial.TutorialView, postile.view.FullScreenView);

postile.view.tutorial.TutorialView.prototype.unloaded_stylesheets = [ 'tutorial.css' ];

postile.view.tutorial.TutorialView.prototype.endTutorial = function(viewIndex) {
    postile.toast.title_bar_toast('Preparing the contents for you', 100);
    postile.ajax(
        [ 'user', 'finish_tutorial' ], 
        { target_user_id: localStorage.postile_user_id },
        function(data) {
            postile.router.dispatch('topic/1');
        });
}

postile.view.tutorial.TutorialView.prototype.switchToView = function(viewIndex) {
    if (viewIndex == this.currView) {
        return;
    }

    if (!this.animActive) {
        var animStep = (viewIndex - this.currView) * 20;
        var countDown = 40; // number of animation units left

        this.animActive = true;

        var anim = setInterval(function() {
            this.elements.slideshow_el.scrollLeft += animStep;

            if (--countDown == 0) {
                clearInterval(anim);

                this.currView = viewIndex;

                for (var i in this.dots) {
                    this.animActive = false;
                    this.dots[i].style.opacity = '0.4';
                }
                this.dots[viewIndex].style.opacity = '1';

                if (viewIndex == 0) {
                    this.elements.leftArrow_el.style.display = 'none';
                } else if (viewIndex == this.numItems - 1) {
                    // this.elements.rightArrow_el.style.display = 'none';
                } else {
                    this.elements.leftArrow_el.style.display = 'block';
                    // this.elements.rightArrow_el.style.display = 'block';
                }

            }
        }.bind(this), 5);
    }
}
