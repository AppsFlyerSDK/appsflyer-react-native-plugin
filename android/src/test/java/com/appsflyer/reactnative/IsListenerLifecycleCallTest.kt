package com.appsflyer.reactnative

import org.json.JSONObject
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// RNAppsFlyerModule routes listener register/unregister calls (unsynchronized handler state) to a single-thread lane, everything else to a pool; a method missing from LISTENER_LIFECYCLE_METHODS would reintroduce that race.
class IsListenerLifecycleCallTest {

    @Test
    fun `register and unregister conversion listener route to the listener lane`() {
        assertTrue(isListenerLifecycleCall(request("registerConversionListener")))
        assertTrue(isListenerLifecycleCall(request("unregisterConversionListener")))
    }

    @Test
    fun `init routes to the listener lane — it reads the same unsynchronized conversionListener field`() {
        // Regression test: init used to run on the pool lane, racing registerConversionListener on the listener lane with no ordering guarantee — see known-issues-kb.md.
        assertTrue(isListenerLifecycleCall(request("init")))
    }

    @Test
    fun `register and unregister session ready listener route to the listener lane`() {
        assertTrue(isListenerLifecycleCall(request("registerSessionReadyListener")))
        assertTrue(isListenerLifecycleCall(request("unregisterSessionReadyListener")))
    }

    @Test
    fun `deep link listener routes to the listener lane`() {
        assertTrue(isListenerLifecycleCall(request("subscribeForDeepLink")))
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
