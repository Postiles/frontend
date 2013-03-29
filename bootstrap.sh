#!/bin/bash

echo "Downloading google closure..."
mkdir tmp && cd tmp
wget https://closure-library.googlecode.com/files/closure-library-20130212-95c19e7f0f5f.zip -O goog.zip
wget http://closure-compiler.googlecode.com/files/compiler-latest.zip -O cc.zip
unzip goog.zip
yes | unzip cc.zip
cp -r third_party ../
cp -r closure/goog ../js
echo "Finally please ensure nginx is installed"
echo "Then set /etc/nginx/site-enabled/default's server.root to $(pwd)"
