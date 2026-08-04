package com.appsflyer.reactnative

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Regression test: plugin_bridge's DeepLinkResult reports SHOUTING_CASE enum names
 * ("FOUND"/"NOT_FOUND"/"ERROR", error "TIMEOUT"/"NETWORK"/...) while iOS reports
 * lowerCamelCase ("found"/"notFound"/"failure") plus a free-text error message.
 * `UnifiedDeepLinkData` (index.ts) is typed against iOS's vocabulary — Android's raw event
 * must be normalized to match before it reaches JS, or `res.status`/`res.error` comparisons
 * silently fail on Android only.
 */
class NormalizeDeepLinkEventTest {

    @Test
    fun `FOUND status is normalized to found`() {
        val input = envelope(status = "FOUND")
        val result = JSONObject(normalizeDeepLinkEvent(input))
        assertEquals("found", result.getJSONObject("data").getString("status"))
    }

    @Test
    fun `NOT_FOUND status is normalized to notFound`() {
        val input = envelope(status = "NOT_FOUND")
        val result = JSONObject(normalizeDeepLinkEvent(input))
        assertEquals("notFound", result.getJSONObject("data").getString("status"))
    }

    @Test
    fun `ERROR status is normalized to failure`() {
        val input = envelope(status = "ERROR", error = "TIMEOUT")
        val result = JSONObject(normalizeDeepLinkEvent(input))
        assertEquals("failure", result.getJSONObject("data").getString("status"))
    }

    @Test
    fun `error enum name is lowercased`() {
        val input = envelope(status = "ERROR", error = "NETWORK")
        val result = JSONObject(normalizeDeepLinkEvent(input))
        assertEquals("network", result.getJSONObject("data").getString("error"))
    }

    @Test
    fun `unrecognized status passes through unchanged, error is still lowercased`() {
        val input = envelope(status = "SOMETHING_NEW", error = "ANOTHER_NEW_ONE")
        val result = JSONObject(normalizeDeepLinkEvent(input))
        val data = result.getJSONObject("data")
        assertEquals("SOMETHING_NEW", data.getString("status"))
        assertEquals("another_new_one", data.getString("error"))
    }

    @Test
    fun `non-deep-link events pass through unchanged`() {
        val input = JSONObject().apply {
            put("event", "onSessionReady")
            put("data", JSONObject.NULL)
        }.toString()

        assertEquals(input, normalizeDeepLinkEvent(input))
    }

    @Test
    fun `malformed JSON passes through unchanged instead of throwing`() {
        val input = "{not valid json"
        assertEquals(input, normalizeDeepLinkEvent(input))
    }

    private fun envelope(status: String, error: String? = null): String {
        val data = JSONObject().put("status", status)
        error?.let { data.put("error", it) }
        return JSONObject().apply {
            put("event", "onDeepLinking")
            put("data", data)
        }.toString()
    }
}
