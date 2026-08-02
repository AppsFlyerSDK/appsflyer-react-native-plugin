import Foundation
import AppsFlyerRPC

/// RPC dispatch and event-channel logic behind the RNAppsFlyer TurboModule adapter.
@objc(RNAppsFlyerImpl)
public final class RNAppsFlyerImpl: NSObject {

    private let eventEmitter: (String) -> Void

    /// Canonical → iOS method name remapping; methods not present here are forwarded unchanged.
    /// "init" -> "initialize" is verified against AppsFlyerRPC's own source (AFRPCTypedRequests.swift,
    /// AFRPCInitRequest.methodName) -- bare "init" 404s on the real RPC layer. Android's wire name for
    /// the same canonical call is genuinely "init" (unchanged); this divergence is intentional.
    private static let canonicalToIOSMethod: [String: String] = [
        "init": "initialize",
        "sendPushNotificationData": "handlePushNotification",
        "updateServerUninstallToken": "registerUninstall",
    ]

    /// register*Listener RPCs are dropped by the native RPC layer if they arrive before init
    /// resolves (`AFRPCRequestHandler`'s pre-ready `deepLinkRoute` hard-fails with "Not ready" —
    /// it does not queue). A cold start via Universal Link/URI scheme can reach these before JS
    /// calls `init()`, so buffer and flush after.
    ///
    /// `handleOpenURL`/`handleOpenUrl`/`continueUserActivity` used to be buffered here too, back
    /// when they were JS-callable RPCs — they no longer are (moved to native-only; the app calls
    /// `AppsFlyerLib.shared()` directly from its own AppDelegate, same as `expo/withAppsFlyerIos.js`
    /// already does). Removed from this set rather than left as dead entries.
    private static let bufferedUntilInitMethods: Set<String> = [
        "registerConversionListener",
        "registerDeeplinkListener",
        "registerSessionReadyListener",
    ]

    private let initGateQueue = DispatchQueue(label: "com.appsflyer.reactnative.initGate")
    private var initCompleted = false
    private var pendingRegistrations: [(String, RCTPromiseResolveBlock)] = []

    @objc public init(eventEmitter: @escaping (String) -> Void) {
        self.eventEmitter = eventEmitter
        super.init()

        // must register before initSdk/start — native drops events emitted before handler is set.
        // AppsFlyerRPCBridge.shared is @MainActor-isolated; hop via Task, which preserves ordering
        // relative to dispatchToNative's own Task hop below since both enqueue FIFO on the main actor.
        Task { @MainActor in
            AppsFlyerRPCBridge.shared.setEventHandler { [weak self] jsonEvent in
                self?.eventEmitter(jsonEvent)
            }
        }
    }

    @objc public func executeRpc(
        _ requestJson: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        let canonicalMethod = Self.canonicalMethodName(fromRequestJson: requestJson)

        if canonicalMethod == "init" {
            dispatchToNative(requestJson: requestJson) { [weak self] normalizedResponseJson in
                resolve(normalizedResponseJson)
                if Self.isSuccess(normalizedResponseJson: normalizedResponseJson) {
                    self?.flushPendingRegistrations()
                } else {
                    self?.rejectPendingRegistrations(withNormalizedResponseJson: normalizedResponseJson)
                }
            }
            return
        }

        if let canonicalMethod, Self.bufferedUntilInitMethods.contains(canonicalMethod) {
            let buffered: Bool = initGateQueue.sync {
                guard !initCompleted else { return false }
                pendingRegistrations.append((requestJson, resolve))
                return true
            }
            if buffered {
                return
            }
        }

        dispatchToNative(requestJson: requestJson) { resolve($0) }
    }

    private func flushPendingRegistrations() {
        let pending: [(String, RCTPromiseResolveBlock)] = initGateQueue.sync {
            initCompleted = true
            defer { pendingRegistrations = [] }
            return pendingRegistrations
        }
        for (requestJson, resolve) in pending {
            dispatchToNative(requestJson: requestJson) { resolve($0) }
        }
    }

