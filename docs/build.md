### Layout of the project

css/
  * Hand-written css files
  * .scss files, to be compiled by sass
  * .gss files, to be compiled by the closure-stylesheets compiler
  * Generated css files

js/
  - goog/
    * closure-library javascript files, gitignored
  - postile/
    * Hand-written project javscripts
    * .soy files, to be compiled by closure-templates compiler
    * Generated js files (deps.js and *.soy.js)

templates/
  * Html templates, to be loaded by project js files

others
  * Remain undocumented...

### TLDR: Building the project

`mkdep` then `compile-css` and finally `mkcompiled`.
After then, run `flip-compiled-js` to switch the `index.html` to use
compiled code.

### Building scripts, detailed
  - bootstrap.(sh|ps1)
    * Downloads essential tools
  - mkdep.(sh|ps1)
    * Compiles js/*.soy to js/*.soy.js, using closure-templates compiler.
    * Compiles css/*.gss to css/*.css, using closure-stylesheets compiler.
    * Resolves dependencies for js/postile/*.js and builds js/postile/deps.hs
      so that non-compiled version of the index.html can be run.
  - compile-css
    * Compiles css/*.scss to css/*.css, using sass.
    * Combines css/*.css to css/compiled-gen.css, using closure-stylesheets.
  - mkcompiled
    * Compiles js/*.js to compiled.js, using closure-compiler

