import Foundation
import AppsFlyerLib

/// AppDelegate-facing facade for all three AppsFlyer lifecycle forwards (one import for callers); `continueUserActivity`/`handleOpen` buffer until `RNAppsFlyerImpl` flips `bridgeReady`, `handleLaunchOptions` has no such hazard and always forwards immediately -- see `native-ios.md` §4a.
@objc(AppsFlyerAttribution)
public final class AppsFlyerAttribution: NSObject {

    @objc public static let shared = AppsFlyerAttribution()

    @objc public var bridgeReady = false {
        didSet { if bridgeReady { flushPending() } }
    }

    private var pendingUserActivity: NSUserActivity?
    private var pendingUrl: URL?
    private var pendingOptions: [AnyHashable: Any] = [:]

    private override init() {}

    @objc public func continueUserActivity(
        _ userActivity: NSUserActivity,
        restorationHandler: (([Any]?) -> Void)? = nil
    ) {
        guard bridgeReady else {
            pendingUserActivity = userActivity
            return
        }
        AppsFlyerLib.shared().continue(userActivity, restorationHandler: restorationHandler)
    }

    @objc public func handleOpen(_ url: URL, options: [AnyHashable: Any] = [:]) {
        guard bridgeReady else {
            pendingUrl = url
            pendingOptions = options
            return
        }
        AppsFlyerLib.shared().handleOpen(url, options: options)
    }

    @objc public func handleLaunchOptions(_ launchOptions: [AnyHashable: Any]?) {
        AppsFlyerLib.shared().handleLaunchOptions(launchOptions)
    }

    // url+options takes priority over a buffered userActivity, matching AppsFlyerLib's own precedence.
    private func flushPending() {
        if let url = pendingUrl {
            AppsFlyerLib.shared().handleOpen(url, options: pendingOptions)
            pendingUrl = nil
            pendingOptions = [:]
        } else if let userActivity = pendingUserActivity {
            AppsFlyerLib.shared().continue(userActivity, restorationHandler: nil)
            pendingUserActivity = nil
        }
    }
}
