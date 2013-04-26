#!/bin/bash

OUT=css/compiled-gen.css

echo "Cleaning up generated css..."
rm -f $OUT
for name in $(find css/ -name "*.scss"); do
    rm $(echo $name | sed "s/scss/css/")
done

echo "sass compiling..."
sass --update css/*.scss

echo "combining css using closure-stylesheets..."
java -jar tmp/closure-stylesheets.jar \
    css/*.css \
    --allowed-non-standard-function skewY \
    --allowed-non-standard-function radial-gradient \
    --allowed-non-standard-function -webkit-radial-gradient \
    --allowed-non-standard-function -moz-radial-gradient \
    --output-file $OUT

