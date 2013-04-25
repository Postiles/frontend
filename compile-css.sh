#!/bin/bash

OUT=css/compiled-gen.css

rm -f $OUT

echo "scss compiling..."
scss --update css/:css/

echo "combining css using closure-stylesheets..."
java -jar tmp/closure-stylesheets.jar \
    css/*.css \
    --allowed-non-standard-function skewY \
    --allowed-non-standard-function radial-gradient \
    --allowed-non-standard-function -webkit-radial-gradient \
    --allowed-non-standard-function -moz-radial-gradient \
    --output-file $OUT

