goog.provide('postile.view.password_login');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('postile.view');

postile.view.password_login.PasswordLogin = function(board_id, board_type) {
	postile.view.PopView.call(this);

	this.board_id = board_id;

	//this.container.className = 'password_login';
	goog.dom.classes.add(this.container, 'password_login');
	postile.ui.load(this.container, postile.conf.staticResource(['_password_login.html']));

	// Ajax get the board options (password or question)
	// TODO
	this.board_type = board_type;

	// Change word and image icon // Change input type
	this.icon =  postile.dom.getDescendantByClass(this.container, "icon");
	this.word = postile.dom.getDescendantByClass(this.container, "question_title");
	this.text_input = postile.dom.getDescendantByClass(this.container, "input")

	if(this.board_type == "password"){
		this.icon.setAttribute('src', postile.conf.imageResources(['lock.png']));
		this.word.innerHTML = "Password";
		this.text_input.setAttribute('type', "password");
	}
	else if(this.board_type == "self"){
		this.icon.setAttribute('src', postile.conf.imageResources(['question.png']));
		this.word.innerHTML = this.selfQuestion;
		this.text_input.setAttribute('type', "text");
	}

	// listener event for submit
	this.submit = postile.dom.getDescendantByClass(this.container, "submit_button");
	goog.events.listen(this.submit, goog.events.EventType.CLICK, function(){

		var value = this.text_input.value;
		if(value == ""){
			// TODO output error message
		}else{
			postile.ajax([ '', '' ], {board_id: this.board_id, input: value}, function(data) {
				// TODO handle the if input is correct or not
        		if(data.message){

        		}
        		else {

        		}
    		}.bind(this));
		}

	}.bind(this));
}

goog.inherits(postile.view.password_login.PasswordLogin, postile.view.PopView);
postile.view.video_upload.VideoUpload.prototype.unloaded_stylesheets = ['password_login.css'];