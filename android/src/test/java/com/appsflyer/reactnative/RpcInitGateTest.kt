package com.appsflyer.reactnative

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * T050a regression test for the bug class in reference/cordova-rpc-prior-art.md commit 9ee0552:
 * a register*Listener RPC requested before `init` resolves must be buffered, not dropped or
 * dispatched early, and must flush exactly once `init` succeeds.
 */
class RpcInitGateTest {

    @Test
    fun `buffered method requested before init is held, not dispatched`() {
        val gate = RpcInitGate()
        assertTrue(gate.shouldBuffer("registerSessionReadyListener"))
    }

    @Test
    fun `non-buffered method is never held`() {
        val gate = RpcInitGate()
        assertFalse(gate.shouldBuffer("logEvent"))
        assertFalse(gate.shouldBuffer(null))
    }

    @Test
    fun `enqueued token is returned by markInitCompleted on success, in order`() {
        val gate = RpcInitGate()
        val first = "registerConversionListener" to Any()
        val second = "registerDeeplinkListener" to Any()
        assertTrue(gate.enqueue(first))
        assertTrue(gate.enqueue(second))

        val flushed = gate.markInitCompleted(true)

        assertEquals(listOf(first, second), flushed)
    }

    @Test
    fun `failed init does not flush and gate stays open for a later successful init`() {
        val gate = RpcInitGate()
        val token = "registerSessionReadyListener" to Any()
        gate.enqueue(token)

        val flushedOnFailure = gate.markInitCompleted(false)
        assertTrue(flushedOnFailure.isEmpty())
        assertTrue(gate.shouldBuffer("registerSessionReadyListener"))

        val flushedOnSuccess = gate.markInitCompleted(true)
        assertEquals(listOf(token), flushedOnSuccess)
    }

    @Test
    fun `after init completes, buffered methods are no longer held`() {
        val gate = RpcInitGate()
        gate.markInitCompleted(true)

        assertFalse(gate.shouldBuffer("registerConversionListener"))
    }

    @Test
    fun `enqueue after init already completed returns false so caller dispatches immediately`() {
        val gate = RpcInitGate()
        gate.markInitCompleted(true)

        val enqueued = gate.enqueue("registerDeeplinkListener" to Any())

        assertFalse(enqueued)
    }
}
