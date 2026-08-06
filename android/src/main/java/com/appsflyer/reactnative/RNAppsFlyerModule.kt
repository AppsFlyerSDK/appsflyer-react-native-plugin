package com.appsflyer.reactnative

import com.appsflyer.pluginbridge.handler.AppsFlyerRpcHandler
import com.appsflyer.pluginbridge.model.RpcResponse
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import org.json.JSONObject
import java.util.concurrent.Executors

private const val RPC_EVENT_NAME = "RNAppsFlyer_rpcEvent"

// registerDeeplinkListener has no native counterpart — deep link registration is
// subscribeForDeepLink on the native side.
private val CANONICAL_TO_ANDROID_METHOD: Map<String, String> = mapOf(
    "registerDeeplinkListener" to "subscribeForDeepLink",
)

/** TurboModule bridge — all SDK capabilities dispatched via executeRpc → AppsFlyerRpcHandler. */
class RNAppsFlyerModule(reactContext: ReactApplicationContext) : NativeAppsFlyerSpec(reactContext) {

    // Single thread: AppsFlyerRpcHandler isn't safe for concurrent calls.
    private val rpcExecutor = Executors.newSingleThreadExecutor()

    private val rpcHandler = AppsFlyerRpcHandler(
        context = reactApplicationContext,
        pluginNotifier = { eventJson ->
            reactApplicationContext
                .getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(RPC_EVENT_NAME, eventJson)
        },
    )

    override fun executeRpc(requestJson: String, promise: Promise) {
        rpcExecutor.execute {
            promise.resolve(dispatchToNative(requestJson))
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
