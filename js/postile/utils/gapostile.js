//Wrap Google analysis for postile
goog.provide('postile.analysis');

// globally run this code since google require to do so.
var _gaq = this._gaq||[];
_gaq.push(['_setAccount', 'UA-40741449-1']);
_gaq.push(['_trackPageview']);
(function() {
     var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
     ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
     var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
 })();
