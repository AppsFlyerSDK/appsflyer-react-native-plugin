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
@objc class TransactionFetcher: NSObject {
    @objc static func fetchTransaction(withId transactionId: String, completion: @escaping (AFSDKTransactionSK2?) -> Void) {
        Task {
            if #available(iOS 15.0, *) {
                do {
                    let allTransactions = try await Transaction.all
                    if let matchingTransaction = allTransactions.first(where: { $0.id == UInt64(transactionId) }) {
                        let afTransaction = AFSDKTransactionSK2(transaction: matchingTransaction)
                        completion(afTransaction)
                    } else {
                        completion(nil)
                    }
                } catch {
                    print("Error fetching transactions: \(error)")
                    completion(nil)
                }
            } else {
                print("StoreKit 2 is not available on this iOS version.")
                completion(nil)
            }
        }
    }
}
#endif
