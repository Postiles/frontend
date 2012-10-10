goog.provide('postile.key_handler');

goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');

var keyHandler = new goog.events.KeyHandler(document);
goog.events.listen(keyHandler, 'key', function(e) {
	switch (e.keyCode) {
		case goog.events.KeyCodes.LEFT:
		console.log('left!');
		break;
		case goog.events.KeyCodes.RIGHT:
		console.log('right!');
		break;
		case goog.events.KeyCodes.UP:
		console.log('up!');
		break;
		case goog.events.KeyCodes.DOWN:
		console.log('down!');
		break;
	}	
});