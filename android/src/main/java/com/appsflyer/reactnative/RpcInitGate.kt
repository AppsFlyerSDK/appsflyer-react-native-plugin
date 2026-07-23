package com.appsflyer.reactnative

/**
 * Buffers register*Listener RPCs until init succeeds — the native layer silently drops them
 * if they arrive before init resolves. Kept separate from [RNAppsFlyerModule] for testability.
 */
internal class RpcInitGate {

    companion object {
        val BUFFERED_METHODS: Set<String> = setOf(
            "registerConversionListener",
            "registerDeeplinkListener",
            "registerSessionReadyListener"
        )
    }

    private val lock = Object()
    private var initCompleted = false
    private val pending = mutableListOf<Pair<String, Any>>()

    /** True if `method` should be held rather than dispatched immediately. */
    fun shouldBuffer(method: String?): Boolean {
        if (method == null || !BUFFERED_METHODS.contains(method)) {
            return false
        }
        return synchronized(lock) { !initCompleted }
    }

    /** Queues token for deferred flush. Returns false if init already completed (race window). */
    fun enqueue(token: Pair<String, Any>): Boolean {
        return synchronized(lock) {
            if (initCompleted) {
                false
            } else {
                pending.add(token)
                true
            }
        }
    }

    /** Returns buffered tokens to flush on success; on failure the gate stays open for retry. */
    fun markInitCompleted(success: Boolean): List<Pair<String, Any>> {
        if (!success) {
            return emptyList()
        }
        return synchronized(lock) {
            initCompleted = true
            val queued = pending.toList()
            pending.clear()
            queued
        }
    }
}
