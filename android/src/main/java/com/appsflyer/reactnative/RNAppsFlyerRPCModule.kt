package com.appsflyer.reactnative

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.appsflyer.pluginbridge.handler.AppsFlyerRpcHandler
import com.appsflyer.pluginbridge.model.RpcResponse
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject

class RNAppsFlyerRPCModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val rpcHandler: AppsFlyerRpcHandler
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        val context = reactContext.applicationContext
        rpcHandler = AppsFlyerRpcHandler(
            context = context,
            pluginNotifier = { jsonEvent ->
                emitEventToJavaScript(jsonEvent)
            }
        )
    }

    override fun getName(): String = "RNAppsFlyerRPC"

    @ReactMethod
    fun executeJson(jsonRequest: String, promise: Promise) {
        try {
            val response = rpcHandler.execute(jsonRequest)
            val jsonResponse = convertResponseToJson(response)
            promise.resolve(jsonResponse)
        } catch (e: Exception) {
            android.util.Log.e("RNAppsFlyerRPC", "[Android] executeJson error: ${e.message}", e)
            promise.reject("RPC_EXECUTION_ERROR", e.message ?: "Unknown error", e)
        }
    }

    private fun convertResponseToJson(response: RpcResponse): String {
        return when (response) {
            is RpcResponse.VoidSuccess -> {
                JSONObject().apply {
                    put("jsonrpc", "2.0")
                    // Use JSONObject.NULL instead of null to ensure the key is included in the JSON string
                    put("result", JSONObject.NULL)
                }.toString()
            }
            is RpcResponse.Success<*> -> {
                JSONObject().apply {
                    put("jsonrpc", "2.0")
                    // Handle null result values properly
                    val resultValue = response.result
                    if (resultValue == null) {
                        put("result", JSONObject.NULL)
                    } else {
                        put("result", resultValue)
                    }
                }.toString()
            }
            is RpcResponse.Error -> {
                JSONObject().apply {
                    put("jsonrpc", "2.0")
                    put("error", JSONObject().apply {
                        put("code", response.code)
                        put("message", response.message)
                    })
                }.toString()
            }
        }
    }

    private fun emitEventToJavaScript(jsonEvent: String) {
        val context = reactContext
        if (context == null || !context.hasActiveReactInstance()) {
            return
        }

        try {
            val json = JSONObject(jsonEvent)
            val eventMap = Arguments.createMap()
            
            json.keys().forEach { key ->
                val value = json.get(key)
                when (value) {
                    is String -> eventMap.putString(key, value)
                    is Int -> eventMap.putInt(key, value)
                    is Double -> eventMap.putDouble(key, value)
                    is Boolean -> eventMap.putBoolean(key, value)
                    is JSONObject -> eventMap.putMap(key, jsonObjectToWritableMap(value))
                    else -> eventMap.putString(key, value.toString())
                }
            }

            val runnable = Runnable {
                if (context.hasActiveReactInstance()) {
                    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onEvent", eventMap)
                }
            }

            if (Looper.myLooper() == Looper.getMainLooper()) {
                runnable.run()
            } else {
                mainHandler.post(runnable)
            }
        } catch (e: Exception) {
            // Ignore JSON parsing errors
        }
    }

    private fun jsonObjectToWritableMap(json: JSONObject): WritableMap {
        val map = Arguments.createMap()
        json.keys().forEach { key ->
            val value = json.get(key)
            when (value) {
                is String -> map.putString(key, value)
                is Int -> map.putInt(key, value)
                is Double -> map.putDouble(key, value)
                is Boolean -> map.putBoolean(key, value)
                is JSONObject -> map.putMap(key, jsonObjectToWritableMap(value))
                else -> map.putString(key, value.toString())
            }
        }
        return map
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for event emitter support
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // Required for event emitter support
    }
}

