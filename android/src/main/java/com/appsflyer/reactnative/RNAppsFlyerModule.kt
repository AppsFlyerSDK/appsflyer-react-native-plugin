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

// registerDeeplinkListener has no native counterpart — deep link registration is
// subscribeForDeepLink on the native side.
private val CANONICAL_TO_ANDROID_METHOD: Map<String, String> = mapOf(
    "registerDeeplinkListener" to "subscribeForDeepLink",
)

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
        pluginNotifier = { eventJson ->
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
                val normalized = dispatchToNative(requestJson)
                promise.resolve(normalized)
                initGate.markInitCompleted(isSuccess(normalized)).forEach { (queuedJson, queuedPromise) ->
                    rpcExecutor.execute {
                        (queuedPromise as Promise).resolve(dispatchToNative(queuedJson))
                    }
                }
            }
            return
        }

        if (initGate.shouldBuffer(canonicalMethod) && initGate.enqueue(requestJson to promise)) {
            return
        }

        rpcExecutor.execute {
            promise.resolve(dispatchToNative(requestJson))
        }
    }

    // Must run on rpcExecutor — AppsFlyerRpcHandler.execute() can block the calling thread.
    private fun dispatchToNative(requestJson: String): String {
        val canonicalMethod = canonicalMethodName(requestJson)
        val remappedRequestJson = remapMethodName(requestJson)
        val response = rpcHandler.execute(remappedRequestJson)
        val normalized = normalize(response)

        if (response is RpcResponse.VoidSuccess) {
            when (canonicalMethod) {
                "registerSessionReadyListener" -> scheduleSessionReadyFallback()
                "unregisterSessionReadyListener" -> {
                    sessionReadyFallback?.cancel(false)
                    sessionReadyDelivered.set(true)
                }
            }
        }

        return normalized
    }

    // Synthesizes the same onSessionReady envelope AppsFlyerRpcHandler emits natively, in case
    // the real native callback never fires. cancel() here is a best-effort early stop (avoids
    // waking the scheduler needlessly); sessionReadyDelivered is what actually prevents a
    // double-emit if the real event and this timer race.
    private fun scheduleSessionReadyFallback() {
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

    private fun canonicalMethodName(requestJson: String): String? {
        return try {
            JSONObject(requestJson).optString("method").takeIf { it.isNotEmpty() }
        } catch (e: Exception) {
            null
        }
    }

    private fun isSuccess(normalizedResponseJson: String): Boolean {
        return try {
            JSONObject(normalizedResponseJson).optBoolean("success", false)
        } catch (e: Exception) {
            false
        }
    }

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

    private fun remapMethodName(requestJson: String): String {
        return try {
            val request = JSONObject(requestJson)
            val canonicalMethod = request.optString("method").takeIf { it.isNotEmpty() } ?: return requestJson
            val androidMethod = CANONICAL_TO_ANDROID_METHOD[canonicalMethod] ?: return requestJson
            request.put("method", androidMethod)
            request.toString()
        } catch (e: Exception) {
            requestJson
        }
    }

    // Normalizes Android's RpcResponse sealed class into the shared { success, data|error } shape.
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
