#!/bin/bash

echo "Compiling soy templates..."
java -jar tmp/SoyToJsSrcCompiler.jar \
    --outputPathFormat '{INPUT_DIRECTORY}/{INPUT_FILE_NAME}.js' \
    --shouldProvideRequireSoyNamespaces \
    --srcs $(find js/postile/ -name "*.soy")

echo "Compiling gss stylesheets..."
for gssFile in $(find css/ -name "*.gss"); do
    java -jar tmp/closure-stylesheets.jar \
        --pretty-print $gssFile \
	> $(echo $gssFile | sed s/\.gss/.css/) ;
done

echo "Building deps.js..."
python tmp/closure/bin/build/depswriter.py \
    --root_with_prefix="$(pwd)/js/postile ../postile" \
    --output_file="$(pwd)/js/postile/deps.js"

echo "Adding soyutil to deps.js..."
cat hacks/soyutil-deps.js >> js/postile/deps.js

