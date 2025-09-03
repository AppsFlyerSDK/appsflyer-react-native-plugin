import InAppPurchaseValidationResult from '../PurchaseConnector/models/in_app_purchase_validation_result';
import SubscriptionValidationResult from '../PurchaseConnector/models/subscription_validation_result';
import ValidationFailureData from '../PurchaseConnector/models/validation_failure_data';
import { ProductPurchase } from '../PurchaseConnector/models/product_purchase';
import { Money } from '../PurchaseConnector/models/money_model';
import { OfferDetails } from '../PurchaseConnector/models/offer_details';
import { AutoRenewingPlan } from '../PurchaseConnector/models/auto_renewing_plan';

// Mock PCAppsFlyer
jest.mock('../node_modules/react-native/Libraries/BatchedBridge/NativeModules', () => ({
  PCAppsFlyer: {
    startObservingTransactions: jest.fn(),
    stopObservingTransactions: jest.fn(),
    create: jest.fn(),
    logConsumableTransaction: jest.fn(),
    setSubscriptionPurchaseEventDataSource: jest.fn(),
    setInAppPurchaseEventDataSource: jest.fn(),
    setPurchaseRevenueDataSource: jest.fn(),
    setPurchaseRevenueDataSourceStoreKit2: jest.fn(),
  },
}));

// Mock NativeEventEmitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({
      remove: jest.fn(),
    }),
  }));
});

// Mock the PCAppsFlyer import
const { PCAppsFlyer } = require('../node_modules/react-native/Libraries/BatchedBridge/NativeModules');
const { NativeEventEmitter } = require('react-native');

// Import the actual modules using require
const { AppsFlyerPurchaseConnector, AppsFlyerPurchaseConnectorConfig, StoreKitVersion } = require('../index');

