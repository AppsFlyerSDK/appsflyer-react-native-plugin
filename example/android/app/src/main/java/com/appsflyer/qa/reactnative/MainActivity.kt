package com.appsflyer.qa.reactnative

import android.content.Intent
import android.util.Log
import com.appsflyer.AppsFlyerLib
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "example"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    Log.d("AF_QA", "[AF_QA][DEEPLINK_NATIVE] onNewIntent: ${intent.data}")
    setIntent(intent)
    // Forward to SDK before onResume stamps the URI with af_consumed=true.
    // Without this, warm-app VIEW intents are silently consumed and the
    // registered DeepLinkListener never fires.
    AppsFlyerLib.getInstance().performOnDeepLinking(intent, applicationContext)
  }
}
