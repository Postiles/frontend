$cflags = "--compilation_level=SIMPLE_OPTIMIZATIONS"

tmp\closure\bin\build\closurebuilder.py `
	--root=js `
	--root=third_party `
	--namespace=postile.entry `
	--output_mode=compiled `
	--compiler_jar="$(pwd)\tmp\compiler.jar" `
	--compiler_flags="$cflags" `
	> compiled.js
