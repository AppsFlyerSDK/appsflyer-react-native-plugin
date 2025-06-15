//
//  AFTransactionFetcher.swift
//  RNAppsFlyer
//
//  Created by Amit Levy on 03/03/2025.
//  Copyright © 2025 Facebook. All rights reserved.
//

import Foundation
import StoreKit

#if canImport(PurchaseConnector)
import PurchaseConnector

@available(iOS 15.0, *)
@objc(AFTransactionFetcher)
@objcMembers public final class AFTransactionFetcher: NSObject {
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc public func fetchTransaction(transactionId: String, completion: @escaping (AFSDKTransactionSK2?) -> Void) {
        guard let transactionIdUInt64 = UInt64(transactionId) else {
            print("Invalid transaction ID format.")
            completion(nil)
            return
        }
        
        Task {
            do {
                let allTransactions = try await Transaction.all
                let verifiedTransactions = allTransactions.compactMap { verificationResult -> Transaction? in
                    if case .verified(let transaction) = verificationResult {
                        return transaction
                    }
                    return nil
                }
                
                if let matchingTransaction = await verifiedTransactions.first(where: { $0.id == transactionIdUInt64 }) {
                    let afTransaction = AFSDKTransactionSK2(transaction: matchingTransaction)
                    completion(afTransaction)
                } else {
                    completion(nil)
                }
            } catch {
                print("Error fetching transactions: \(error)")
                completion(nil)
            }
        }
    }
}

#endif
