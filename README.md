LATEST NOTICE
======
**Notice: Now the code can ONLY run in the ROOT directory of a web server.**

**To run, you'll need to go to http://hostname:port/test directly.**

The web server is required to support Apache-like mod_rewrite.

Getting Google Closure Library
======

Copy the `closure/goog` in [Google Closure Library](https://code.google.com/p/closure-library/downloads/list) to `js/goog`.

To update the dependency log of the code
======
First, copy the `closure/bin/build` directory in Google Closure Library to the project directory as `build`.

Then, simply run

`build/depswriter.py --root_with_prefix="js/postile ../postile" --output_file="js/postile/deps.js"`

at the project directory.