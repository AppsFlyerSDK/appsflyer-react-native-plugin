// @ts-nocheck — QA test app; runtime correctness verified against index.d.ts signatures
import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import AppsFlyer from 'react-native-appsflyer';
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

const SESSION_READY_TIMEOUT_MS = 15000;

function startWhenSessionReady() {
  return new Promise<void>((resolve, reject) => {
    let started = false;
    const doStart = (reason: string) => {
      if (started) return;
      started = true;
      clearTimeout(timeoutId);
      AppsFlyer.start().then(() => {
        afLog('start', `result: called (${reason})`);
        resolve();
      }, reject);
    };

    AppsFlyer.registerSessionReadyListener(() => {
      afCallbackLog('onSessionReady', 'session ready — starting SDK');
      doStart('onSessionReady');
    });

    const timeoutId = setTimeout(() => doStart('timeout-fallback'), SESSION_READY_TIMEOUT_MS);
  });
}

async function runAutoFlow() {
  const devKey = Config.DEV_KEY;
  const appId = Config.APP_ID;

  if (!devKey) {
    afLog('CONFIG', 'DEV_KEY missing');
    return;
  }

  let resolveConversionDataReceived: () => void;
  const conversionDataReceived = new Promise<void>(resolve => {
    resolveConversionDataReceived = resolve;
  });

  const deepLinkListener = {
    onDeepLinking: data => {
      const deepLinkValue =
        typeof data.deepLink === 'object' ? data.deepLink?.deep_link_value : undefined;
      afCallbackLog(
        'onDeepLinking',
        `status=${data.status}, deepLinkValue=${deepLinkValue || 'N/A'}`,
      );
    },
  };

  // registerDeepLinkListener must be registered before init
  AppsFlyer.registerDeepLinkListener(deepLinkListener);

  AppsFlyer.init({devKey, appId}).then(
    result => afLog('init', `result: ${JSON.stringify(result)}`),
    error => afLog('init', `error: ${JSON.stringify(error)}`),
  );

  AppsFlyer.enableDebug({enabled: true});

  AppsFlyer.registerConversionListener({
    onConversionDataSuccess: data => {
      afCallbackLog('registerConversionListener', JSON.stringify(data));
      resolveConversionDataReceived();
    },
    onConversionDataFail: error => afCallbackLog('registerConversionListener', `error: ${error}`),
  });

  // 2. Pre-start APIs — void/fire-and-forget in 7.0.0 (MIGRATION.md: callback params removed),
  // and each now takes a single params object per @appsflyer-sdk/js-core-plugin's generated Rpc types.
  AppsFlyer.setCustomerUserId({customerId: 'qa-test-user'});
  afLog('setCustomerUserId', 'result: called');

  AppsFlyer.setCurrencyCode({currencyCode: 'USD'});
  afLog('setCurrencyCode', 'result: called');

  AppsFlyer.setAdditionalData({customData: {tenant: 'qa_eu', experiment: 'rc_pipeline_v1'}});
  afLog('setAdditionalData', 'result: called');

  afLifecycleLog('--- Pre-start auto APIs complete ---');

  // 3. start() only fires once registerSessionReadyListener's callback confirms the SDK is
  // ready. Everything below only runs after start() has dispatched.
  await startWhenSessionReady();

  // 4. Post-start APIs — Promise-only in 7.0.0 (MIGRATION.md: callback params removed)
  AppsFlyer
    .getAppsFlyerUID()
    .then(uid => afLog('getAppsFlyerUID', `result: ${uid}`))
    .catch(error => afLog('getAppsFlyerUID', `error: ${JSON.stringify(error)}`));

  AppsFlyer
    .getSdkVersion()
    .then(version => afLog('getSdkVersion', `result: ${version}`))
    .catch(error => afLog('getSdkVersion', `error: ${JSON.stringify(error)}`));

  afLifecycleLog('--- Post-start auto APIs complete ---');

  // 5. Fire standard events (Promise API — Android CallbackGuard WeakReference
  //    GC's async Callback objects before AppsFlyerRequestListener fires).
  //    logEvent now takes a single {eventName, eventValues, awaitResponse?} object.
  AppsFlyer
    .logEvent({eventName: 'af_demo_launch', eventValues: {platform: 'react-native'}})
    .then((result: any) => afLog('logEvent(af_demo_launch)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_demo_launch)', `error: ${JSON.stringify(error)}`));

  AppsFlyer
    .logEvent({
      eventName: 'af_purchase',
      eventValues: {
        af_revenue: '12.99',
        af_currency: 'USD',
        af_content_id: 'qa-item-001',
      },
    })
    .then((result: any) => afLog('logEvent(af_purchase)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_purchase)', `error: ${JSON.stringify(error)}`));

  AppsFlyer
    .logEvent({
      eventName: 'af_content_view',
      eventValues: {af_content_id: 'qa-content-001', af_content_type: 'test'},
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
  AppsFlyer
    .logEvent({eventName: 'af_qa_custom_purchase', eventValues: customPurchaseParams})
    .then((result: any) =>
      afLog('logEvent(af_qa_custom_purchase)', `result: ${result}`),
    )
    .catch((error: any) =>
      afLog('logEvent(af_qa_custom_purchase)', `error: ${JSON.stringify(error)}`),
    );

  // 7. Identity-check event (E2E-005)
  afLog('logEvent', `name=af_qa_identity_check params=${JSON.stringify({step: 'post_start'})}`);
  AppsFlyer
    .logEvent({eventName: 'af_qa_identity_check', eventValues: {step: 'post_start'}})
    .then((result: any) =>
      afLog('logEvent(af_qa_identity_check)', `result: ${result}`),
    )
    .catch((error: any) =>
      afLog('logEvent(af_qa_identity_check)', `error: ${JSON.stringify(error)}`),
    );

  // 8. Consent & sharing APIs
  AppsFlyer.setSharingFilterForPartners({partners: ['partner_test']});
  afLog('setSharingFilterForPartners', 'result: [partner_test]');

  // AppsFlyerConsent (the convenience constructor class) is no longer exported after the
  // @appsflyer-sdk/js-core-plugin migration — build the plain SetConsentDataParams object directly.
  AppsFlyer.setConsentData({
    isUserSubjectToGDPR: true,
    hasConsentForDataUsage: true,
    hasConsentForAdsPersonalization: true,
    hasConsentForAdStorage: true,
  });
  afLog('setConsentData', 'result: GDPR consent set');

  // 9. Stop/resume cycle (E2E-006)
  // Wait for the real registerConversionListener event instead of a guessed timeout —
  // stop(true) firing before conversion data arrives kills the in-flight request.
  await conversionDataReceived;

  // stop() is fire-and-forget void in 7.0.0 (MIGRATION.md: callback params removed) — no
  // completion signal to await; any callback passed is silently ignored, not invoked. Logged
  // as 'result: null' to match the void-RPC success convention used elsewhere in this file.
  // Now takes {shouldStop} instead of a positional boolean.
  await AppsFlyer.stop({shouldStop: true});
  afLog('stop(true)', 'result: null');

  // awaitResponse: true — round-trips to AppsFlyerLib's real completionHandler so we can
  // observe whether isStopped actually suppresses this event. Awaited so stop(false) below
  // cannot fire until this round-trip is done — otherwise the "stopped" window wouldn't
  // cover the full request and the result would say nothing about suppression.
  try {
    const result = await AppsFlyer.logEvent({
      eventName: 'af_qa_suppressed',
      eventValues: {phase: 'stopped'},
      awaitResponse: true,
    });
    afLog('logEvent(af_qa_suppressed)', `result: ${JSON.stringify(result)}`);
  } catch (error: any) {
    afLog('logEvent(af_qa_suppressed)', `error: ${JSON.stringify(error)}`);
  }

  AppsFlyer.stop({shouldStop: false});
  afLog('stop(false)', 'result: null');

  // Awaited too — the harness polls for the "Auto run complete" marker below as its
  // signal to stop waiting and collect logs, so it must not print until this result
  // (and its HTTP round-trip) has actually landed in the log file.
  try {
    const result = await AppsFlyer.logEvent({
      eventName: 'af_qa_resumed',
      eventValues: {phase: 'restarted'},
      awaitResponse: true,
    });
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
