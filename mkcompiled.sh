if [ "$1" = "-O2" ]; then
	CFLAGS="--compilation_level=ADVANCED_OPTIMIZATIONS"
else
	CFLAGS="--compilation_level=SIMPLE_OPTIMIZATIONS"
fi

python tmp/closure/bin/build/closurebuilder.py \
	--root=js \
	--root=third_party \
	--namespace=postile.entry \
	--output_mode=compiled \
	--compiler_jar=tmp/compiler.jar \
	--compiler_flags="$CFLAGS" \
	--output_file=compiled.js
