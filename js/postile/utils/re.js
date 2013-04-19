goog.provide('postile.re');

goog.require('goog.dom');
goog.require('postile.fx.effects');


postile.re.getEmbed = function(http_link){
	
	var video_id;

	if(http_link.match(/youtube/) && !http_link.match(/embed/)){
		// link is from youtube
		video_id = http_link.match(/v=(\S*)/)[1];
		return 'http://www.youtube.com/embed/' + video_id;
	}else if(http_link.match(/56.com/) && !http_link.match(/embed/)){
		video_id = http_link.match(/v_(\S*)/)[1];
		return 'http://www.56.com/iframe/' + video_id;
	}else if(http_link.match(/youku/) && !http_link.match(/embed/)){
		video_id = http_link.match(/id_(\S*)/)[1];
		return 'http://player.youku.com/embed/' + video_id;
	}else{
		return 'invalid';
	}
}
