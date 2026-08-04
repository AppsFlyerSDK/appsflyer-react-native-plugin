package com.appsflyer.reactnative

import com.appsflyer.pluginbridge.handler.AppsFlyerRpcHandler
import com.appsflyer.pluginbridge.model.RpcResponse
import com.appsflyer.pluginbridge.notifier.RpcEventFormatter
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

private const val RPC_EVENT_NAME = "RNAppsFlyer_rpcEvent"
private const val SESSION_READY_EVENT = "onSessionReady"
private const val SESSION_READY_FALLBACK_TIMEOUT_MS = 1_000L
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
    private val sessionReadyScheduler = Executors.newSingleThreadScheduledExecutor()

    @Volatile
    private var sessionReadyFallback: ScheduledFuture<*>? = null

    // Guards exactly-once onSessionReady delivery: the fallback timer and the real native
    // callback can both fire for the same registration cycle (ScheduledFuture#cancel(false) is
    // a documented no-op once the task has started running), so delivery is gated on this flag
    // rather than on cancellation succeeding. true = no delivery owed for the current cycle.
    private val sessionReadyDelivered = AtomicBoolean(true)

    private val rpcHandler = AppsFlyerRpcHandler(
        context = reactApplicationContext,
        pluginNotifier = { rawEventJson ->
            val eventJson = normalizeDeepLinkEvent(rawEventJson)
            val isSessionReadyEvent = JSONObject(eventJson).optString("event") == SESSION_READY_EVENT
            val shouldEmit = if (isSessionReadyEvent) {
                sessionReadyFallback?.cancel(false)
                sessionReadyDelivered.compareAndSet(false, true)
            } else {
                true
            }
            if (shouldEmit) {
                reactApplicationContext
                    .getJSModule(RCTDeviceEventEmitter::class.java)
                    .emit(RPC_EVENT_NAME, eventJson)
            }
        },
    )

    private val initGate = RpcInitGate()

    override fun executeRpc(requestJson: String, promise: Promise) {
        val canonicalMethod = canonicalMethodName(requestJson)

        if (canonicalMethod == "init") {
            rpcExecutor.execute {
                val result = dispatchToNative(requestJson)
                promise.resolve(result.json)
                initGate.markInitCompleted(result.success).forEach { (queuedJson, queuedPromise) ->
                    rpcExecutor.execute {
                        (queuedPromise as Promise).resolve(dispatchToNative(queuedJson).json)
                    }
                }
            }
            return
        }

        if (initGate.shouldBuffer(canonicalMethod) && initGate.enqueue(requestJson to promise)) {
            return
        }

        rpcExecutor.execute {
            promise.resolve(dispatchToNative(requestJson).json)
        }
    }

    private class RpcResult(val json: String, val success: Boolean)

    // Must run on rpcExecutor — AppsFlyerRpcHandler.execute() can block the calling thread.
    private fun dispatchToNative(requestJson: String): RpcResult {
        val canonicalMethod = canonicalMethodName(requestJson)
        val remappedRequestJson = remapMethodName(requestJson)

        // Arm BEFORE the native call, not after: AppsFlyerLib.registerSessionReadyListener
        // (plugin_bridge's AppsFlyerRpcHandler.handleRegisterSessionReadyListener) invokes the
        // listener synchronously, inline, if the session is already ready — e.g. re-registration
        // after a prior successful register. If the guard were armed after rpcHandler.execute()
        // returned, that synchronous callback would race pluginNotifier while sessionReadyDelivered
        // was still `true` from the previous cycle, fail its compareAndSet(false, true), and get
        // dropped until the fallback timer resent it up to a second late.
        if (canonicalMethod == "registerSessionReadyListener") {
            armSessionReadyFallback()
        }

        val response = rpcHandler.execute(remappedRequestJson)

        when {
            canonicalMethod == "registerSessionReadyListener" && response !is RpcResponse.VoidSuccess -> {
                // Registration itself failed — nothing will ever deliver onSessionReady for this
                // attempt, so disarm the fallback we speculatively armed above instead of leaving
                // it ticking for a registration that never happened.
                sessionReadyFallback?.cancel(false)
                sessionReadyDelivered.set(true)
            }
            canonicalMethod == "unregisterSessionReadyListener" && response is RpcResponse.VoidSuccess -> {
                sessionReadyFallback?.cancel(false)
                sessionReadyDelivered.set(true)
            }
        }

        return RpcResult(normalize(response), response !is RpcResponse.Error)
    }

    // Synthesizes the same onSessionReady envelope AppsFlyerRpcHandler emits natively, in case
    // the real native callback never fires. cancel() here is a best-effort early stop (avoids
    // waking the scheduler needlessly); sessionReadyDelivered is what actually prevents a
    // double-emit if the real event and this timer race. Must be called before the native
    // register call that may synchronously deliver the real event (see call site).
    private fun armSessionReadyFallback() {
        sessionReadyFallback?.cancel(false)
        sessionReadyDelivered.set(false)
        sessionReadyFallback = sessionReadyScheduler.schedule({
            if (sessionReadyDelivered.compareAndSet(false, true)) {
                val eventJson = RpcEventFormatter.formatEvent(SESSION_READY_EVENT, null)
                reactApplicationContext
                    .getJSModule(RCTDeviceEventEmitter::class.java)
                    .emit(RPC_EVENT_NAME, eventJson)
            }
        }, SESSION_READY_FALLBACK_TIMEOUT_MS, TimeUnit.MILLISECONDS)
    }

    private fun canonicalMethodName(requestJson: String): String? =
        parseJsonOrDefault(requestJson, null) { it.optString("method").takeIf { m -> m.isNotEmpty() } }

    override fun addListener(eventName: String) {
        // required by NativeEventEmitter; event gating is handled by register*Listener RPCs
    }

    override fun removeListeners(count: Double) {
        // no-op, see addListener
    }

    // Shuts down this instance's dedicated thread pools so they don't leak past TurboModule
    // teardown (bridge/context invalidation, multi-instance RN hosts).
    override fun invalidate() {
        super.invalidate()
        sessionReadyFallback?.cancel(false)
        rpcExecutor.shutdown()
        sessionReadyScheduler.shutdown()
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

    companion object {
        const val NAME = "RNAppsFlyer"
    }
}
