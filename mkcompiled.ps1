$cflags="--compilation_level=ADVANCED_OPTIMIZATIONS"

python tmp\closure\bin\build\closurebuilder.py `
	--root=js `
	--root=third_party `
	--namespace=postile.entry `
	--output_mode=compiled `
	--compiler_jar=tmp\compiler.jar `
	--compiler_flags="$cflags" `
	> compiled.js
