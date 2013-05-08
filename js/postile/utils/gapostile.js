//Wrap Google analysis for postile
goog.provide('postile.analysis');

postile.analysis._gaq = null;
postile.analysis.init = function() {
    postile.analysis._gaq = postile.analysis._gaq||[];
    postile.analysis._gaq.push(['_setAccount', 'UA-40739447-1']);
    (function() {
       var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
       ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
       var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
     })();
}

postile.analysis.gaq_push = function(args) {
    if(postile.analysis._gaq == null) {
        postile.analysis.init();
    }
    postile.analysis._gaq.push(args);
}
