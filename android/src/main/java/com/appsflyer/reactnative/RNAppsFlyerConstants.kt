package com.appsflyer.reactnative

object RNAppsFlyerConstants {

    // TODO: only caller is PCAppsFlyerModule's debug log tag — not sent to the SDK
    // (setPluginInfo's version comes from package.json via index.ts instead). Candidate
    // for downgrading out of the release-blocking version-sync contract; see release-versioning.md §1.
    const val PLUGIN_VERSION = "7.0.2"

    const val EVENT_SUBSCRIPTION_VALIDATION_SUCCESS = "subscriptionValidationSuccess"
    const val EVENT_SUBSCRIPTION_VALIDATION_FAILURE = "subscriptionValidationFailure"
    const val EVENT_IN_APP_PURCHASE_VALIDATION_SUCCESS = "inAppPurchaseValidationSuccess"
    const val EVENT_IN_APP_PURCHASE_VALIDATION_FAILURE = "inAppPurchaseValidationFailure"
}
