echo "Compiling soy templates..."
java -jar tmp\SoyToJsSrcCompiler.jar `
    --outputPathFormat '{INPUT_DIRECTORY}\{INPUT_FILE_NAME}.js' `
    --shouldProvideRequireSoyNamespaces `
    --srcs "$(gci js\postile\ -recurse -include '*.soy')"

echo "Building deps.js..."
tmp\closure\bin\build\depswriter.py `
    --root_with_prefix="$(pwd)\js\postile ..\postile" `
    --output_file="$(pwd)\js\postile\deps.js"

echo "Adding soyutil to deps.js..."
cat hacks\soyutil-deps.js >> js\postile\deps.js

