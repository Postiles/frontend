$out = "css\compiled-gen.css"

rm $out

echo "sass compiling..."
sass --update css/*.scss

echo "Combining css using closure-stylesheets..."
java -jar tmp\closure-stylesheets.jar `
    css\*.css `
    --allowed-non-standard-function skewY `
    --allowed-non-standard-function radial-gradient `
    --allowed-non-standard-function -webkit-radial-gradient `
    --allowed-non-standard-function -moz-radial-gradient `
    --output-file $out
