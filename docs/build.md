### TLDR: Building the project

- If you are building from the scratch for development:
  Run `build-script/dev_bootstrap.gen.py`

- If you are deploying from the scratch:
  Run `build-script/deploy.gen.py`

- If you have already bootstrapped and did some modification (scss/gss/soy/js)
  to the project:
  Run `build-script/dev_build_all.gen.py`

- If you have already bootstrapped and want to compile the project:
  Run `build-script/prod_build_all.gen.py`

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

build-script/
  * Executable build scripts

others
  * Remain undocumented...

