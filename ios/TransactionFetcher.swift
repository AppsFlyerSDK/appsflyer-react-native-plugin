//
//  TransactionFetcher.swift
//  RNAppsFlyer
//
//  Created by Amit Levy on 19/01/2025.
//  Copyright © 2025 Facebook. All rights reserved.
//

import Foundation
import StoreKit

#if canImport(PurchaseConnector)
import PurchaseConnector
@objc(TransactionFetcher)
class TransactionFetcher: NSObject, RCTBridgeModule {
    @objc func fetchTransaction(_ transactionId: String, callback: @escaping RCTResponseSenderBlock) {
        if #available(iOS 15.0, *) {
            Task {
                do {
                    let allTransactions = try await Transaction.all
                    // Unwrap verified transactions
                    let verifiedTransactions = allTransactions.compactMap { verificationResult -> Transaction? in
                        switch verificationResult {
                        case .verified(let transaction):
                            return transaction
                        case .unverified(_, _):
                            return nil
                        }
                    }
                    
                    if let matchingTransaction = await verifiedTransactions.first(where: { $0.id == UInt64(transactionId) }) {
                        let afTransaction = AFSDKTransactionSK2(transaction: matchingTransaction)
                        callback([NSNull(), afTransaction])
                    } else {
                        callback([NSNull(), NSNull()])
                    }
                } catch {
                    print("Error fetching transactions: \(error)")
                    callback([error.localizedDescription, NSNull()])
                }
            }
        } else {
            print("StoreKit 2 is not available on this iOS version.")
            callback(["StoreKit 2 is not available on this iOS version.", NSNull()])
        }
    }
}
#endif
