if [[ \"$1\" = \"strict\" ]]; then
    cat podspec-strict-template.txt > react-native-appsflyer.podspec
    echo "AppsFlyer SDK Strict mode ✅ "
else
  cat podspec-regular-template.txt > react-native-appsflyer.podspec
  echo "AppsFlyer SDK Regular mode ✅ "
fi
