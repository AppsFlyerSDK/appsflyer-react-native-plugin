package com.appsflyer.reactnative;

import android.content.Context
import com.appsflyer.api.PurchaseClient
import com.appsflyer.api.Store
import com.appsflyer.internal.models.*
import com.appsflyer.internal.models.InAppPurchaseValidationResult
import com.appsflyer.internal.models.SubscriptionPurchase
import com.appsflyer.internal.models.SubscriptionValidationResult
import com.appsflyer.internal.models.ValidationFailureData

/** Wraps [PurchaseClient]'s Builder-configured client, translating its callbacks/data sources to plain maps for the RN bridge. */
class ConnectorWrapper(
    context: Context,
    logSubs: Boolean,
    logInApps: Boolean,
    sandbox: Boolean,
    subsListener: PurchaseClient.ValidationResultListener<Map<String, Any>>,
    inAppListener: PurchaseClient.ValidationResultListener<Map<String, Any>>,
) :
    PurchaseClient {
    private var subscriptionDataSource: Map<String, Any> = mapOf()
    private var inAppDataSource: Map<String, Any> = mapOf()

    private val connector =
        PurchaseClient.Builder(context, Store.GOOGLE)
            .setSandbox(sandbox)
            .logSubscriptions(logSubs)
            .autoLogInApps(logInApps)
            .setSubscriptionValidationResultListener(object :
                PurchaseClient.SubscriptionPurchaseValidationResultListener {
                override fun onResponse(result: Map<String, SubscriptionValidationResult>?) {
                    subsListener.onResponse(result?.entries?.associate { (k, v) -> k to v.toJsonMap() })
                }

                override fun onFailure(result: String, error: Throwable?) {
                    subsListener.onFailure(result, error)
                }
            })
            .setInAppValidationResultListener(object : PurchaseClient.InAppPurchaseValidationResultListener {
                override fun onResponse(result: Map<String, InAppPurchaseValidationResult>?) {
                    inAppListener.onResponse(result?.entries?.associate { (k, v) -> k to v.toJsonMap() })
                }
                override fun onFailure(result: String, error: Throwable?) {
                    inAppListener.onFailure(result, error)
                }
            })
            .setSubscriptionPurchaseEventDataSource(PurchaseClient.SubscriptionPurchaseEventDataSource { _ -> subscriptionDataSource })
            .setInAppPurchaseEventDataSource(PurchaseClient.InAppPurchaseEventDataSource { _ -> inAppDataSource })
            .build()

    override fun startObservingTransactions() = connector.startObservingTransactions()

    override fun stopObservingTransactions() = connector.stopObservingTransactions()

    fun setSubscriptionPurchaseEventDataSource(dataSource: Map<String, Any>) {
        subscriptionDataSource = dataSource
    }

    fun setInAppPurchaseEventDataSource(dataSource: Map<String, Any>) {
        inAppDataSource = dataSource
    }

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
            "testPurchase" to testPurchase?.let { emptyMap<String, Any?>() }
        )
    }

    private fun CanceledStateContext.toJsonMap(): Map<String, Any?> {
        return mapOf(
            "developerInitiatedCancellation" to developerInitiatedCancellation?.let { emptyMap<String, Any?>() },
            "replacementCancellation" to replacementCancellation?.let { emptyMap<String, Any?>() },
            "systemInitiatedCancellation" to systemInitiatedCancellation?.let { emptyMap<String, Any?>() },
            "userInitiatedCancellation" to userInitiatedCancellation?.toJsonMap()
        )
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