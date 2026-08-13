package com.appsflyer.reactnative

import org.json.JSONObject
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * RNAppsFlyerModule routes RPCs to a single-thread lane (6 listener register/unregister calls —
 * unsynchronized handler state) or a pool (everything else). A method missing from
 * LISTENER_LIFECYCLE_METHODS would silently reintroduce that race.
 */
class IsListenerLifecycleCallTest {

    @Test
    fun `register and unregister conversion listener route to the listener lane`() {
        assertTrue(isListenerLifecycleCall(request("registerConversionListener")))
        assertTrue(isListenerLifecycleCall(request("unregisterConversionListener")))
    }

    @Test
    fun `register and unregister session ready listener route to the listener lane`() {
        assertTrue(isListenerLifecycleCall(request("registerSessionReadyListener")))
        assertTrue(isListenerLifecycleCall(request("unregisterSessionReadyListener")))
    }

    @Test
    fun `deep link listener routes to the listener lane under both canonical and remapped names`() {
        assertTrue(isListenerLifecycleCall(request("registerDeeplinkListener")))
        assertTrue(isListenerLifecycleCall(request("subscribeForDeepLink")))
        assertTrue(isListenerLifecycleCall(request("unregisterDeeplinkListener")))
        assertTrue(isListenerLifecycleCall(request("unsubscribeForDeepLink")))
    }

    @Test
    fun `stateless passthrough calls route to the pool lane`() {
        assertFalse(isListenerLifecycleCall(request("getAppsFlyerUID")))
        assertFalse(isListenerLifecycleCall(request("logEvent")))
        assertFalse(isListenerLifecycleCall(request("start")))
        assertFalse(isListenerLifecycleCall(request("setCustomerUserId")))
    }

    @Test
    fun `malformed JSON defaults to the pool lane instead of throwing`() {
        assertFalse(isListenerLifecycleCall("{not valid json"))
    }

    private fun request(method: String): String = JSONObject().put("method", method).toString()
}
