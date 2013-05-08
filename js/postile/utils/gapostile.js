//Wrap Google analysis for postile
goog.provide('postile.analysis');

var _gaq = this._gaq||[];
_gaq.push(['_setAccount', 'UA-40741449-1']);
_gaq.push(['_trackPageview']);
(function() {
    console.log("setting ga");
     var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
     ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
     var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
 })();
