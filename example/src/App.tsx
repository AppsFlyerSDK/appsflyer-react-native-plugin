// @ts-nocheck — QA test app; runtime correctness verified against index.d.ts signatures
import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import appsFlyer, {AppsFlyerConsent} from 'react-native-appsflyer';
import {afLog, afCallbackLog, afLifecycleLog} from './AfQaLogger';
import Config from 'react-native-config';

export default function App() {
  useEffect(() => {
    runAutoFlow().catch(error => afLog('runAutoFlow', `error: ${JSON.stringify(error)}`));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AF QA Test App - React Native</Text>
    </View>
  );
}

// start() still lives inside registerSessionReadyListener's callback — that's the
// documented contract (AppsFlyerLib.h: "Call start inside the block. The SDK does not call
// start automatically."), unchanged. This only wraps it in a Promise so the caller can
// await the whole thing: makes start() deterministically first in the RPC dispatch order
// instead of racing whatever synchronous JS runs after the (fire-and-forget) registration
// call returns.
function startWhenSessionReady() {
  return new Promise<void>((resolve, reject) => {
    const remove = appsFlyer.registerSessionReadyListener(() => {
      remove();
      afCallbackLog('onSessionReady', 'session ready — starting SDK');
      appsFlyer.start().then(() => {
        afLog('start', 'result: called');
        resolve();
      }, reject);
    });
  });
}

async function runAutoFlow() {
  const devKey = Config.DEV_KEY;
  const appId = Config.APP_ID;

  if (!devKey) {
    afLog('CONFIG', 'DEV_KEY missing');
    return;
  }

  // Resolves on the first registerConversionListener delivery — lets the stop/resume
  // sequence below wait on the real event instead of a guessed timeout, so stop(true)
  // can't fire while conversion data is still in flight.
  let resolveConversionDataReceived: () => void;
  const conversionDataReceived = new Promise<void>(resolve => {
    resolveConversionDataReceived = resolve;
  });

  // 1. init -> enableDebug -> register listeners.
  // Deliberately NOT awaited: registration calls below must reach native before init's
  // promise resolves (bridge-patterns.md §4) — RpcInitGate only buffers them until init
  // *completes*, and awaiting init here would round-trip back to JS after that buffer may
  // already have flushed, risking a dropped conversion/deep-link event that fires shortly
  // after init. appId is always safe to pass — Android's RPC init handler only reads devKey
  // and ignores extra fields; only iOS actually requires/uses appId.
  appsFlyer.init(devKey, appId).then(
    result => afLog('init', `result: ${JSON.stringify(result)}`),
    error => afLog('init', `error: ${JSON.stringify(error)}`),
  );

  appsFlyer.enableDebug(true);

  appsFlyer.registerConversionListener(data => {
    afCallbackLog('registerConversionListener', JSON.stringify(data));
    resolveConversionDataReceived();
  });
  // onAppOpenAttribution removed in 7.0.0 — attribution data now arrives via registerDeepLinkListener (MIGRATION.md)
  appsFlyer.registerDeepLinkListener(data => {
    const deepLinkValue =
      typeof data.deepLink === 'object' ? data.deepLink?.deep_link_value : undefined;
    afCallbackLog(
      'onDeepLinking',
      `status=${data.status}, deepLinkValue=${deepLinkValue || 'N/A'}`,
    );
  });

  // 2. Pre-start APIs — void/fire-and-forget in 7.0.0 (MIGRATION.md: callback params removed)
  appsFlyer.setCustomerUserId('qa-test-user');
  afLog('setCustomerUserId', 'result: called');

  appsFlyer.setCurrencyCode('USD');
  afLog('setCurrencyCode', 'result: called');

  appsFlyer.setAdditionalData({tenant: 'qa_eu', experiment: 'rc_pipeline_v1'});
  afLog('setAdditionalData', 'result: called');

  afLifecycleLog('--- Pre-start auto APIs complete ---');

  // 3. start() only fires once registerSessionReadyListener's callback confirms the SDK is
  // ready (real native callback, or the bridge's own fallback — either way this resolves).
  // Everything below only runs after start() has dispatched.
  await startWhenSessionReady();

  // 4. Post-start APIs — Promise-only in 7.0.0 (MIGRATION.md: callback params removed)
  appsFlyer
    .getAppsFlyerUID()
    .then(uid => afLog('getAppsFlyerUID', `result: ${uid}`))
    .catch(error => afLog('getAppsFlyerUID', `error: ${JSON.stringify(error)}`));

  appsFlyer
    .getSdkVersion()
    .then(version => afLog('getSdkVersion', `result: ${version}`))
    .catch(error => afLog('getSdkVersion', `error: ${JSON.stringify(error)}`));

  afLifecycleLog('--- Post-start auto APIs complete ---');

  // 5. Fire standard events (Promise API — Android CallbackGuard WeakReference
  //    GC's async Callback objects before AppsFlyerRequestListener fires)
  appsFlyer
    .logEvent('af_demo_launch', {platform: 'react-native'})
    .then((result: any) => afLog('logEvent(af_demo_launch)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_demo_launch)', `error: ${JSON.stringify(error)}`));

  appsFlyer
    .logEvent('af_purchase', {
      af_revenue: '12.99',
      af_currency: 'USD',
      af_content_id: 'qa-item-001',
    })
    .then((result: any) => afLog('logEvent(af_purchase)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_purchase)', `error: ${JSON.stringify(error)}`));

  appsFlyer
    .logEvent('af_content_view', {
      af_content_id: 'qa-content-001',
      af_content_type: 'test',
    })
    .then((result: any) => afLog('logEvent(af_content_view)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_content_view)', `error: ${JSON.stringify(error)}`));

  // 6. Custom event with rich params (E2E-004)
  const customPurchaseParams = {
    af_revenue: 19.99,
    af_currency: 'USD',
    af_content_id: 'sku_42',
    is_promo: true,
    metadata: {campaign: 'rc_e2e', tier: 'gold'},
  };
  afLog(
    'logEvent',
    `name=af_qa_custom_purchase params=${JSON.stringify(customPurchaseParams)}`,
  );
  appsFlyer
    .logEvent('af_qa_custom_purchase', customPurchaseParams)
    .then((result: any) =>
      afLog('logEvent(af_qa_custom_purchase)', `result: ${result}`),
    )
    .catch((error: any) =>
      afLog('logEvent(af_qa_custom_purchase)', `error: ${JSON.stringify(error)}`),
    );

  // 7. Identity-check event (E2E-005)
  afLog('logEvent', `name=af_qa_identity_check params=${JSON.stringify({step: 'post_start'})}`);
  appsFlyer
    .logEvent('af_qa_identity_check', {step: 'post_start'})
    .then((result: any) =>
      afLog('logEvent(af_qa_identity_check)', `result: ${result}`),
    )
    .catch((error: any) =>
      afLog('logEvent(af_qa_identity_check)', `error: ${JSON.stringify(error)}`),
    );

  // 8. Consent & sharing APIs
  appsFlyer.setSharingFilterForPartners(['partner_test']);
  afLog('setSharingFilterForPartners', 'result: [partner_test]');

  const consent = new AppsFlyerConsent(true, true, true, true);
  appsFlyer.setConsentData(consent);
  afLog('setConsentData', 'result: GDPR consent set');

  // 9. Stop/resume cycle (E2E-006)
  // Wait for the real registerConversionListener event instead of a guessed timeout —
  // stop(true) firing before conversion data arrives kills the in-flight request.
  await conversionDataReceived;

  // stop() is fire-and-forget void in 7.0.0 (MIGRATION.md: callback params removed) — no
  // completion signal to await; any callback passed is silently ignored, not invoked. Logged
  // as 'result: null' to match the void-RPC success convention used elsewhere in this file.
  appsFlyer.stop(true);
  afLog('stop(true)', 'result: null');

  // awaitResponse: true — round-trips to AppsFlyerLib's real completionHandler so we can
  // observe whether isStopped actually suppresses this event. Awaited so stop(false) below
  // cannot fire until this round-trip is done — otherwise the "stopped" window wouldn't
  // cover the full request and the result would say nothing about suppression.
  try {
    const result = await appsFlyer.logEvent('af_qa_suppressed', {phase: 'stopped'}, true);
    afLog('logEvent(af_qa_suppressed)', `result: ${JSON.stringify(result)}`);
  } catch (error: any) {
    afLog('logEvent(af_qa_suppressed)', `error: ${JSON.stringify(error)}`);
  }

  appsFlyer.stop(false);
  afLog('stop(false)', 'result: null');

  // Awaited too — the harness polls for the "Auto run complete" marker below as its
  // signal to stop waiting and collect logs, so it must not print until this result
  // (and its HTTP round-trip) has actually landed in the log file.
  try {
    const result = await appsFlyer.logEvent('af_qa_resumed', {phase: 'restarted'}, true);
    afLog('logEvent(af_qa_resumed)', `result: ${JSON.stringify(result)}`);
  } catch (error: any) {
    afLog('logEvent(af_qa_resumed)', `error: ${JSON.stringify(error)}`);
  }

  afLifecycleLog('--- Auto run complete ---');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
