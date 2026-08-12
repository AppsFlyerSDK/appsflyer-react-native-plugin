package com.appsflyer.reactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

@Suppress("UNCHECKED_CAST")
object RNUtil {

    @JvmStatic
    fun toWritableMap(map: Map<String, Any?>): WritableMap {
        val writableMap = Arguments.createMap()

        for ((key, value) in map) {
            when (value) {
                null -> writableMap.putNull(key)
                is Boolean -> writableMap.putBoolean(key, value)
                is Double -> writableMap.putDouble(key, value)
                is Int -> writableMap.putInt(key, value)
                is String -> writableMap.putString(key, value)
                is Map<*, *> -> writableMap.putMap(key, toWritableMap(value as Map<String, Any?>))
                is List<*> -> writableMap.putArray(key, toWritableArray(value as List<Any?>))
            }
        }

        return writableMap
    }

    @JvmStatic
    fun toWritableArray(list: List<Any?>): WritableArray {
        val writableArray = Arguments.createArray()

        for (value in list) {
            when (value) {
                null -> writableArray.pushNull()
                is Boolean -> writableArray.pushBoolean(value)
                is Double -> writableArray.pushDouble(value)
                is Int -> writableArray.pushInt(value)
                is String -> writableArray.pushString(value)
                is Map<*, *> -> writableArray.pushMap(toWritableMap(value as Map<String, Any?>))
                is List<*> -> writableArray.pushArray(toWritableArray(value as List<Any?>))
            }
        }

        return writableArray
    }

    /**
     * Converts Facebook's ReadableMap to a Kotlin Map<>
     *
     * @param readableMap The Readable Map to parse
     * @return a Map<> to be used in memory
     */
    @JvmStatic
    fun toMap(readableMap: ReadableMap?): Map<String, Any?>? {
        if (readableMap == null) {
            return null
        }

        val iterator = readableMap.keySetIterator()
        if (!iterator.hasNextKey()) {
            return null
        }

        val result = HashMap<String, Any?>()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            result[key] = toObject(readableMap, key)
        }

        return result
    }

    /**
     * Attempts to pull the ReadableMap's attribute out as the proper type
     *
     * @param readableMap The Facebook ReadableMap to parse
     * @param key         The map key to attempt to read from the readableMap
     * @return the converted attribute from the map if available
     */
    @JvmStatic
    fun toObject(readableMap: ReadableMap?, key: String): Any? {
        if (readableMap == null) {
            return null
        }

        return when (readableMap.getType(key)) {
            ReadableType.Null -> null
            ReadableType.Boolean -> readableMap.getBoolean(key)
            ReadableType.Number -> numberFromDouble(readableMap.getDouble(key))
            ReadableType.String -> readableMap.getString(key)
            ReadableType.Map -> toMap(readableMap.getMap(key))
            ReadableType.Array -> toList(readableMap.getArray(key))
        }
    }

    /**
     * Converts a ReadableArray into a Kotlin List<>
     *
     * @param readableArray the ReadableArray to parse
     * @return a List<> if applicable
     */
    @JvmStatic
    fun toList(readableArray: ReadableArray?): List<Any?>? {
        if (readableArray == null) {
            return null
        }

        var result = ArrayList<Any?>(readableArray.size())
        for (index in 0 until readableArray.size()) {
            when (readableArray.getType(index)) {
                ReadableType.Null -> result.add(null)
                ReadableType.Boolean -> result.add(readableArray.getBoolean(index))
                ReadableType.Number -> result.add(numberFromDouble(readableArray.getDouble(index)))
                ReadableType.String -> result.add(readableArray.getString(index))
                ReadableType.Map -> result.add(toMap(readableArray.getMap(index)))
                ReadableType.Array -> result = ArrayList(toList(readableArray.getArray(index)).orEmpty())
            }
        }

        return result
    }

    /**
     * ReadableMap/ReadableArray only expose doubles for numbers; disambiguate
     * whole-valued doubles back to Int so JSON round-trips stay int-typed.
     */
    private fun numberFromDouble(value: Double): Any = if (value == value.toInt().toDouble()) value.toInt() else value
}
