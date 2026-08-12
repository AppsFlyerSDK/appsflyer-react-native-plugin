package com.appsflyer.reactnative

import com.appsflyer.pluginbridge.handler.AppsFlyerRpcHandler
import com.appsflyer.pluginbridge.model.RpcResponse
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import org.json.JSONObject
import java.util.concurrent.Executors

private const val RPC_EVENT_NAME = "RNAppsFlyer_rpcEvent"
private const val DEEP_LINK_EVENT_NAME = "onDeepLinking"

// registerDeeplinkListener has no native counterpart — native side calls it subscribeForDeepLink.
private const val CANONICAL_DEEP_LINK_METHOD = "registerDeeplinkListener"
private const val ANDROID_DEEP_LINK_METHOD = "subscribeForDeepLink"

// plugin_bridge's DeepLinkResult.Status is a SHOUTING_CASE enum name ("FOUND"/"NOT_FOUND"/
// "ERROR"); iOS emits lowerCamelCase ("found"/"notFound"/"failure"), and UnifiedDeepLinkData
// (index.ts) is typed against iOS's vocabulary — normalize Android's raw name here, the one
// place both platforms' events cross into JS. `error` has no matching iOS casing (iOS sends
// a free-text message), so it's just lowercased.
private val ANDROID_TO_CANONICAL_DEEP_LINK_STATUS: Map<String, String> = mapOf(
    "FOUND" to "found",
    "NOT_FOUND" to "notFound",
    "ERROR" to "failure",
)

// Shared by every JSON helper below — best-effort parse, `default` instead of throwing.
private inline fun <T> parseJsonOrDefault(json: String, default: T, block: (JSONObject) -> T): T {
    return try {
        block(JSONObject(json))
    } catch (e: Exception) {
        default
    }
}

// Top-level + `internal` (not a class member) so this is unit-testable without standing up a
// full ReactApplicationContext.
internal fun normalizeDeepLinkEvent(eventJson: String): String = parseJsonOrDefault(eventJson, eventJson) { envelope ->
    if (envelope.optString("event") != DEEP_LINK_EVENT_NAME) return@parseJsonOrDefault eventJson
    val data = envelope.optJSONObject("data") ?: return@parseJsonOrDefault eventJson

    data.optString("status").takeIf { it.isNotEmpty() }?.let { raw ->
        data.put("status", ANDROID_TO_CANONICAL_DEEP_LINK_STATUS[raw] ?: raw)
    }
    data.optString("error").takeIf { it.isNotEmpty() }?.let { data.put("error", it.lowercase()) }

    envelope.toString()
}

/** TurboModule bridge — all SDK capabilities dispatched via executeRpc → AppsFlyerRpcHandler. */
class RNAppsFlyerModule(reactContext: ReactApplicationContext) : NativeAppsFlyerSpec(reactContext) {

    // Single thread: AppsFlyerRpcHandler isn't safe for concurrent calls.
    private val rpcExecutor = Executors.newSingleThreadExecutor()

    private val rpcHandler = AppsFlyerRpcHandler(
        context = reactApplicationContext,
        pluginNotifier = { rawEventJson ->
            reactApplicationContext
                .getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(RPC_EVENT_NAME, normalizeDeepLinkEvent(rawEventJson))
        },
    )

    override fun executeRpc(requestJson: String, promise: Promise) {
        rpcExecutor.execute {
            promise.resolve(safeDispatchToNative(requestJson))
        }
    }

    // An uncaught exception here would run on rpcExecutor's background thread — Android's
    // default uncaught-exception handler terminates the process regardless of which thread
    // threw, and the JS promise would never resolve either way. AppsFlyerRpcHandler.execute()
    // is a vendored dependency we don't control, so any unexpected Exception (not just the
    // JSONException/RpcResponse.Error path it already returns) must still resolve the promise.
    private fun safeDispatchToNative(requestJson: String): String {
        return try {
            dispatchToNative(requestJson)
        } catch (e: Exception) {
            normalizeError(code = 500, message = e.message ?: "Unexpected native RPC failure")
        }
    }

    // Must run on rpcExecutor — AppsFlyerRpcHandler.execute() can block the calling thread.
    private fun dispatchToNative(requestJson: String): String {
        val remappedRequestJson = remapMethodName(requestJson)
        val response = rpcHandler.execute(remappedRequestJson)
        return normalize(response)
    }

    override fun addListener(eventName: String) {
        // required by NativeEventEmitter; event gating is handled by register*Listener RPCs
    }

    override fun removeListeners(count: Double) {
        // no-op, see addListener
    }

    // Shuts down this instance's dedicated thread pool so it doesn't leak past TurboModule
    // teardown (bridge/context invalidation, multi-instance RN hosts).
    override fun invalidate() {
        super.invalidate()
        rpcExecutor.shutdown()
    }

    private fun remapMethodName(requestJson: String): String = parseJsonOrDefault(requestJson, requestJson) { request ->
        val canonicalMethod = request.optString("method").takeIf { it.isNotEmpty() } ?: return@parseJsonOrDefault requestJson
        if (canonicalMethod != CANONICAL_DEEP_LINK_METHOD) return@parseJsonOrDefault requestJson
        request.put("method", ANDROID_DEEP_LINK_METHOD)
        request.toString()
    }

    // Must match the { success, data|error } envelope iOS's bridge also emits — keep in sync.
    private fun normalize(response: RpcResponse): String {
        val normalized = JSONObject()
        when (response) {
            is RpcResponse.Success<*> -> {
                normalized.put("success", true)
                normalized.put("data", response.result)
            }
            is RpcResponse.VoidSuccess -> {
                normalized.put("success", true)
                normalized.put("data", JSONObject.NULL)
            }
            is RpcResponse.Error -> {
                val error = JSONObject()
                error.put("code", response.code)
                error.put("message", response.message)
                normalized.put("success", false)
                normalized.put("error", error)
            }
        }
        return normalized.toString()
    }

    private fun normalizeError(code: Int, message: String): String {
        val error = JSONObject()
        error.put("code", code)
        error.put("message", message)
        val normalized = JSONObject()
        normalized.put("success", false)
        normalized.put("error", error)
        return normalized.toString()
    }

    companion object {
        const val NAME = "RNAppsFlyer"
    }
}
