/**
 * Backward Compatibility Tests
 * 
 * These tests verify that changes in this branch don't break existing client code patterns.
 * Focus: Runtime compatibility and type safety.
 */

import appsFlyer, { AppsFlyerConsent, StoreKitVersion } from '../index';

describe('Backward Compatibility Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setConsentData - Runtime Compatibility', () => {
    test('setConsentData accepts AppsFlyerConsentType-like plain object at runtime', () => {
      // Simulate old code using plain object (AppsFlyerConsentType shape)
      const consent = {
        isUserSubjectToGDPR: true,
        hasConsentForDataUsage: true,
        hasConsentForAdsPersonalization: false
      };
      
      // Should not throw - native code accepts ReadableMap/NSDictionary
      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
      expect(require('../node_modules/react-native/Libraries/BatchedBridge/NativeModules').RNAppsFlyer.setConsentData).toHaveBeenCalled();
    });

    test('setConsentData accepts AppsFlyerConsent class instance', () => {
      // New code using AppsFlyerConsent class
      const consent = new AppsFlyerConsent(true, true, false, true);
      
      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
      expect(require('../node_modules/react-native/Libraries/BatchedBridge/NativeModules').RNAppsFlyer.setConsentData).toHaveBeenCalled();
    });

    test('setConsentData accepts minimal consent object (non-GDPR)', () => {
      // Minimal object for non-GDPR user
      const consent = {
        isUserSubjectToGDPR: false
      };
      
      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
    });

    test('setConsentData accepts AppsFlyerConsent with all optional fields', () => {
      const consent = new AppsFlyerConsent(
        true,  // isUserSubjectToGDPR
        true,  // hasConsentForDataUsage
        false, // hasConsentForAdsPersonalization
        true   // hasConsentForAdStorage
      );
      
      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
    });
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
        storeKitVersion: StoreKitVersion.SK1
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

  describe('AppsFlyerConsent - Deprecated Static Methods', () => {
    test('AppsFlyerConsent.forGDPRUser still works at runtime', () => {
      const consent = AppsFlyerConsent.forGDPRUser(true, false);
      
      expect(consent).toBeInstanceOf(AppsFlyerConsent);
      expect(consent.isUserSubjectToGDPR).toBe(true);
      expect(consent.hasConsentForDataUsage).toBe(true);
      expect(consent.hasConsentForAdsPersonalization).toBe(false);
      
      // Should work with setConsentData
      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
    });

    test('AppsFlyerConsent.forNonGDPRUser still works at runtime', () => {
      const consent = AppsFlyerConsent.forNonGDPRUser();
      
      expect(consent).toBeInstanceOf(AppsFlyerConsent);
      expect(consent.isUserSubjectToGDPR).toBe(false);
      
      // Should work with setConsentData
      expect(() => appsFlyer.setConsentData(consent)).not.toThrow();
    });
  });

  describe('Callback Behavior - Android CallbackGuard (Transparent)', () => {
    test('Callbacks still work with initSdk', () => {
      const successCallback = jest.fn();
      const errorCallback = jest.fn();
      
      const options = {
        devKey: 'test',
        appId: '123',
        isDebug: true
      };
      
      appsFlyer.initSdk(options, successCallback, errorCallback);
      
      // CallbackGuard should be transparent - callbacks should still be callable
      expect(require('../node_modules/react-native/Libraries/BatchedBridge/NativeModules').RNAppsFlyer.initSdkWithCallBack).toHaveBeenCalled();
    });

    test('Callbacks still work with logEvent', () => {
      const successCallback = jest.fn();
      const errorCallback = jest.fn();
      
      appsFlyer.logEvent('test_event', {}, successCallback, errorCallback);
      
      expect(require('../node_modules/react-native/Libraries/BatchedBridge/NativeModules').RNAppsFlyer.logEvent).toHaveBeenCalled();
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

