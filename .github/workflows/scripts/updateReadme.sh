#!/bin/bash

ios_sdk_version=$(cat react-native-appsflyer.podspec | grep '\'AppsFlyerFramework\' | grep -Eo '[0-9].[0-9]+.[0-9]+')
android_sdk_version=$(cat android/build.gradle | grep 'com.appsflyer:af-android-sdk' | grep -Eo '[0-9].[0-9]+.[0-9]+')
sed -i -e -r "s/Android AppsFlyer SDK \*\*v[0-9].[0-9]+.[0-9]+\*\*/Android AppsFlyer SDK \*\*v$android_sdk_version\*\*/g" README.md
sed -i -e -r "s/iOS AppsFlyer SDK \*\*v[0-9].[0-9]+.[0-9]+\*\*/iOS AppsFlyer SDK \*\*v$ios_sdk_version\*\*/g" README.md