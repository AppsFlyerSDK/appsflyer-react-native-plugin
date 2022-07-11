#!/bin/sh
set -eo pipefail

gpg --quiet --batch --yes --decrypt --passphrase="$IOS_KEYS" --output ./.github/secrets/GithubCIApp.mobileprovision.mobileprovision ./.github/secrets/GithubCIApp.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$IOS_KEYS" --output ./.github/secrets/GithubCICer.p12 ./.github/secrets/GithubCICer.p12.gpg

mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles

cp ./.github/secrets/GithubCIApp.mobileprovision.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/GithubCIApp.mobileprovision.mobileprovision


security create-keychain -p "$IOS_KEYS" build.keychain
security import ./.github/secrets/GithubCICer.p12 -t agg -k ~/Library/Keychains/build.keychain -P "$IOS_KEYS" -A

security list-keychains -s ~/Library/Keychains/build.keychain
security default-keychain -s ~/Library/Keychains/build.keychain
security unlock-keychain -p "$IOS_KEYS" ~/Library/Keychains/build.keychain

security set-key-partition-list -S apple-tool:,apple: -s -k "$IOS_KEYS" ~/Library/Keychains/build.keychain