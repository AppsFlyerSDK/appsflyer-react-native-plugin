package com.appsflyer.rnpluginexample

import android.content.Intent
import com.appsflyer.AppsFlyerLib
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AppsFlyerExample"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    // Forward to SDK before onResume stamps the URI with af_consumed=true.
    // Without this, warm-app VIEW intents are silently consumed and the
    // registered DeepLinkListener never fires.
    val url = intent.data?.toString()
    if (url != null) {
      AppsFlyerLib.getInstance().performDeepLinking(url, true)
    }
  }
}
