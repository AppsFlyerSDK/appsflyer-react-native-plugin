import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import react_native_appsflyer

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "example",
      in: window,
      launchOptions: launchOptions
    )

    // QA: when launched via `simctl launch ... -deepLinkURL "<url>"`, replay
    // the URL through application(_:open:options:) so the AppsFlyer plugin
    // sees it as a real custom-scheme open. Bypasses the iOS 17/18
    // "Open in <App>?" confirmation dialog that `simctl openurl` triggers in
    // non-interactive CI. Only set by the E2E runner; production unaffected.
    let deepLinkURL: URL? = {
      let args = ProcessInfo.processInfo.arguments
      if let idx = args.firstIndex(of: "-deepLinkURL"),
         idx + 1 < args.count,
         let u = URL(string: args[idx + 1]) {
        return u
      }
      if let s = UserDefaults.standard.string(forKey: "deepLinkURL"),
         let u = URL(string: s) {
        return u
      }
      return nil
    }()
    if let deepLinkURL = deepLinkURL {
      DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) { [weak self, weak application] in
        guard let self = self, let application = application else { return }
        _ = self.application(application, open: deepLinkURL, options: [:])
      }
    }

    return true
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    NSLog("[AF_QA][DEEPLINK_NATIVE] openURL received: %@", url.absoluteString)
    AppsFlyerAttribution.shared().handleOpen(url, options: options)
    return true
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([Any]?) -> Void
  ) -> Bool {
    NSLog("[AF_QA][DEEPLINK_NATIVE] continueUserActivity: %@", userActivity.webpageURL?.absoluteString ?? "nil")
    AppsFlyerAttribution.shared().continue(userActivity, restorationHandler: restorationHandler)
    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
