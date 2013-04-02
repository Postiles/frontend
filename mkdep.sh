#!/bin/bash

python tmp/closure/bin/build/depswriter.py \
    --root_with_prefix="$(pwd)/js/postile ../postile" \
    --output_file="$(pwd)/js/postile/deps.js"
