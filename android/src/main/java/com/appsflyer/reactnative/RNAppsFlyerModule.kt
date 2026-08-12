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

// Android emits SHOUTING_CASE status ("FOUND"/"NOT_FOUND"/"ERROR"); normalized here to the
// lowerCamelCase vocabulary iOS uses and UnifiedDeepLinkData (index.ts) expects. `error` has
// no matching iOS enum, so it's just lowercased.
private val ANDROID_TO_CANONICAL_DEEP_LINK_STATUS: Map<String, String> = mapOf(
    "FOUND" to "found",
    "NOT_FOUND" to "notFound",
    "ERROR" to "failure",
)

// Only these 6 methods touch AppsFlyerRpcHandler's 3 unsynchronized listener fields (verified
// against vendored source) — every other RPC is a stateless passthrough, safe on the pool lane.
// Both deep-link name variants are listed: routing runs before remapMethodName remaps it.
private val LISTENER_LIFECYCLE_METHODS: Set<String> = setOf(
    "registerConversionListener", "unregisterConversionListener",
    "registerSessionReadyListener", "unregisterSessionReadyListener",
    CANONICAL_DEEP_LINK_METHOD, ANDROID_DEEP_LINK_METHOD,
    "unregisterDeeplinkListener", "unsubscribeForDeepLink",
)

// Shared by every JSON helper below — best-effort parse, `default` instead of throwing.
private inline fun <T> parseJsonOrDefault(json: String, default: T, block: (JSONObject) -> T): T {
    return try {
        block(JSONObject(json))
    } catch (e: Exception) {
        default
    }
}

// Top-level + `internal` (not class members) so these two are unit-testable without standing up
// a full ReactApplicationContext.
internal fun isListenerLifecycleCall(requestJson: String): Boolean = parseJsonOrDefault(requestJson, false) { request ->
    request.optString("method") in LISTENER_LIFECYCLE_METHODS
}

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

    // FIFO — the 6 LISTENER_LIFECYCLE_METHODS calls need strict ordering, not just eventual execution.
    private val listenerExecutor = Executors.newSingleThreadExecutor()

    // Everything else: stateless passthroughs, safe concurrently. Keeps a slow call (start/logEvent,
    // 5-10s per native-android.md §3) from head-of-line-blocking a fast one queued behind it.
    private val rpcExecutor = Executors.newFixedThreadPool(4)

    private val rpcHandler = AppsFlyerRpcHandler(
        context = reactApplicationContext,
        pluginNotifier = { rawEventJson ->
            reactApplicationContext
                .getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(RPC_EVENT_NAME, normalizeDeepLinkEvent(rawEventJson))
        },
    )

    override fun executeRpc(requestJson: String, promise: Promise) {
        val executor = if (isListenerLifecycleCall(requestJson)) listenerExecutor else rpcExecutor
        executor.execute {
            promise.resolve(safeDispatchToNative(requestJson))
        }
    }

    // An uncaught exception here crashes the whole process (Android's default handler doesn't
    // care which thread threw) instead of just failing this promise — AppsFlyerRpcHandler is
    // vendored and can throw beyond its own RpcResponse.Error path.
    private fun safeDispatchToNative(requestJson: String): String {
        return try {
            dispatchToNative(requestJson)
        } catch (e: Exception) {
            normalizeError(code = 500, message = e.message ?: "Unexpected native RPC failure")
        }
    }

    // Must run on listenerExecutor or rpcExecutor — AppsFlyerRpcHandler.execute() can block the calling thread.
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

    // Shuts down both pools so they don't leak past TurboModule teardown.
    override fun invalidate() {
        super.invalidate()
        listenerExecutor.shutdown()
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
