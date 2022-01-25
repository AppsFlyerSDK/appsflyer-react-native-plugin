//
//  RNAFSDKAppLifecycleDelegate.swift
//  RNAppsFlyer
//
//  Created by Amit Kremer on 25/01/2022.
//  Copyright © 2022 Facebook. All rights reserved.
//

import Foundation
import ExpoModulesCore

public class RNAFSDKAppLifecycleDelegate: ExpoAppDelegateSubscriber {
  public func applicationDidBecomeActive(_ application: UIApplication) {
    print("EXPOOO didbecomeactive")
  }
}
