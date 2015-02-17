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
"

mkdir -p splash/ios

#-----------------------------------------------------------------------------
# No need to edit beyond this point

function notify { echo "$1..."; }

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
