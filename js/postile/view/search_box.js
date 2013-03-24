goog.provide('postile.view.search_box');

goog.require('postile.view');
goog.require('goog.dom');
goog.require('goog.events');

postile.view.search_box.SearchBox = function(input_instance) {
    this.instance = input_instance;
    postile.view.TipView.call(this);
    postile.ui.load(this.container, postile.staticResource(['_search_box.html']));

    this.container.id = 'search_pop_up';

    this.container.style.top = '0px';
    this.container.style.left = '0px';

    this.search_input_field = goog.dom.getElement("search_input_field");
    console.log(this.search_input_field);
    goog.events.listen(this.search_input_field, goog.events.EventType.KEYUP, this.search.bind(this));
}

goog.inherits(postile.view.search_box.SearchBox, postile.view.TipView);

postile.view.search_box.SearchBox.prototype.unloaded_stylesheets = ['_search_box.css'];

postile.view.search_box.SearchBox.prototype.search = function(instance) {
    // people search result
    var search_result_people = goog.dom.getElement("search_result_people");
    var people_list = goog.dom.getElementByClass("search_result_content_list", search_result_people);
    people_list.innerHTML = "";

    // topic search result
    var search_result_topic = goog.dom.getElement("search_result_topic");
    var topic_list = goog.dom.getElementByClass("search_result_content_list", search_result_topic);
    topic_list.innerHTML = "";

    // post search result
    var search_result_post = goog.dom.getElement("search_result_post");
    var post_list = goog.dom.getElementByClass("search_result_content_list", search_result_post);
    post_list.innerHTML = "";

    var search_value = goog.dom.getElement("search_input_field").value;
    console.log(search_value);

    if (search_value) {
        postile.ajax(['search','search_user'], { search: search_value }, function(data) {
            user_arr = JSON.parse(data.message);
            if (user_arr.length == 0) {
                goog.style.showElement(search_result_people, false);
            } else {
                goog.style.showElement(search_result_people, true);
            }
            for (i in user_arr) {
                user = user_arr[i];

                // people item
                var people_result = goog.dom.createDom("div", "search_result_item search_result_people");
                goog.dom.appendChild(people_list, people_result);

                // profile image
                var result_image = goog.dom.createDom("div", "search_result_image");
                goog.dom.appendChild(people_result, result_image);

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
        });

        postile.ajax(['search','search_topic'], { search: search_value }, function(data) {
            topic_arr = JSON.parse(data.message);
            if (topic_arr.length == 0) {
                goog.style.showElement(search_result_topic, false);
            } else {
                goog.style.showElement(search_result_topic, true);
            }
            for (i in topic_arr) {
                topic = topic_arr[i];
                console.log(topic);

                // topic item
                var topic_result = goog.dom.createDom("div", "search_result_item search_result_topic");
                goog.dom.appendChild(topic_list, topic_result);

                // profile image
                var result_image = goog.dom.createDom("div", "search_result_image");
                goog.dom.appendChild(topic_result, result_image);

                // right container
                var result_right_container = goog.dom.createDom("div", "search_result_right_container");
                goog.dom.appendChild(topic_result, result_right_container);

                // title (name)
                var result_item_title = goog.dom.createDom("div", "search_result_item_title");
                result_item_title.innerHTML = topic.name;
                goog.dom.appendChild(result_right_container, result_item_title);

                // info (description)
                var result_item_info = goog.dom.createDom("div", "search_result_item_info");
                result_item_info.innerHTML = topic.description;
                goog.dom.appendChild(result_right_container, result_item_info);
            }
        });

        postile.ajax(['search','search_post'], { search: search_value }, function(data) {
            post_arr = JSON.parse(data.message); // not sure why here I need one more level of parsing
            if (post_arr.length == 0) {
                goog.style.showElement(search_result_post, false);
            } else {
                goog.style.showElement(search_result_post, true);
            }
            for (i in post_arr) {
                post = post_arr[i];

                var post_result = goog.dom.createDom("div", "search_result_item search_result_post");
                goog.dom.appendChild(post_list, post_result);

                var item_title = goog.dom.createDom("div", "search_result_item_title");
                item_title.innerHTML = post.title;
                goog.dom.appendChild(post_result, item_title);
            }
        });
    } else {
        /* hides all the search result containers */
        this.search_result_containers = goog.dom.getElementsByClass("search_result_category");
        for (i = 0; i < this.search_result_containers.length; i++) {
            goog.style.showElement(this.search_result_containers[i], false);
        }
    }
}



