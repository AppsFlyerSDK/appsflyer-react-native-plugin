/**
 * Backward Compatibility Tests
 *
 * These tests verify that changes in this branch don't break existing client code patterns.
 * Focus: Runtime compatibility and type safety.
 */

import appsFlyer, { StoreKitVersion, AFInAppEventType } from '../index';

const NativeAppsFlyer = require('../src/NativeAppsFlyer').default;

describe('Backward Compatibility Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setConsentData - Runtime Compatibility', () => {
    test('setConsentData accepts a plain SetConsentDataParams object at runtime', () => {
      const consent = {
        isUserSubjectToGDPR: true,
        hasConsentForDataUsage: true,
        hasConsentForAdsPersonalization: false,
      };

      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
      expect(NativeAppsFlyer.executeRpc).toHaveBeenCalled();
    });

    test('setConsentData accepts minimal consent object (non-GDPR)', () => {
      const consent = {
        isUserSubjectToGDPR: false,
      };

      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
    });

    // The `AppsFlyerConsent` convenience constructor class (for building the same plain object)
    // is no longer exported after the @appsflyer-sdk/js-core-plugin migration -- callers build the plain
    // object directly instead (see above). Flagged for the index.ts owner as a real, unflagged
    // public-API removal, same as noted in index.test.js; not re-added here.
  });

  describe('StoreKitVersion - Runtime Access', () => {
    test('StoreKitVersion is accessible at runtime as object', () => {
      expect(StoreKitVersion).toBeDefined();
      expect(typeof StoreKitVersion).toBe('object');
      expect(StoreKitVersion.SK1).toBe('SK1');
      expect(StoreKitVersion.SK2).toBe('SK2');
    });

    test('StoreKitVersion can be used in PurchaseConnectorConfig', () => {
      const config = {
        logSubscriptions: true,
        logInApps: true,
        sandbox: false,
        storeKitVersion: StoreKitVersion.SK1,
      };

      expect(config.storeKitVersion).toBe('SK1');
      expect(config.storeKitVersion).toBe(StoreKitVersion.SK1);
    });

    test('StoreKitVersion values are correct strings', () => {
      expect(StoreKitVersion.SK1).toBe('SK1');
      expect(StoreKitVersion.SK2).toBe('SK2');
      expect(typeof StoreKitVersion.SK1).toBe('string');
      expect(typeof StoreKitVersion.SK2).toBe('string');
    });
  });

  // The old (name, values, successCallback, errorCallback) callback-style logEvent signature no
  // longer exists at all -- @appsflyer-sdk/js-core-plugin's logEvent takes a single LogEventParams
  // object and returns a Promise, full stop. This isn't "callbacks still transparently work" (the
  // pre-7.0.0 CallbackGuard concern this describe block used to guard) -- the calling convention
  // itself is gone. Converted to the real new call shape below; the removed convention isn't
  // re-tested since there's nothing left to assert about it.
  describe('logEvent (Promise-only, no callback-style overload)', () => {
    test('logEvent dispatches the RPC and resolves', async () => {
      NativeAppsFlyer.executeRpc.mockResolvedValueOnce(JSON.stringify({ success: true, data: null }));
      await appsFlyer.logEvent({ eventName: 'af_purchase', eventValues: { af_revenue: 1 } });
      expect(NativeAppsFlyer.executeRpc).toHaveBeenCalled();
    });
  });

  describe('7.0.0+ breaking changes (MIGRATION.md) and their @appsflyer-sdk/js-core-plugin equivalents', () => {
    test('setHost sends {hostPrefixName, hostName} — param reorder/rename', () => {
      appsFlyer.setHost({ hostPrefixName: 'mycompany', hostName: 'onelink.me' });
      expect(NativeAppsFlyer.executeRpc).toHaveBeenCalledWith(
        JSON.stringify({
          method: 'setHost',
          params: { hostPrefixName: 'mycompany', hostName: 'onelink.me' },
        })
      );
    });

    test('validateAndLogInAppPurchase legacy (purchaseInfo, successC, errorC) signature is gone — the {purchase} params-object signature dispatches the RPC instead', () => {
      appsFlyer.validateAndLogInAppPurchase({
        purchase: { productId: 'sku', transactionId: 'txn', purchaseType: 'subscription' },
      });
      const [requestJson] = NativeAppsFlyer.executeRpc.mock.calls[0];
      expect(JSON.parse(requestJson).method).toBe('validateAndLogInAppPurchase');
    });

    test('setCollectIMEI is removed', () => {
      expect(appsFlyer.setCollectIMEI).toBeUndefined();
    });

    test('onAppOpenAttribution / onAttributionFailure / performOnAppAttribution are removed', () => {
      expect(appsFlyer.onAppOpenAttribution).toBeUndefined();
      expect(appsFlyer.onAttributionFailure).toBeUndefined();
      expect(appsFlyer.performOnAppAttribution).toBeUndefined();
    });

    test('registerDeepLinkListener still delivers data previously routed through onAppOpenAttribution', async () => {
      const { NativeEventEmitter } = require('react-native');
      const nativeEventEmitter = new NativeEventEmitter(NativeAppsFlyer);
      const callback = jest.fn();
      await appsFlyer.registerDeepLinkListener({ onDeepLinking: callback });

      const attributionData = { media_source: 'test', campaign: 'test_campaign' };
      nativeEventEmitter.emit(
        'RNAppsFlyer_rpcEvent',
        JSON.stringify({
          event: 'onDeepLinkReceived',
          data: attributionData,
          timestamp: 0,
          origin: 'ios',
        })
      );

      expect(callback).toHaveBeenCalledWith(attributionData);
    });
  });

  describe('AFInAppEventType (internal-mechanism change, MIGRATION.md)', () => {
    test('is exported from the package and carries the pre-7.0.0 getConstants() values', () => {
      expect(AFInAppEventType).toBeDefined();
      expect(AFInAppEventType.PURCHASE).toBe('af_purchase');
      expect(AFInAppEventType.ACHIEVEMENT_UNLOCKED).toBe('af_achievement_unlocked');
      expect(AFInAppEventType.LEVEL_ACHIEVED).toBe('af_level_achieved');
    });

    test('is frozen — cannot be mutated at runtime', () => {
      expect(Object.isFrozen(AFInAppEventType)).toBe(true);
    });
  });

  describe('Type Exports - ESLint Compatibility', () => {
    test('All expected exports are available', () => {
      expect(appsFlyer).toBeDefined();
      expect(StoreKitVersion).toBeDefined();
      // Note: AppsFlyerPurchaseConnector may not be available if Purchase Connector is disabled
      // This test verifies the exports exist, not that they're functional
    });
  });
});
