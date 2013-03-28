#!/bin/bash

echo "First ensure nginx is installed"
echo "Then set /etc/nginx/site-enabled/default's server.root to $pwd"
echo "Now downloading google closure..."
mkdir tmp && cd tmp
mkdir down && cd down
wget https://closure-library.googlecode.com/files/closure-library-20130212-95c19e7f0f5f.zip -O goog.zip
unzip goog.zip
mv closure/goog ../
mv closure/bin/build ../../build
mv third_party ../../
cd ../..
rm -r tmp
