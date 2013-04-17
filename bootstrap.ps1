If (!(Test-Path "$(pwd)\tmp")) {
    mkdir tmp
}
cd tmp

echo "Downloading google closure library..."
If (!(Test-Path "$(pwd)\goog.zip")) {
    (new-object System.Net.WebClient).DownloadFile("https://closure-library.googlecode.com/files/closure-library-20130212-95c19e7f0f5f.zip","$(pwd)\goog.zip")
}

echo "Downloading closure compiler..."
if (!(Test-Path "$(pwd)\cc.zip")) {
    (new-object System.Net.WebClient).DownloadFile("http://closure-compiler.googlecode.com/files/compiler-latest.zip", "$(pwd)\cc.zip")
}

echo "Downloading soy template compiler..."
if (!(Test-Path "$(pwd)\soycc.zip")) {
    (new-object System.Net.WebClient).DownloadFile("http://closure-templates.googlecode.com/files/closure-templates-for-javascript-latest.zip", "$(pwd)\soycc.zip")
}

echo "Downloading closure stylesheets compiler..."
if (!(Test-PAth "$(pwd)\closure-stylesheets.jar")) {
    (new-object System.Net.WebClient).DownloadFile("https://closure-stylesheets.googlecode.com/files/closure-stylesheets-20111230.jar", "$(pwd)\closure-stylesheets.jar")
}

echo "Unzipping google closure library..."
# Do unzip
$shell_app = new-object -com shell.application
$zip_file = $shell_app.namespace("$(pwd)\goog.zip")
$dest = $shell_app.namespace("$(pwd)")
$dest.Copyhere($zip_file.items(), 0x14)

echo "Unzipping closure compiler..."
$zip_file = $shell_app.namespace("$(pwd)\cc.zip")
$dest.Copyhere($zip_file.items(), 0x14)

echo "Unzipping soy template compiler..."
$zip_file = $shell_app.namespace("$(pwd)\soycc.zip")
$dest.Copyhere($zip_file.items(), 0x14)

echo "Copying files..."
cp -R -Force third_party ..\
cp -R -Force closure\goog ..\js

mkdir ../js/goog/soyutil
cp -R -Force soy*.js ..\js\goog\soyutil

echo "Finally please ensure nginx is installed"
echo "Then set /etc/nginx/site-enabled/default's server.root to $(pwd)"

cd ..
