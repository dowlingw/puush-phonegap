#!/bin/sh

EXECUTABLE=phonegap

PLUGINS="
org.apache.cordova.dialogs
org.apache.cordova.camera
org.apache.cordova.file
org.apache.cordova.file-transfer
"

PLATFORMS="
ios
"

rm -rf plugins/
rm -rf platforms/

for plugin in $PLUGINS; do
	$EXECUTABLE plugin add $plugin
done

for platform in $PLATFORMS; do
	$EXECUTABLE platform add $platform
done
