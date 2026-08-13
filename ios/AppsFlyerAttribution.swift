import Foundation
import AppsFlyerLib

/// Buffers AppDelegate-level deep-link callbacks that can arrive before `RNAppsFlyerImpl` has
/// finished registering `AppsFlyerLib`'s deep-link delegate (e.g. a cold-start Universal Link,
/// which iOS delivers to the AppDelegate before RN's JS thread has even run `initSdk`, let alone
/// the `registerDeepLinkListener()` call that follows it). Calling into `AppsFlyerLib` before
/// that point either hits an unconfigured devKey/appId (same failure mode documented for
/// `registerDeepLinkListener` in `.claude/rules/known-issues-kb.md`) or -- if devKey/appId happen
/// to be set but the delegate isn't yet -- silently resolves the click with nobody listening,
/// dropping the `onDeepLinking` callback. See `RNAppsFlyerImpl.executeRpc` for what flips
/// `bridgeReady`.
///
/// Mirrors AppsFlyer's own Capacitor plugin (`AppsFlyerAttribution.swift`) -- `bridgeReady` is
/// flipped by a direct call from `RNAppsFlyerImpl` rather than NotificationCenter, since both
/// live in the same Swift module here (no ObjC/Swift translation-unit boundary to cross).
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

    // url+options takes priority over a buffered userActivity, matching AppsFlyerLib's own
    // handleOpenUrl/continueUserActivity precedence when both could describe the same open.
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
