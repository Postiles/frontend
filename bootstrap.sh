#!/bin/bash

echo "Downloading google closure..."
mkdir tmp
cd tmp
if [ ! -f goog.zip ]; then
    wget https://closure-library.googlecode.com/files/closure-library-20130212-95c19e7f0f5f.zip -O goog.zip
fi

echo "Downloading closure compiler..."
if [ ! -f cc.zip ]; then
    wget http://closure-compiler.googlecode.com/files/compiler-latest.zip -O cc.zip
fi

echo "Downloading soy template compiler..."
if [ ! -f soycc.zip ]; then
    wget \
    http://closure-templates.googlecode.com/files/closure-templates-for-javascript-latest.zip \
    -O soycc.zip
fi

if [ ! `which unzip`]; then
    sudo apt-get install unzip
fi

unzip goog.zip
yes | unzip cc.zip
yes | unzip soycc.zip
cp -r third_party ../
cp -r closure/goog ../js

mkdir ../js/goog/soyutil
cp -r soy*.js ../js/goog/soyutil/

echo "Downloading soy template compiler..."
echo "Finally please ensure nginx is installed"
echo "Then set /etc/nginx/site-enabled/default's server.root to $(pwd)"