describe('PurchaseConnector Models', () => {
  describe('InAppPurchaseValidationResult', () => {
    test('constructor with all parameters', () => {
      const productPurchase = new ProductPurchase({
        kind: 'test',
        purchaseTimeMillis: '123456789',
        purchaseState: 1,
        consumptionState: 1,
        developerPayload: 'payload',
        orderId: 'order123',
        purchaseType: 1,
        acknowledgementState: 1,
        purchaseToken: 'token123',
        productId: 'product123',
        quantity: 1,
        obfuscatedExternalAccountId: 'account123',
        obfuscatedExternalProfileId: 'profile123',
        regionCode: 'US'
      });

      const result = new InAppPurchaseValidationResult(true, productPurchase);
      
      expect(result.success).toBe(true);
      expect(result.productPurchase).toBe(productPurchase);
      expect(result.failureData).toBeUndefined();
    });

    test('constructor with failure data', () => {
      const failureData = { status: 400, description: 'test error' };
      const result = new InAppPurchaseValidationResult(false, undefined, failureData);
      
      expect(result.success).toBe(false);
      expect(result.productPurchase).toBeUndefined();
      expect(result.failureData).toBe(failureData);
    });

    test('fromJson with success', () => {
      const json = {
        success: true,
        productPurchase: {
          kind: 'test',
          purchaseTimeMillis: '123456789',
          purchaseState: 1,
          consumptionState: 1,
          developerPayload: 'payload',
          orderId: 'order123',
          purchaseType: 1,
          acknowledgementState: 1,
          purchaseToken: 'token123',
          productId: 'product123',
          quantity: 1,
          obfuscatedExternalAccountId: 'account123',
          obfuscatedExternalProfileId: 'profile123',
          regionCode: 'US'
        }
      };

      const result = InAppPurchaseValidationResult.fromJson(json);
      
      expect(result.success).toBe(true);
      expect(result.productPurchase).toBeDefined();
      expect(result.failureData).toBeUndefined();
    });

    test('fromJson with failure', () => {
      const json = {
        success: false,
        failureData: { status: 400, description: 'test error' }
      };

      const result = InAppPurchaseValidationResult.fromJson(json);
      
      expect(result.success).toBe(false);
      expect(result.productPurchase).toBeUndefined();
      expect(result.failureData).toEqual({ status: 400, description: 'test error' });
    });

    test('toJson with success', () => {
      const productPurchase = new ProductPurchase({
        kind: 'test',
        purchaseTimeMillis: '123456789',
        purchaseState: 1,
        consumptionState: 1,
        developerPayload: 'payload',
        orderId: 'order123',
        purchaseType: 1,
        acknowledgementState: 1,
        purchaseToken: 'token123',
        productId: 'product123',
        quantity: 1,
        obfuscatedExternalAccountId: 'account123',
        obfuscatedExternalProfileId: 'profile123',
        regionCode: 'US'
      });

      const result = new InAppPurchaseValidationResult(true, productPurchase);
      const json = result.toJson();
      
      expect(json.success).toBe(true);
      expect(json.productPurchase).toBeDefined();
      expect(json.failureData).toBeUndefined();
    });

    test('toJson with failure', () => {
      const failureData = { status: 400, description: 'test error' };
      const result = new InAppPurchaseValidationResult(false, undefined, failureData);
      const json = result.toJson();
      
      expect(json.success).toBe(false);
      expect(json.productPurchase).toBeUndefined();
      expect(json.failureData).toEqual({ status: 400, description: 'test error' });
    });
  });

  describe('ProductPurchase', () => {
    const mockArgs = {
      kind: 'test',
      purchaseTimeMillis: '123456789',
      purchaseState: 1,
      consumptionState: 1,
      developerPayload: 'payload',
      orderId: 'order123',
      purchaseType: 1,
      acknowledgementState: 1,
      purchaseToken: 'token123',
      productId: 'product123',
      quantity: 1,
      obfuscatedExternalAccountId: 'account123',
      obfuscatedExternalProfileId: 'profile123',
      regionCode: 'US'
    };

    test('constructor', () => {
      const purchase = new ProductPurchase(mockArgs);
      
      expect(purchase.kind).toBe('test');
      expect(purchase.purchaseTimeMillis).toBe('123456789');
      expect(purchase.purchaseState).toBe(1);
      expect(purchase.consumptionState).toBe(1);
      expect(purchase.developerPayload).toBe('payload');
      expect(purchase.orderId).toBe('order123');
      expect(purchase.purchaseType).toBe(1);
      expect(purchase.acknowledgementState).toBe(1);
      expect(purchase.purchaseToken).toBe('token123');
      expect(purchase.productId).toBe('product123');
      expect(purchase.quantity).toBe(1);
      expect(purchase.obfuscatedExternalAccountId).toBe('account123');
      expect(purchase.obfuscatedExternalProfileId).toBe('profile123');
      expect(purchase.regionCode).toBe('US');
    });

    test('toJson', () => {
      const purchase = new ProductPurchase(mockArgs);
      const json = purchase.toJson();
      
      expect(json).toEqual(mockArgs);
    });

    test('fromJson', () => {
      const json = { ...mockArgs };
      const purchase = ProductPurchase.fromJson(json);
      
      expect(purchase.kind).toBe('test');
      expect(purchase.purchaseTimeMillis).toBe('123456789');
      expect(purchase.purchaseState).toBe(1);
      expect(purchase.consumptionState).toBe(1);
      expect(purchase.developerPayload).toBe('payload');
      expect(purchase.orderId).toBe('order123');
      expect(purchase.purchaseType).toBe(1);
      expect(purchase.acknowledgementState).toBe(1);
      expect(purchase.purchaseToken).toBe('token123');
      expect(purchase.productId).toBe('product123');
      expect(purchase.quantity).toBe(1);
      expect(purchase.obfuscatedExternalAccountId).toBe('account123');
      expect(purchase.obfuscatedExternalProfileId).toBe('profile123');
      expect(purchase.regionCode).toBe('US');
    });
  });

  describe('Money', () => {
    test('constructor and properties', () => {
      const money = new Money('USD', 1000, 10);
      
      expect(money.currencyCode).toBe('USD');
      expect(money.nanos).toBe(1000);
      expect(money.units).toBe(10);
    });

    test('toJson', () => {
      const money = new Money('EUR', 2000, 20);
      const json = money.toJson();
      
      expect(json.currencyCode).toBe('EUR');
      expect(json.nanos).toBe(2000);
      expect(json.units).toBe(20);
    });

    test('fromJson', () => {
      const json = { currencyCode: 'GBP', nanos: 3000, units: 30 };
      const money = Money.fromJson(json);
      
      expect(money.currencyCode).toBe('GBP');
      expect(money.nanos).toBe(3000);
      expect(money.units).toBe(30);
    });
  });

  describe('OfferDetails', () => {
    test('constructor and properties', () => {
      const offer = new OfferDetails(['tag1', 'tag2'], 'basePlan123', 'offer123');
      
      expect(offer.offerTags).toEqual(['tag1', 'tag2']);
      expect(offer.basePlanId).toBe('basePlan123');
      expect(offer.offerId).toBe('offer123');
    });

    test('toJson', () => {
      const offer = new OfferDetails(['tag3', 'tag4'], 'basePlan456', 'offer456');
      const json = offer.toJson();
      
      expect(json.offerTags).toEqual(['tag3', 'tag4']);
      expect(json.basePlanId).toBe('basePlan456');
      expect(json.offerId).toBe('offer456');
    });

    test('fromJson', () => {
      const json = { offerTags: ['tag5', 'tag6'], basePlanId: 'basePlan789', offerId: 'offer789' };
      const offer = OfferDetails.fromJson(json);
      
      expect(offer.offerTags).toEqual(['tag5', 'tag6']);
      expect(offer.basePlanId).toBe('basePlan789');
      expect(offer.offerId).toBe('offer789');
    });
  });

  describe('AutoRenewingPlan', () => {
    test('constructor and properties', () => {
      const plan = new AutoRenewingPlan(true);
      
      expect(plan.autoRenewEnabled).toBe(true);
      expect(plan.priceChangeDetails).toBeUndefined();
    });

    test('toJson', () => {
      const plan = new AutoRenewingPlan(false);
      const json = plan.toJson();
      
      expect(json.autoRenewEnabled).toBe(false);
      expect(json.priceChangeDetails).toBeUndefined();
    });

    test('fromJson', () => {
      const json = { autoRenewEnabled: true };
      const plan = AutoRenewingPlan.fromJson(json);
      
      expect(plan.autoRenewEnabled).toBe(true);
      expect(plan.priceChangeDetails).toBeUndefined();
    });
  });

  describe('ValidationFailureData', () => {
    test('constructor and properties', () => {
      const failureData = new ValidationFailureData(400, 'test error');
      
      expect(failureData.status).toBe(400);
      expect(failureData.description).toBe('test error');
    });

    test('toJson', () => {
      const failureData = new ValidationFailureData(500, 'another error');
      const json = failureData.toJson();
      
      expect(json.status).toBe(500);
      expect(json.description).toBe('another error');
    });

    test('fromJson', () => {
      const json = { status: 404, description: 'third error' };
      const failureData = ValidationFailureData.fromJson(json);
      
      expect(failureData.status).toBe(404);
      expect(failureData.description).toBe('third error');
    });
  });

  describe('SubscriptionValidationResult', () => {
    test('constructor with success', () => {
      const result = new SubscriptionValidationResult(true);
      
      expect(result.success).toBe(true);
      expect(result.subscriptionPurchase).toBeUndefined();
      expect(result.failureData).toBeUndefined();
    });

    test('constructor with failure', () => {
      const failureData = { status: 400, description: 'test error' };
      const result = new SubscriptionValidationResult(false, undefined, failureData);
      
      expect(result.success).toBe(false);
      expect(result.subscriptionPurchase).toBeUndefined();
      expect(result.failureData).toBe(failureData);
    });

    test('fromJson with success', () => {
      const json = { success: true };
      const result = SubscriptionValidationResult.fromJson(json);
      
      expect(result.success).toBe(true);
      expect(result.subscriptionPurchase).toBeUndefined();
      expect(result.failureData).toBeUndefined();
    });

    test('fromJson with failure', () => {
      const json = {
        success: false,
        failureData: { status: 400, description: 'test error' }
      };
      const result = SubscriptionValidationResult.fromJson(json);
      
      expect(result.success).toBe(false);
      expect(result.failureData).toEqual({ status: 400, description: 'test error' });
    });

    test('toJson with success', () => {
      const result = new SubscriptionValidationResult(true);
      const json = result.toJson();
      
      expect(json.success).toBe(true);
      expect(json.subscriptionPurchase).toBeUndefined();
      expect(json.failureData).toBeUndefined();
    });

    test('toJson with failure', () => {
      const failureData = { status: 400, description: 'test error' };
      const result = new SubscriptionValidationResult(false, undefined, failureData);
      const json = result.toJson();
      
      expect(json.success).toBe(false);
      expect(json.failureData).toEqual({ status: 400, description: 'test error' });
    });
  });
});

