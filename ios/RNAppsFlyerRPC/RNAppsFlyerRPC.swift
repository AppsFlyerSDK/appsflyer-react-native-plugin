//
//  RNAppsFlyerRPC.swift
//  react-native-appsflyer
//
//  Swift Implementation for RNAppsFlyerRPC TurboModule
//

import Foundation
import AppsFlyerRPC
import React

@objcMembers
public class RNAppsFlyerRPCImpl: NSObject {
    
    // RPC Client from AppsFlyerRPC framework
    private var rpcClient: AFRPCClient?
    
    // Reference to the Objective-C module for event emission
    private weak var eventEmitterRef: RNAppsFlyerRPC?
    
    public override init() {
        super.init()
        if #available(iOS 13.0, *) {
            self.rpcClient = AFRPCClient { [weak self] jsonEvent in
                self?.emitEventToJavaScript(jsonEvent)
            }
        }
    }
    
    public func setEventEmitter(_ emitter: RNAppsFlyerRPC) {
        self.eventEmitterRef = emitter
    }
    
    /// Execute JSON-RPC request
    /// - Parameters:
    ///   - jsonRequest: JSON-encoded RPC request string
    ///   - resolve: Promise resolve callback
    ///   - reject: Promise reject callback
    public func executeJson(jsonRequest: String,
                           resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
        
        guard #available(iOS 13.0, *) else {
            reject("UNSUPPORTED_IOS_VERSION",
                   "iOS 13.0+ is required for RPC support",
                   nil)
            return
        }
        
        guard let client = rpcClient else {
            reject("RPC_CLIENT_NOT_INITIALIZED", "RPC client is not initialized", nil)
            return
        }
        
        Task {
            do {
                let jsonResponse = await client.execute(jsonRequest: jsonRequest)
                resolve(jsonResponse)
            } catch {
                reject("RPC_EXECUTION_ERROR", error.localizedDescription, error as NSError)
            }
        }
    }
    
    private func emitEventToJavaScript(_ jsonEvent: String) {
        guard let emitter = eventEmitterRef else {
            return
        }
        
        guard let eventData = jsonEvent.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: eventData) as? [String: Any] else {
            return
        }
        
        let sendEvent = {
            emitter.sendEvent(withName: "onEvent", body: json)
        }
        
        if Thread.isMainThread {
            sendEvent()
        } else {
            DispatchQueue.main.async {
                sendEvent()
            }
        }
    }
}