import Foundation
import AppsFlyerRPC

/// RPC dispatch and event-channel logic behind the RNAppsFlyer TurboModule adapter.
@objc(RNAppsFlyerImpl)
public final class RNAppsFlyerImpl: NSObject {

    private let eventEmitter: (String) -> Void

    @objc public init(eventEmitter: @escaping (String) -> Void) {
        self.eventEmitter = eventEmitter
        super.init()
        // AppsFlyerRPCBridge is @MainActor-isolated (AppsFlyerRPC-Swift.h) -- hop required, not optional.
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
        // executeRpc runs on RN's background method queue, not main, so this hop is required; bridge's internal stream keeps enqueue order regardless (AppsFlyerRPCBridgeOrderingTests.swift).
        Task { @MainActor in
            AppsFlyerRPCBridge.shared.executeJson(requestJson) { responseJson in
                let (normalized, succeeded) = Self.normalize(iosResponseJson: responseJson)
                if requestedMethod == "initialize" && succeeded {
                    // Completion fires on RPCQueue's background queue, not MainActor -- hence this separate hop.
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

        // Unwrap the {success, message, data?} envelope to bare `data` so iOS matches Android's resolved shape.
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
