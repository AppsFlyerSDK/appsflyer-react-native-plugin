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

| File | Line | Comment | Status |
|---|---|---|---|
| `index.ts` | 40 | The Native SDK just provides `Map<String, Object>` in the callback, so why not stick to it? | **Addressed** — `ConversionData` collapsed to `{ [key: string]: any }`, named fields dropped |
| `index.ts` | 44 | I would change the name to `DeepLinkResult`, similar to the native one. Also, please make sure the keys match to native | **Addressed** — `UnifiedDeepLinkData` renamed to `DeepLinkResult`; shape unchanged (already verified against native source) |
| `index.ts` | 90 | remove completely, don't deprecate | **Addressed** — `GenerateInviteLinkParams.deeplinkPath` and its `generateInviteLink` warning branch removed outright (never shipped, no deprecation window needed) |
| `index.ts` | 1365 | onConversionDataSuccess | **Addressed** — `onInstallConversionData` renamed to `onConversionDataSuccess` throughout (impl, interface, tests, demos, docs) |
| `index.ts` | 1366 | onConversionDataFail | **Addressed** — `onInstallConversionFailure` renamed to `onConversionDataFail` |
| `index.ts` | 1367 | onDeepLinking | **Addressed** — `onDeepLink` renamed to `onDeepLinking` |

**Read:** lines 1365–1367 turned out to be the bare native method names, pointing at the `AppsFlyerApi` interface members directly above — confirmed with the user this meant a full public-API rename to match native exactly, not just a comment/doc note. Since 7.0.0 hasn't shipped (no git tag yet), this lands as one rename within the same unreleased major rather than a second breaking change on top of it.

**Note (found during the #696 rebase):** #695's `onConversionDataSuccess`/`onConversionDataFail`/`onDeepLinking` rename above is itself superseded one branch later by #696's `registerConversionListener`/`registerDeepLinkListener` + `unregisterConversionListener`/`unregisterForDeepLink` redesign (already authored in `af6ff95e` before #695's fix landed). Resolved every resulting rebase conflict in #696/#697 in favor of #696's register/unregister API — it's the real, final shape; #695's rename was still correct/necessary work on its own branch, just short-lived up the stack. Also caught and fixed a latent gap this exposed: `.af-e2e/test-plan.json`/`.af-smoke/rc-test-plan.json`'s log-pattern matchers were never updated for either rename and would have silently stopped matching.

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