describe('PurchaseConnector Interface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('StoreKitVersion', () => {
    test('should have correct values', () => {
      expect(StoreKitVersion.SK1).toBe('SK1');
      expect(StoreKitVersion.SK2).toBe('SK2');
    });
  });

  describe('AppsFlyerPurchaseConnectorConfig', () => {
    test('setConfig with all parameters', () => {
      const config = AppsFlyerPurchaseConnectorConfig.setConfig({
        logSubscriptions: true,
        logInApps: false,
        sandbox: true,
        storeKitVersion: StoreKitVersion.SK2
      });

      expect(config).toEqual({
        logSubscriptions: true,
        logInApps: false,
        sandbox: true,
        storeKitVersion: 'SK2'
      });
    });

    test('setConfig with default storeKitVersion', () => {
      const config = AppsFlyerPurchaseConnectorConfig.setConfig({
        logSubscriptions: true,
        logInApps: true,
        sandbox: false
      });

      expect(config).toEqual({
        logSubscriptions: true,
        logInApps: true,
        sandbox: false,
        storeKitVersion: 'SK1' // Default value
      });
    });
  });

  describe('Core Methods', () => {
    test('create should call PCAppsFlyer.create', () => {
      const config = { logSubscriptions: true, logInApps: true, sandbox: false };
      
      AppsFlyerPurchaseConnector.create(config);
      
      expect(PCAppsFlyer.create).toHaveBeenCalledWith(config);
    });

    test('create should throw error when config is null', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.create(null);
      }).toThrow();
    });

    test('create should throw error when config is undefined', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.create(undefined);
      }).toThrow();
    });

    test('startObservingTransactions should call PCAppsFlyer.startObservingTransactions', () => {
      AppsFlyerPurchaseConnector.startObservingTransactions();
      
      expect(PCAppsFlyer.startObservingTransactions).toHaveBeenCalled();
    });

    test('stopObservingTransactions should call PCAppsFlyer.stopObservingTransactions', () => {
      AppsFlyerPurchaseConnector.stopObservingTransactions();
      
      expect(PCAppsFlyer.stopObservingTransactions).toHaveBeenCalled();
    });
  });

  describe('iOS Methods', () => {
    test('logConsumableTransaction should call PCAppsFlyer.logConsumableTransaction', () => {
      const transactionId = 'test_transaction_123';
      
      AppsFlyerPurchaseConnector.logConsumableTransaction(transactionId);
      
      expect(PCAppsFlyer.logConsumableTransaction).toHaveBeenCalledWith(transactionId);
    });

    test('setPurchaseRevenueDataSource should call PCAppsFlyer.setPurchaseRevenueDataSource', () => {
      const dataSource = { test: 'data' };
      
      AppsFlyerPurchaseConnector.setPurchaseRevenueDataSource(dataSource);
      
      expect(PCAppsFlyer.setPurchaseRevenueDataSource).toHaveBeenCalledWith(dataSource);
    });

    test('setPurchaseRevenueDataSource should throw error for invalid dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setPurchaseRevenueDataSource(null);
      }).toThrow('dataSource must be an object');
    });

    test('setPurchaseRevenueDataSource should throw error for non-object dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setPurchaseRevenueDataSource('string');
      }).toThrow('dataSource must be an object');
    });

    test('setPurchaseRevenueDataSourceStoreKit2 should call PCAppsFlyer.setPurchaseRevenueDataSourceStoreKit2', () => {
      const dataSource = { test: 'data' };
      
      AppsFlyerPurchaseConnector.setPurchaseRevenueDataSourceStoreKit2(dataSource);
      
      expect(PCAppsFlyer.setPurchaseRevenueDataSourceStoreKit2).toHaveBeenCalledWith(dataSource);
    });

    test('setPurchaseRevenueDataSourceStoreKit2 should throw error for invalid dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setPurchaseRevenueDataSourceStoreKit2(null);
      }).toThrow('dataSource must be an object');
    });

    test('setPurchaseRevenueDataSourceStoreKit2 should throw error for non-object dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setPurchaseRevenueDataSourceStoreKit2('string');
      }).toThrow('dataSource must be an object');
    });
  });

  describe('Android Methods', () => {
    test('setSubscriptionPurchaseEventDataSource should call PCAppsFlyer.setSubscriptionPurchaseEventDataSource', () => {
      const dataSource = { test: 'data' };
      
      AppsFlyerPurchaseConnector.setSubscriptionPurchaseEventDataSource(dataSource);
      
      expect(PCAppsFlyer.setSubscriptionPurchaseEventDataSource).toHaveBeenCalledWith(dataSource);
    });

    test('setSubscriptionPurchaseEventDataSource should throw error for invalid dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setSubscriptionPurchaseEventDataSource(null);
      }).toThrow('dataSource must be an object');
    });

    test('setSubscriptionPurchaseEventDataSource should throw error for non-object dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setSubscriptionPurchaseEventDataSource('string');
      }).toThrow('dataSource must be an object');
    });

    test('setInAppPurchaseEventDataSource should call PCAppsFlyer.setInAppPurchaseEventDataSource', () => {
      const dataSource = { test: 'data' };
      
      AppsFlyerPurchaseConnector.setInAppPurchaseEventDataSource(dataSource);
      
      expect(PCAppsFlyer.setInAppPurchaseEventDataSource).toHaveBeenCalledWith(dataSource);
    });

    test('setInAppPurchaseEventDataSource should throw error for invalid dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setInAppPurchaseEventDataSource(null);
      }).toThrow('dataSource must be an object');
    });

    test('setInAppPurchaseEventDataSource should throw error for non-object dataSource', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.setInAppPurchaseEventDataSource('string');
      }).toThrow('dataSource must be an object');
    });
  });

  describe('Event Listener Methods', () => {
    test('onSubscriptionValidationResultSuccess should throw error for non-function callback', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess('not a function');
      }).toThrow('onSuccess callback must be a function');
    });

    test('onSubscriptionValidationResultFailure should throw error for non-function callback', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.onSubscriptionValidationResultFailure('not a function');
      }).toThrow('onFailure callback must be a function');
    });

    test('onInAppValidationResultSuccess should throw error for non-function callback', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.onInAppValidationResultSuccess('not a function');
      }).toThrow('onSuccess callback must be a function');
    });

    test('onInAppValidationResultFailure should throw error for non-function callback', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.onInAppValidationResultFailure('not a function');
      }).toThrow('onFailure callback must be a function');
    });

    test('OnReceivePurchaseRevenueValidationInfo should throw error for non-function callback', () => {
      expect(() => {
        AppsFlyerPurchaseConnector.OnReceivePurchaseRevenueValidationInfo('not a function');
      }).toThrow('The callback must be a function');
    });

    test('onSubscriptionValidationResultSuccess should return a function when called with valid callback', () => {
      const callback = jest.fn();
      const result = AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess(callback);
      expect(typeof result).toBe('function');
    });

    test('onSubscriptionValidationResultFailure should return a function when called with valid callback', () => {
      const callback = jest.fn();
      const result = AppsFlyerPurchaseConnector.onSubscriptionValidationResultFailure(callback);
      expect(typeof result).toBe('function');
    });

    test('onInAppValidationResultSuccess should return a function when called with valid callback', () => {
      const callback = jest.fn();
      const result = AppsFlyerPurchaseConnector.onInAppValidationResultSuccess(callback);
      expect(typeof result).toBe('function');
    });

    test('onInAppValidationResultFailure should return a function when called with valid callback', () => {
      const callback = jest.fn();
      const result = AppsFlyerPurchaseConnector.onInAppValidationResultFailure(callback);
      expect(typeof result).toBe('function');
    });

    test('OnReceivePurchaseRevenueValidationInfo should return a function when called with valid callback', () => {
      const callback = jest.fn();
      const result = AppsFlyerPurchaseConnector.OnReceivePurchaseRevenueValidationInfo(callback);
      expect(typeof result).toBe('function');
    });
  });
}); 