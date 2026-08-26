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

private const val ANDROID_DEEP_LINK_METHOD = "subscribeForDeepLink"

// Normalizes Android's SHOUTING_CASE status to iOS's lowerCamelCase vocabulary (index.ts's UnifiedDeepLinkData); `error` has no iOS match, so it's just lowercased.
private val ANDROID_TO_CANONICAL_DEEP_LINK_STATUS: Map<String, String> = mapOf(
    "FOUND" to "found",
    "NOT_FOUND" to "notFound",
    "ERROR" to "failure",
)

// Methods touching AppsFlyerRpcHandler's 3 unsynchronized listener fields — routed to the FIFO lane, not the pool; see known-issues-kb.md's registerConversionListener entry for the init race this fixes.
private val LISTENER_LIFECYCLE_METHODS: Set<String> = setOf(
    "init",
    "registerConversionListener", "unregisterConversionListener",
    "registerSessionReadyListener", "unregisterSessionReadyListener",
    ANDROID_DEEP_LINK_METHOD, "unsubscribeForDeepLink",
)

// Shared by every JSON helper below — best-effort parse, `default` instead of throwing.
private inline fun <T> parseJsonOrDefault(json: String, default: T, block: (JSONObject) -> T): T {
    return try {
        block(JSONObject(json))
    } catch (e: Exception) {
        default
    }
}

// Top-level `internal` (not class members) so these are unit-testable without a full ReactApplicationContext.
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

    // FIFO — the 7 LISTENER_LIFECYCLE_METHODS calls need strict ordering, not just eventual execution.
    private val listenerExecutor = Executors.newSingleThreadExecutor()

    // Stateless passthroughs run concurrently here so a slow call (start/logEvent, 5-10s per native-android.md §3) doesn't head-of-line-block a fast one.
    private val rpcExecutor = Executors.newFixedThreadPool(4)

    private val rpcHandler = AppsFlyerRpcHandler(
        // currentActivity is usually already resumed by init() time, letting native backfill onActivityResumed instead of stalling session-ready (known-issues-kb.md).
        contextProvider = { reactApplicationContext.currentActivity ?: reactApplicationContext },
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

    // Catches vendored AppsFlyerRpcHandler exceptions here so they fail the promise instead of crashing the process.
    private fun safeDispatchToNative(requestJson: String): String {
        return try {
            dispatchToNative(requestJson)
        } catch (e: Exception) {
            normalizeError(code = 500, message = e.message ?: "Unexpected native RPC failure")
        }
    }

    // Must run on listenerExecutor or rpcExecutor — AppsFlyerRpcHandler.execute() can block the calling thread.
    private fun dispatchToNative(requestJson: String): String {
        val response = rpcHandler.execute(requestJson)
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
