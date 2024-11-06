package com.appsflyer.reactnative;

import android.content.Context
import com.appsflyer.api.PurchaseClient
import com.appsflyer.api.Store
import com.appsflyer.internal.models.*
import com.appsflyer.internal.models.InAppPurchaseValidationResult
import com.appsflyer.internal.models.SubscriptionPurchase
import com.appsflyer.internal.models.SubscriptionValidationResult
import com.appsflyer.internal.models.ValidationFailureData

/**
 * A connector class that wraps the Android purchase connector client.
 *
 * This class uses the Builder pattern to configure the Android purchase connector client.
 * It implements the [PurchaseClient] interface required by the appsflyer_sdk and translates
 * the various callbacks and responses between the two interfaces.
 *
 * @property context The application context.
 * @property logSubs If true, subscription transactions will be logged.
 * @property logInApps If true, in-app purchase transactions will be logged.
 * @property sandbox If true, the purchase client will be in sandbox mode.
 * @property subsListener The listener for subscription purchase validation results.
 * @property inAppListener The listener for in-app purchase validation Result.
 */
class ConnectorWrapper(
    context: Context,
    logSubs: Boolean,
    logInApps: Boolean,
    sandbox: Boolean,
    subsListener: MappedValidationResultListener,
    inAppListener: MappedValidationResultListener,
) :
    PurchaseClient {
    private val connector =
        PurchaseClient.Builder(context, Store.GOOGLE).setSandbox(sandbox).logSubscriptions(logSubs)
            .autoLogInApps(logInApps).setSubscriptionValidationResultListener(object :
                PurchaseClient.SubscriptionPurchaseValidationResultListener {
                override fun onResponse(result: Map<String, SubscriptionValidationResult>?) {
                    subsListener.onResponse(result?.entries?.associate { (k, v) -> k to v.toJsonMap() })
                }

                override fun onFailure(result: String, error: Throwable?) {
                    subsListener.onFailure(result, error)
                }
            }).setInAppValidationResultListener(object : PurchaseClient.InAppPurchaseValidationResultListener{
                override fun onResponse(result: Map<String, InAppPurchaseValidationResult>?) {
                    inAppListener.onResponse(result?.entries?.associate { (k, v) -> k to v.toJsonMap() })
                }

                override fun onFailure(result: String, error: Throwable?) {
                    inAppListener.onFailure(result, error)
                }
            })
            .build()

    /**
     * Starts observing all incoming transactions from the play store.
     */
    override fun startObservingTransactions() = connector.startObservingTransactions()

    /**
     * Stops observing all incoming transactions from the play store.
     */
    override fun stopObservingTransactions() = connector.stopObservingTransactions()


    /**
     * Converts [SubscriptionPurchase] to a Json map, which then is delivered to SDK's method response.
     *
     * @return A map representing this SubscriptionPurchase.
     */
    private fun SubscriptionPurchase.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "acknowledgementState" to acknowledgementState,
            "canceledStateContext" to canceledStateContext?.toJsonMap(),
            "externalAccountIdentifiers" to externalAccountIdentifiers?.toJsonMap(),
            "kind" to kind,
            "latestOrderId" to latestOrderId,
            "lineItems" to lineItems.map { it.toJsonMap() },
            "linkedPurchaseToken" to linkedPurchaseToken,
            "pausedStateContext" to pausedStateContext?.toJsonMap(),
            "regionCode" to regionCode,
            "startTime" to startTime,
            "subscribeWithGoogleInfo" to subscribeWithGoogleInfo?.toJsonMap(),
            "subscriptionState" to subscriptionState,
            "testPurchase" to testPurchase?.toJsonMap()
        )
    }

    private fun CanceledStateContext.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "developerInitiatedCancellation" to developerInitiatedCancellation?.toJsonMap(),
            "replacementCancellation" to replacementCancellation?.toJsonMap(),
            "systemInitiatedCancellation" to systemInitiatedCancellation?.toJsonMap(),
            "userInitiatedCancellation" to userInitiatedCancellation?.toJsonMap()
        )
    }

    private fun DeveloperInitiatedCancellation.toJsonMap(): Map<String, Any?> {
        return mapOf()
    }

    private fun ReplacementCancellation.toJsonMap(): Map<String, Any?> {
        return mapOf()
    }

    private fun SystemInitiatedCancellation.toJsonMap(): Map<String, Any?> {
        return mapOf()
    }

    private fun UserInitiatedCancellation.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "cancelSurveyResult" to cancelSurveyResult?.toJsonMap(),
            "cancelTime" to cancelTime
        )
    }

    private fun CancelSurveyResult.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "reason" to reason,
            "reasonUserInput" to reasonUserInput
        )
    }

    private fun ExternalAccountIdentifiers.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "externalAccountId" to externalAccountId,
            "obfuscatedExternalAccountId" to obfuscatedExternalAccountId,
            "obfuscatedExternalProfileId" to obfuscatedExternalProfileId
        )
    }

    private fun SubscriptionPurchaseLineItem.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "autoRenewingPlan" to autoRenewingPlan?.toJsonMap(),
            "deferredItemReplacement" to deferredItemReplacement?.toJsonMap(),
            "expiryTime" to expiryTime,
            "offerDetails" to offerDetails?.toJsonMap(),
            "prepaidPlan" to prepaidPlan?.toJsonMap(),
            "productId" to productId
        )
    }

    private fun OfferDetails.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "offerTags" to offerTags,
            "basePlanId" to basePlanId,
            "offerId" to offerId
        )
    }

    private fun AutoRenewingPlan.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "autoRenewEnabled" to autoRenewEnabled,
            "priceChangeDetails" to priceChangeDetails?.toJsonMap()
        )
    }

    private fun SubscriptionItemPriceChangeDetails.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "expectedNewPriceChargeTime" to expectedNewPriceChargeTime,
            "newPrice" to newPrice?.toJsonMap(),
            "priceChangeMode" to priceChangeMode,
            "priceChangeState" to priceChangeState
        )
    }

    private fun Money.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "currencyCode" to currencyCode,
            "nanos" to nanos,
            "units" to units
        )
    }

    private fun DeferredItemReplacement.toJsonMap(): Map<String, Any?> {
        return mapOf("productId" to productId)
    }

    private fun PrepaidPlan.toJsonMap(): Map<String, Any?> {
        return mapOf("allowExtendAfterTime" to allowExtendAfterTime)
    }

    private fun PausedStateContext.toJsonMap(): Map<String, Any?> {
        return mapOf("autoResumeTime" to autoResumeTime)
    }

    private fun SubscribeWithGoogleInfo.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "emailAddress" to emailAddress,
            "familyName" to familyName,
            "givenName" to givenName,
            "profileId" to profileId,
            "profileName" to profileName
        )
    }

    fun TestPurchase.toJsonMap(): Map<String, Any?> {
        return mapOf()
    }

    private fun ProductPurchase.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "kind" to kind,
            "purchaseTimeMillis" to purchaseTimeMillis,
            "purchaseState" to purchaseState,
            "consumptionState" to consumptionState,
            "developerPayload" to developerPayload,
            "orderId" to orderId,
            "purchaseType" to purchaseType,
            "acknowledgementState" to acknowledgementState,
            "purchaseToken" to purchaseToken,
            "productId" to productId,
            "quantity" to quantity,
            "obfuscatedExternalAccountId" to obfuscatedExternalAccountId,
            "obfuscatedExternalProfileId" to obfuscatedExternalProfileId,
            "regionCode" to regionCode
        )
    }

    /**
     * Converts [InAppPurchaseValidationResult] into a map of objects so that the Object can be passed to Flutter using a method channel
     *
     * @return A map representing this InAppPurchaseValidationResult.
     */
    private fun InAppPurchaseValidationResult.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "success" to success,
            "productPurchase" to productPurchase?.toJsonMap(),
            "failureData" to failureData?.toJsonMap()
        )
    }

    private fun SubscriptionValidationResult.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "success" to success,
            "subscriptionPurchase" to subscriptionPurchase?.toJsonMap(),
            "failureData" to failureData?.toJsonMap()
        )
    }

    private fun ValidationFailureData.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "status" to status,
            "description" to description
        )
    }
}