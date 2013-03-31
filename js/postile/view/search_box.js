goog.provide('postile.view.search_box');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.async.Throttle');
goog.require('postile.conf');
goog.require('postile.view');

postile.view.search_box.SearchBox = function(input_instance) {
    this.instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.conf.staticResource(['_search_box.html']));

    this.container.id = 'search_pop_up';

    // people search result
    this.search_result_people = postile.dom.getDescendantById(this.container, "search_result_people");
    this.people_list = goog.dom.getElementByClass("search_result_content_list", this.search_result_people);
    goog.style.showElement(this.search_result_people, false);

    // post search result
    this.search_result_post = postile.dom.getDescendantById(this.container, "search_result_post");
    this.post_list = goog.dom.getElementByClass("search_result_content_list", this.search_result_post);
    goog.style.showElement(this.search_result_post, false);

    this.search_input_field = postile.dom.getDescendantById(this.container, 'search_input_field');
    this.throttle = new goog.async.Throttle(this.search.bind(this), 1200, this.search_input_field);

    goog.events.listen(this.search_input_field, goog.events.EventType.KEYUP, function(e) {
        this.throttle.fire();
    }.bind(this));
}

goog.inherits(postile.view.search_box.SearchBox, postile.view.TipView);

postile.view.search_box.SearchBox.prototype.unloaded_stylesheets = ['_search_box.css'];

postile.view.search_box.SearchBox.prototype.search = function(instance) {
    var search_value = postile.dom.getDescendantById(this.container, "search_input_field").value;

    if (!search_value) { // search value is empty
        /* hides all the search result containers */
        this.search_result_containers = goog.dom.getElementsByClass("search_result_category");
        for (i = 0; i < this.search_result_containers.length; i++) {
            goog.style.showElement(this.search_result_containers[i], false);
        }
    } else {
        postile.ajax([ 'search', 'search_user' ], { keyword: search_value }, function(data) {
            this.people_list.innerHTML = ""; // clear previous results

            var user_arr = data.message.users;

            if (user_arr.length == 0) {
                goog.style.showElement(this.search_result_people, false);
            } else {
                goog.style.showElement(this.search_result_people, true);
            }

            for (var i in user_arr) {
                user = user_arr[i].user;
                profile = user_arr[i].profile;

                // people item
                var people_result = goog.dom.createDom("div", "search_result_item search_result_people");
                goog.dom.appendChild(this.people_list, people_result);

                // profile image
                var result_image_container = goog.dom.createDom("div", "search_result_image");
                var result_image = goog.dom.createDom('img', null);
                goog.dom.appendChild(people_result, result_image_container);
                goog.dom.appendChild(result_image_container, result_image);
                result_image.src = postile.conf.uploadsResource([ profile.image_small_url ]);

                // right container
                var result_right_container = goog.dom.createDom("div", "search_result_right_container");
                goog.dom.appendChild(people_result, result_right_container);

                // title (username)
                var result_item_title = goog.dom.createDom("div", "search_result_item_title");
                result_item_title.innerHTML = user.username;
                goog.dom.appendChild(result_right_container, result_item_title);

                // info (email)
                var result_item_info = goog.dom.createDom("div", "search_result_item_info");
                result_item_info.innerHTML = user.email;
                goog.dom.appendChild(result_right_container, result_item_info);
            }
        }.bind(this));

        postile.ajax(['search','search_post'], { keyword: search_value }, function(data) {
            this.post_list.innerHTML = "";

            post_arr = data.message.posts;

            if (post_arr.length == 0) {
                goog.style.showElement(this.search_result_post, false);
            } else {
                goog.style.showElement(this.search_result_post, true);
            }
            for (i in post_arr) {
                post = post_arr[i].post;

                var post_result = goog.dom.createDom("div", "search_result_item search_result_post");
                goog.dom.appendChild(this.post_list, post_result);

                var result_item_title = goog.dom.createDom("div", "search_result_item_title");
                result_item_title.innerHTML = post.title;
                goog.dom.appendChild(post_result, result_item_title);

                // right container
                var result_right_container = goog.dom.createDom("div", "search_result_right_container");
                goog.dom.appendChild(post_result, result_right_container);

                var result_item_info = goog.dom.createDom("div", "search_result_item_info");
                result_item_info.innerHTML = post.content;
                goog.dom.appendChild(result_right_container, result_item_info);
            }
        }.bind(this));
    }
}
