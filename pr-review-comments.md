# Stacked PR review comments — #693 → #697

Reviewer on all PRs: **pazlavi**. All PRs currently `CHANGES_REQUESTED`. No comments yet on #697.

Stack order (base ← head):
```
development ← stack/2-turbomodule-core   (PR #693)
            ← stack/3-rpc-contract-fixes  (PR #694)
            ← stack/4-index-ts-rename     (PR #695)
            ← stack/5-api-alignment       (PR #696)
            ← stack/6-final-polish        (PR #697)
```

---

## PR #693 — `stack/2-turbomodule-core`
https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/pull/693

| File | Line | Comment | Status |
|---|---|---|---|
| `android/src/main/java/com/appsflyer/reactnative/RNAppsFlyerModule.kt` | 35 | need to verify if the Android SDK will work correctly if we initialized with the Application context after the Activity's `onResume` passes | **Still open** — unrelated to the buffer/fallback removal below, not addressed |
| `android/src/main/java/com/appsflyer/reactnative/RpcInitGate.kt` | 7 | Who ignores the call? The native SDK or the RPC module? The SDK should accept the listener to be registered before `init` | **Addressed** — `RpcInitGate.kt` deleted |
| `android/src/main/java/com/appsflyer/reactnative/RNAppsFlyerModule.kt` | 29 | As discussed over Zoom, if you don't receive the callback, it's an SDK bug that has to be investigated, not something to control here | **Addressed** — Android session-ready fallback (`scheduleSessionReadyFallback`) removed |
| `android/src/main/java/com/appsflyer/reactnative/RpcInitGate.kt` | 7 | As discussed over Zoom, we can remove it; the SDK knows how to handle registration before init. We found an open bug in the RPC module | **Addressed** — `RpcInitGate.kt` + `RpcInitGateTest.kt` deleted |
| `ios/RNAppsFlyerImpl.swift` | 25 | Let's check if we can also remove this for iOS as well | **Addressed** — iOS `initCompleted`/`pendingRegistrations` buffer removed |
| `ios/RNAppsFlyerImpl.swift` | 57 | Same as Android, let's check if we can get rid of it. | **Addressed** — same removal as above |

**Verified before removing:** checked the vendored native RPC source directly (`AppsFlyerRpcHandler.kt` on Android, `AFRPCCoreHandler.swift`/`AFRPCListenerHandler.swift` on iOS) — listener registration is init-order-independent by design on both platforms (plain delegate/callback assignment on the persistent SDK singleton, no state check on `init`); the iOS `AppsFlyerRPC` README documents this as intended parity. No "listener dropped/nilled if registered before init" bug exists in either source. See `docs/plans/synthetic-zooming-knuth.md` and updated `.claude/rules/bridge-patterns.md` §4 / `native-android.md` / `native-ios.md` §4 for the rationale now recorded in the rules.

---

## PR #694 — `stack/3-rpc-contract-fixes`
https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/pull/694

| File | Line | Comment |
|---|---|---|
| `android/src/main/java/com/appsflyer/reactnative/RNAppsFlyerModule.kt` | 39 | remove it once removing the fallback |
| `android/src/main/java/com/appsflyer/reactnative/RNAppsFlyerModule.kt` | 48 | not needed once removing the fallback |
| `android/build.gradle` | 80 | Use the bom, I don't think we still need the API |
| `ios/RNAppsFlyerImpl.swift` | 32 | I don't think we should use them via RPC from JS (same as today) |

**Read:** the two `RNAppsFlyerModule.kt` comments are follow-on cleanup once the #693 fallback (in `RpcInitGate.kt`) is removed — i.e. these depend on resolving #693 first, not independent fixes.

---

## PR #695 — `stack/4-index-ts-rename`
https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/pull/695

| File | Line | Comment |
|---|---|---|
| `index.ts` | 40 | The Native SDK just provides `Map<String, Object>` in the callback, so why not stick to it? |
| `index.ts` | 44 | I would change the name to `DeepLinkResult`, similar to the native one. Also, please make sure the keys match to native |
| `index.ts` | 90 | remove completely, don't deprecate |
| `index.ts` | 1365 | onConversionDataSuccess |
| `index.ts` | 1366 | onConversionDataFail |
| `index.ts` | 1367 | onDeepLinking |

**Read:** lines 1365–1367 are single-word comments with no elaboration — likely naming suggestions or "rename to X" pointers tied to whatever symbol sits at those lines; need to open the diff to see what they're attached to before we can act on them.

---

## PR #696 — `stack/5-api-alignment`
https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/pull/696

| File | Line | Comment |
|---|---|---|
| `index.ts` | 801 | Why optional? (not following the native SDK behavior). The data type should be a string |

---

## PR #697 — `stack/6-final-polish`
https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/pull/697

No comments yet.

---

## Where fixes belong (stacked-PR mechanics)

Each comment must be fixed **on the branch that introduced the flagged line**, not squashed onto the tip (#697):

- Fix on `stack/2-turbomodule-core` (#693) → rebase/restack #694→#697 on top (`git rebase --onto` down the chain, or your stack tool's restack), since each branch's base is the prior branch.
- Same pattern for #694, #695, #696 fixes — they land on that branch, then everything above it needs to pick up the new base commit.
- If a comment's root cause actually lives in an earlier branch (e.g. #694's two `RNAppsFlyerModule.kt` comments depend on removing the #693 fallback in `RpcInitGate.kt`), fix the earlier branch first — otherwise you'll rebase #694 twice.

Recommended order to resolve: **#693 → #694 → #695 → #696** (dependency order matches PR order here), then verify #697 still applies cleanly.
