package com.appsflyer.reactnative

import android.app.Activity
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.appsflyer.pluginbridge.handler.AppsFlyerRpcHandler
import com.appsflyer.pluginbridge.model.RpcResponse
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class RNAppsFlyerRPCModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var rpcHandler: AppsFlyerRpcHandler? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun invalidate() {
        mainHandler.removeCallbacksAndMessages(null)
        rpcHandler = null
    }

    private fun getOrCreateHandler(): AppsFlyerRpcHandler {
        val handler = rpcHandler
        if (handler != null) {
            return handler
        }

        val activity = getCurrentActivity() ?: throw IllegalStateException("Activity is required but not available. Make sure the React Native app is fully initialized.")

        val newHandler = AppsFlyerRpcHandler(
            context = activity,
            pluginNotifier = { jsonEvent ->
                emitEventToJavaScript(jsonEvent)
            }
        )
        rpcHandler = newHandler
        return newHandler
    }

    override fun getName(): String = "RNAppsFlyerRPC"

    @ReactMethod
    fun executeJson(jsonRequest: String, promise: Promise) {
        if (jsonRequest.isBlank()) {
            promise.reject("INVALID_REQUEST", "JSON request cannot be empty", null)
            return
        }

        try {
            val handler = getOrCreateHandler()
            val response = handler.execute(jsonRequest)
            val jsonResponse = convertResponseToJson(response)
            promise.resolve(jsonResponse)
        } catch (e: IllegalStateException) {
            android.util.Log.e("RNAppsFlyerRPC", "[Android] Activity context not available: ${e.message}", e)
            promise.reject("CONTEXT_UNAVAILABLE", e.message ?: "Activity context is required", e)
        } catch (e: IllegalArgumentException) {
            android.util.Log.e("RNAppsFlyerRPC", "[Android] Invalid RPC request: ${e.message}", e)
            promise.reject("INVALID_REQUEST", e.message ?: "Invalid request", e)
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
                    put("result", JSONObject.NULL)
                }.toString()
            }
            is RpcResponse.Success<*> -> {
                JSONObject().apply {
                    put("jsonrpc", "2.0")
                    val resultValue = response.result
                    if (resultValue == null) {
                        put("result", JSONObject.NULL)
                    } else {
                        put("result", convertToJsonValue(resultValue))
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

    private fun convertToJsonValue(value: Any?): Any {
        return when (value) {
            null -> JSONObject.NULL
            is String -> value
            is Boolean -> value
            is Int -> value
            is Long -> value
            is Double -> value
            is Float -> value.toDouble()
            is Short -> value.toInt()
            is Byte -> value.toInt()
            is Map<*, *> -> {
                val jsonObject = JSONObject()
                value.forEach { (k, v) ->
                    val key = k?.toString() ?: "null"
                    jsonObject.put(key, convertToJsonValue(v))
                }
                jsonObject
            }
            is List<*> -> {
                val jsonArray = JSONArray()
                value.forEach { item ->
                    jsonArray.put(convertToJsonValue(item))
                }
                jsonArray
            }
            else -> value.toString()
        }
    }

    private fun emitEventToJavaScript(jsonEvent: String) {
        val reactApplicationContext = reactApplicationContext
        if (!reactApplicationContext.hasActiveReactInstance()) {
            return
        }

        val activity = getCurrentActivity()
        if (activity == null) {
            android.util.Log.w("RNAppsFlyerRPC", "[Android] Cannot emit event: activity not available")
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
                    is Long -> eventMap.putDouble(key, value.toDouble())
                    is Double -> eventMap.putDouble(key, value)
                    is Float -> eventMap.putDouble(key, value.toDouble())
                    is Boolean -> eventMap.putBoolean(key, value)
                    is JSONObject -> eventMap.putMap(key, jsonObjectToWritableMap(value))
                    is JSONArray -> eventMap.putArray(key, jsonArrayToWritableArray(value))
                    else -> eventMap.putString(key, value.toString())
                }
            }

            val runnable = Runnable {
                if (reactApplicationContext.hasActiveReactInstance() && getCurrentActivity() != null) {
                    reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onEvent", eventMap)
                }
            }

            if (Looper.myLooper() == Looper.getMainLooper()) {
                runnable.run()
            } else {
                mainHandler.post(runnable)
            }
        } catch (e: JSONException) {
            android.util.Log.e("RNAppsFlyerRPC", "[Android] Failed to parse JSON event: ${e.message}", e)
        } catch (e: Exception) {
            android.util.Log.e("RNAppsFlyerRPC", "[Android] Failed to emit event: ${e.message}", e)
        }
    }

    private fun jsonObjectToWritableMap(json: JSONObject): WritableMap {
        val map = Arguments.createMap()
        json.keys().forEach { key ->
            val value = json.get(key)
            when (value) {
                is String -> map.putString(key, value)
                is Int -> map.putInt(key, value)
                is Long -> map.putDouble(key, value.toDouble())
                is Double -> map.putDouble(key, value)
                is Float -> map.putDouble(key, value.toDouble())
                is Boolean -> map.putBoolean(key, value)
                is JSONObject -> map.putMap(key, jsonObjectToWritableMap(value))
                is JSONArray -> map.putArray(key, jsonArrayToWritableArray(value))
                else -> map.putString(key, value.toString())
            }
        }
        return map
    }

    private fun jsonArrayToWritableArray(jsonArray: JSONArray): WritableArray {
        val array = Arguments.createArray()
        for (i in 0 until jsonArray.length()) {
            val value = jsonArray.get(i)
            when (value) {
                is String -> array.pushString(value)
                is Int -> array.pushInt(value)
                is Long -> array.pushDouble(value.toDouble())
                is Double -> array.pushDouble(value)
                is Float -> array.pushDouble(value.toDouble())
                is Boolean -> array.pushBoolean(value)
                is JSONObject -> array.pushMap(jsonObjectToWritableMap(value))
                is JSONArray -> array.pushArray(jsonArrayToWritableArray(value))
                else -> array.pushString(value.toString())
            }
        }
        return array
    }

    @ReactMethod
    fun addListener(_eventName: String) {
        // Required for event emitter support
    }

    @ReactMethod
    fun removeListeners(_count: Double) {
        // Required for event emitter support
    }
}

