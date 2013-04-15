How to run postile-dev
===========

### Getting Google Closure Library

run `bootstrap.sh` to get google closure and to get some instruction on
configuring nginx.

It will create a `tmp/` directory for `mkdep.sh` and `mkcompiled.sh` to use.

### To update the dependency log of the code

run `mkdep.sh` to build deps for closure library.

### Run HTTP Server

First configure the server's root directory to here.
Then start the server and go to [localhost:8000](http://localhost:8000).

The web server is required to support Apache-like mod\_rewrite.

Docs
----

See [docs/](docs/).

