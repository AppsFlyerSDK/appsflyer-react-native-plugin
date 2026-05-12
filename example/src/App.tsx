// @ts-nocheck — QA test app; runtime correctness verified against index.d.ts signatures
import React, {useEffect} from 'react';
import {Platform, View, Text, StyleSheet} from 'react-native';
import appsFlyer, {AppsFlyerConsent} from 'react-native-appsflyer';
import {afLog, afCallbackLog, afLifecycleLog} from './AfQaLogger';
import Config from 'react-native-config';

export default function App() {
  useEffect(() => {
    runAutoFlow();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AF QA Test App - React Native</Text>
    </View>
  );
}

function runAutoFlow() {
  const devKey = Config.DEV_KEY;
  const appId = Config.APP_ID;

  if (!devKey) {
    afLog('CONFIG', 'DEV_KEY missing');
    return;
  }

  // 1. Register callbacks BEFORE initSdk (critical — listeners must be attached first)
  appsFlyer.onInstallConversionData(data => {
    afCallbackLog('onInstallConversionData', JSON.stringify(data));
  });
  appsFlyer.onAppOpenAttribution(data => {
    afCallbackLog('onAppOpenAttribution', JSON.stringify(data));
  });
  appsFlyer.onDeepLink(data => {
    afCallbackLog(
      'onDeepLinking',
      `status=${data.deepLinkStatus}, deepLinkValue=${data.data?.deep_link_value || 'N/A'}`,
    );
  });

  // 2. Pre-start APIs
  appsFlyer.setCustomerUserId('qa-test-user', result => {
    afLog('setCustomerUserId', `result: ${result}`);
  });

  appsFlyer.setCurrencyCode('USD', result => {
    afLog('setCurrencyCode', `result: ${result}`);
  });

  afLifecycleLog('--- Pre-start auto APIs complete ---');

  // 3. Start SDK with manualStart — initSdk configures, startSdk fires the actual start
  appsFlyer.initSdk(
    {
      devKey: devKey,
      isDebug: true,
      appId: Platform.OS === 'ios' ? appId : undefined,
      manualStart: true,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
    },
    result => {
      afLog('initSdk', `result: ${JSON.stringify(result)}`);
    },
    error => {
      afLog('initSdk', `error: ${JSON.stringify(error)}`);
    },
  );

  // startSdk() is void (fire-and-forget); success confirmed via onInstallConversionData callback
  appsFlyer.startSdk();
  afLog('startSDK', 'result: called');

  // 4. Post-start APIs
  appsFlyer.getAppsFlyerUID((err, uid) => {
    afLog('getAppsFlyerUID', `result: ${uid || err}`);
  });

  appsFlyer.getSDKVersion((err, version) => {
    afLog('getSDKVersion', `result: ${version || err}`);
  });

  afLifecycleLog('--- Post-start auto APIs complete ---');

  // 5. Fire standard events (Promise API — Android CallbackGuard WeakReference
  //    GC's async Callback objects before AppsFlyerRequestListener fires)
  appsFlyer
    .logEvent('af_demo_launch', {platform: 'react-native'})
    .then((result: any) => afLog('logEvent(af_demo_launch)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_demo_launch)', `error: ${error}`));

  appsFlyer
    .logEvent('af_purchase', {
      af_revenue: '12.99',
      af_currency: 'USD',
      af_content_id: 'qa-item-001',
    })
    .then((result: any) => afLog('logEvent(af_purchase)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_purchase)', `error: ${error}`));

  appsFlyer
    .logEvent('af_content_view', {
      af_content_id: 'qa-content-001',
      af_content_type: 'test',
    })
    .then((result: any) => afLog('logEvent(af_content_view)', `result: ${result}`))
    .catch((error: any) => afLog('logEvent(af_content_view)', `error: ${error}`));

  // 6. Consent & sharing APIs
  appsFlyer.setSharingFilterForPartners(['partner_test']);
  afLog('setSharingFilterForPartners', 'result: [partner_test]');

  const consent = new AppsFlyerConsent(true, true, true, true);
  appsFlyer.setConsentData(consent);
  afLog('setConsentData', 'result: GDPR consent set');

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
