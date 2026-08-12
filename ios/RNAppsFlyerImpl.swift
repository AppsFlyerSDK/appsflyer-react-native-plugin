import Foundation
import AppsFlyerRPC

/// RPC dispatch and event-channel logic behind the RNAppsFlyer TurboModule adapter.
@objc(RNAppsFlyerImpl)
public final class RNAppsFlyerImpl: NSObject {

    private let eventEmitter: (String) -> Void

    private static let canonicalToIOSMethod: [String: String] = [
        "init": "initialize",
        "sendPushNotificationData": "handlePushNotification",
        "updateServerUninstallToken": "registerUninstall",
    ]

    @objc public init(eventEmitter: @escaping (String) -> Void) {
        self.eventEmitter = eventEmitter
        super.init()
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
        let requestedMethod = Self.canonicalMethod(ofRequestJson: requestJson)
        let remappedRequestJson = Self.remapMethodName(inRequestJson: requestJson, canonicalMethod: requestedMethod)
        Task { @MainActor in
            AppsFlyerRPCBridge.shared.executeJson(remappedRequestJson) { responseJson in
                let (normalized, succeeded) = Self.normalize(iosResponseJson: responseJson)
                if requestedMethod == "start" && succeeded {
                    // Explicit hop, not redundant with the enclosing Task's @MainActor: this
                    // completion closure comes from AppsFlyerRPCBridge.executeJson, which forks
                    // an unstructured, non-actor-isolated Task internally (see known-issues-kb.md's
                    // registerSessionReadyListener TOCTOU entry) -- it is not guaranteed to run on
                    // MainActor just because the call that started it was. AppsFlyerAttribution's
                    // bridgeReady/pendingUrl/pendingUserActivity are also written from the
                    // AppDelegate's main-thread continueUserActivity/handleOpen -- without this
                    // hop, both writes race.
                    Task { @MainActor in
                        AppsFlyerAttribution.shared.bridgeReady = true
                    }
                }
                resolve(normalized)
            }
        }
    }

    private static func canonicalMethod(ofRequestJson requestJson: String) -> String? {
        guard
            let data = requestJson.data(using: .utf8),
            let request = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return nil
        }
        return request["method"] as? String
    }

    /// Rewrites `method` to the platform's real RPC name; falls back to original JSON on parse failure.
    private static func remapMethodName(inRequestJson requestJson: String, canonicalMethod: String?) -> String {
        guard
            let canonicalMethod,
            let iosMethod = canonicalToIOSMethod[canonicalMethod],
            let data = requestJson.data(using: .utf8),
            var request = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
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
    private static func normalize(iosResponseJson responseJson: String) -> (json: String, succeeded: Bool) {
        guard
            let data = responseJson.data(using: .utf8),
            let response = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return (encodeNormalizedError(code: 500, message: "Malformed AFRPCResponse from native RPC layer"), false)
        }

        if let error = response["error"] as? [String: Any] {
            let code = error["code"] as? Int ?? 500
            let message = error["message"] as? String ?? "Unknown protocol error"
            return (encodeNormalizedError(code: code, message: message), false)
        }

        guard let result = response["result"] as? [String: Any] else {
            return (encodeNormalizedError(code: 500, message: "Missing result in AFRPCResponse"), false)
        }

        if result["success"] as? Bool == false {
            let message = (result["error"] as? String) ?? (result["message"] as? String) ?? "SDK-level failure"
            return (encodeNormalizedError(code: 500, message: message), false)
        }

        // `result` is a status envelope ({success, message, data?}) — unwrap to the bare `data`
        // (NSNull if absent) so iOS resolves the same shape as Android instead of the whole envelope.
        return (encodeJSONOrFallback(["success": true, "data": result["data"] ?? NSNull()]), true)
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
