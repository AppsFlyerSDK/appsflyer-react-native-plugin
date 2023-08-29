#!/bin/bash

# Plugin version from release branch
PLUGIN_VERSION=$1

# Gets the plugin version for platform_extension_v2 in every platform
IOS_PLUGIN_VERSION=$(cat ios/RNAppsFlyer.h | grep 'kAppsFlyerPluginVersion' | grep -Eo '[0-9].[0-9]+.[0-9]')
ANDROID_PLUGIN_VERSION=$(cat android/src/main/java/com/appsflyer/reactnative/RNAppsFlyerConstants.java | grep 'PLUGIN_VERSION' | grep -Eo '[0-9].[0-9]+.[0-9]')

# Check if PLUGIN_VERSION, IOS_PLUGIN_VERSION and ANDROID_PLUGIN_VERSION are equal
echo "version from branch: $PLUGIN_VERSION\nplatform_extension_v2 ios: $IOS_PLUGIN_VERSION\nplatform_extension_v2 android: $ANDROID_PLUGIN_VERSION"
if [[ "$PLUGIN_VERSION" == "$IOS_PLUGIN_VERSION" && "$PLUGIN_VERSION" == "$ANDROID_PLUGIN_VERSION" ]]; then
    echo "platform_extension_v2 version is aligned"
else
    echo "platform_extension_v2 version is different!"
    exit 1
fi