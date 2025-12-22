# AppsFlyer React Native Plugin - ProGuard Rules

# Keep AppsFlyer Plugin Bridge classes
-keep class com.appsflyer.pluginbridge.** { *; }
-keepclassmembers class com.appsflyer.pluginbridge.** { *; }

# Keep AppsFlyer RPC Handler
-keep class com.appsflyer.pluginbridge.handler.AppsFlyerRpcHandler { *; }
-keep class com.appsflyer.pluginbridge.model.** { *; }
-keep class com.appsflyer.pluginbridge.notifier.** { *; }
-keep class com.appsflyer.pluginbridge.parser.** { *; }

# Keep Kotlin coroutines
-keep class kotlinx.coroutines.** { *; }
-keepclassmembers class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Keep JSON-RPC related classes
-keep class org.json.** { *; }

# Keep React Native module
-keep class com.appsflyer.reactnative.RNAppsFlyerRPCModule { *; }
-keepclassmembers class com.appsflyer.reactnative.RNAppsFlyerRPCModule { *; }

# Keep AppsFlyer SDK (if not already included)
-keep class com.appsflyer.** { *; }
-dontwarn com.appsflyer.**

