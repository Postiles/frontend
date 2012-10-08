To run the code
======
Copy the `closure/goog` in [Google Closure Library](https://code.google.com/p/closure-library/downloads/list) to `js/goog`.


To update the dependency log of the code
======
First, copy the `closure/bin/build` directory in Google Closure Library to the project directory as `build`.

Then, simply run

`build/depswriter.py --root_with_prefix="js/postile ../postile" --output_file="js/postile/deps.js"`

at the project directory.

Check TODOs in the issue list
======
Still a lot to do!

Also check the wiki!