    // On a failed init, buffered register*Listener calls would otherwise hang forever (nothing
    // ever calls their resolve block). initCompleted is deliberately left false so a later,
    // successful init retry can still buffer and flush new registrations normally — only the
    // registrations already stuck waiting on *this* failed attempt are unstuck here, resolved
    // with the same normalized error envelope the init call itself surfaced.
    private func rejectPendingRegistrations(withNormalizedResponseJson normalizedResponseJson: String) {
        let pending: [(String, RCTPromiseResolveBlock)] = initGateQueue.sync {
            defer { pendingRegistrations = [] }
            return pendingRegistrations
        }
        for (_, resolve) in pending {
            resolve(normalizedResponseJson)
        }
    }

    private func dispatchToNative(requestJson: String, completion: @escaping (String) -> Void) {
        let remappedRequestJson = Self.remapMethodName(inRequestJson: requestJson)
        Task { @MainActor in
            AppsFlyerRPCBridge.shared.executeJson(remappedRequestJson) { responseJson in
                completion(Self.normalize(iosResponseJson: responseJson))
            }
        }
    }

    private static func canonicalMethodName(fromRequestJson requestJson: String) -> String? {
        guard
            let data = requestJson.data(using: .utf8),
            let request = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return nil
        }
        return request["method"] as? String
    }

    private static func isSuccess(normalizedResponseJson responseJson: String) -> Bool {
        guard
            let data = responseJson.data(using: .utf8),
            let response = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return false
        }
        return response["success"] as? Bool == true
    }

    /// Rewrites `method` to the platform's real RPC name; falls back to original JSON on parse failure.
    private static func remapMethodName(inRequestJson requestJson: String) -> String {
        guard
            let data = requestJson.data(using: .utf8),
            var request = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let canonicalMethod = request["method"] as? String,
            let iosMethod = canonicalToIOSMethod[canonicalMethod]
        else {
            return requestJson
        }
        request["method"] = iosMethod
        guard
            let remappedData = try? JSONSerialization.data(withJSONObject: request),
            let remappedJson = String(data: remappedData, encoding: .utf8)
        else {
            return requestJson
        }
        return remappedJson
    }

    /// Normalizes iOS's AFRPCResponse into the shared { success, data|error } shape.
    private static func normalize(iosResponseJson responseJson: String) -> String {
        guard
            let data = responseJson.data(using: .utf8),
            let response = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return encodeNormalizedError(code: 500, message: "Malformed AFRPCResponse from native RPC layer")
        }

        if let error = response["error"] as? [String: Any] {
            let code = error["code"] as? Int ?? 500
            let message = error["message"] as? String ?? "Unknown protocol error"
            return encodeNormalizedError(code: code, message: message)
        }

        guard let result = response["result"] as? [String: Any] else {
            return encodeNormalizedError(code: 500, message: "Missing result in AFRPCResponse")
        }

        if result["success"] as? Bool == false {
            let message = (result["error"] as? String) ?? (result["message"] as? String) ?? "SDK-level failure"
            return encodeNormalizedError(code: 500, message: message)
        }

        // `result` is a status envelope ({success, message, data?}) — unwrap to the bare `data`
        // (NSNull if absent) so iOS resolves the same shape as Android instead of the whole envelope.
        return encodeNormalizedSuccess(data: result["data"] ?? NSNull())
    }

    private static func encodeNormalizedSuccess(data: Any) -> String {
        let normalized: [String: Any] = ["success": true, "data": data]
        return encodeJSONOrFallback(normalized)
    }

    private static func encodeNormalizedError(code: Int, message: String) -> String {
        let normalized: [String: Any] = [
            "success": false,
            "error": ["code": code, "message": message],
        ]
        return encodeJSONOrFallback(normalized)
    }

    /// Always returns valid JSON — AFRPCResponse guarantees completion is always called.
    private static func encodeJSONOrFallback(_ object: [String: Any]) -> String {
        guard
            let data = try? JSONSerialization.data(withJSONObject: object),
            let json = String(data: data, encoding: .utf8)
        else {
            return "{\"success\":false,\"error\":{\"code\":500,\"message\":\"Failed to encode RPC response\"}}"
        }
        return json
    }
}
