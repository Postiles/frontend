#!/bin/bash

if [ -e index-compiled.html ]; then
	echo "Using compiled version..."
	mv index.html index-not-compiled.html
	mv index-compiled.html index.html
else
	echo "Using none-compiled version..."
	mv index.html index-compiled.html
	mv index-not-compiled.html index.html
fi
