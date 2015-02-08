#!/bin/sh

EXECUTABLE=phonegap

PLUGINS="
org.apache.cordova.dialogs
org.apache.cordova.camera
org.apache.cordova.statusbar
"

PLATFORMS="
ios
"

for plugin in $PLUGINS; do
	$EXECUTABLE plugin add $plugin
done

for platform in $PLATFORMS; do
	$EXECUTABLE platform add $platform
done
