echo "Compiling soy templates..."
java -jar tmp\SoyToJsSrcCompiler.jar `
    --outputPathFormat '{INPUT_DIRECTORY}\{INPUT_FILE_NAME}.js' `
    --shouldProvideRequireSoyNamespaces `
    --srcs "$(gci js\postile\ -recurse -include '*.soy')"

# XXX: compile gss stylesheets here.
echo "Compiling gss stylesheets..."
Foreach ($gssFile in $(gci css\ -recurse -include '*.gss')) {
    java -jar tmp\closure-stylesheets.jar `
        --pretty-print $gssFile `
	--output-file $(echo $gssFile | %{$_ -replace "\.gss", "-gen.css"})
}

echo "Building deps.js as $(pwd)\js\postile\deps.js"
tmp\closure\bin\build\depswriter.py `
    --root_with_prefix="$(pwd)\js\postile ..\postile" `
    --output_file="$(pwd)\js\postile\deps.js"

# LOL encoding
echo "Adding soyutil to deps.js..."
cat -Encoding Unicode hacks\soyutil-deps.js >> js\postile\deps.js
