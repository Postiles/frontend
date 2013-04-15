- Splitting postile/postile.js to postile/conf.js and postile/entry.js.
- Consequently postile namespace is splitted into postile.conf and
  postile.entry.
- Some of the functions are moved into browser_compat to avoid
  circular dependency.
- Added `index-compiled.html` to use compiled js.
- Added `flip-compiled-js.sh` to switch between compiled and non-compiled mode
