#!/usr/bin/env bash

EXEC_NAMES="
phonegap
cordova"

PLUGINS="
org.apache.cordova.dialogs
org.apache.cordova.camera
org.apache.cordova.file
org.apache.cordova.file-transfer
"

PLATFORMS="
ios
"

SPLASH_FILE="www/splash.html"
SPLASH_OPTIONS="
320:480:splash/ios/screen-iphone-portrait.png
640:960:splash/ios/screen-iphone-portrait-2x.png
640:1136:splash/ios/screen-iphone-portrait-568h-2x.png
768:1024:splash/ios/screen-ipad-portrait.png
1024:768:splash/ios/screen-ipad-landscape.png
1334:750:splash/ios/iphone6.png
1920:1080:splash/ios/iphone6plus.png
"

LIB_IONIC_VERSION="1.0.0-beta.14"
LIB_JQUERY_VERSION="2.1.3"
LIB_ANGULAR_VERSION="1.3.13"

mkdir -p splash/ios

#-----------------------------------------------------------------------------
# No need to edit beyond this point

function notify { echo "$1..."; }
function download_asset {
	curl -# -o $2 $1
}

# Find an executable we can work with
EXECUTABLE=''
for exec in $EXEC_NAMES; do
	EXECUTABLE=`which $exec`
	if [ $? -eq 0 ]; then
		break
	fi
done
notify "Using executable: ${EXECUTABLE}"

notify "Removing plugin and platform folders"
rm -rf plugins/
rm -rf platforms/

for plugin in $PLUGINS; do
	notify "Installing plugin: ${plugin}"
	$EXECUTABLE plugin add $plugin
done

# Generating splash screens for ios
notify "Generating splash screens"
for row in $SPLASH_OPTIONS; do
	read w h file <<< $(echo $row | tr ":" "\n")
	wkhtmltoimage --format png --width $w --height $h --quality 100 $SPLASH_FILE $file
done

# Phonegap bug - re add platforms after plugins (don't ask)
for platform in $PLATFORMS; do
	notify "Configuring platform: ${platform}"
	$EXECUTABLE platform add $platform
done

# Grab some external dependencies
mkdir -p www/lib/js www/lib/css www/lib/fonts

notify "Downloading AngularJS assets"
download_asset "https://code.angularjs.org/${LIB_ANGULAR_VERSION}/angular-route.min.js" www/lib/js/angular-route.min.js

notify "Downloading Ionic assets"
IONIC_FILES="
js/ionic.bundle.min.js
css/ionic.min.css
fonts/ionicons.eot
fonts/ionicons.svg
fonts/ionicons.ttf
fonts/ionicons.woff
"
for RESOURCE in $IONIC_FILES; do
    download_asset "http://code.ionicframework.com/${LIB_IONIC_VERSION}/${RESOURCE}" www/lib/${RESOURCE}
done

notify "Downloading jQuery assets"
download_asset "https://code.jquery.com/jquery-${LIB_JQUERY_VERSION}.min.js" www/lib/js/jquery.min.js

notify "Downloading SparkMD5 assets"
download_asset "https://raw.githubusercontent.com/satazor/SparkMD5/master/spark-md5.min.js" www/lib/js/spark-md5.min.js

notify "Downloading angular-webstorage assets"
download_asset "https://raw.githubusercontent.com/fredricrylander/angular-webstorage/master/angular-webstorage.min.js" www/lib/js/angular-webstorage.min.js