import { NativeEventEmitter, NativeModules } from "react-native";
import { AppsFlyerSDK } from "@appsflyer-sdk/js-core-plugin";
import { RNTransport } from "./src/rn-transport";
import {
  AppsFlyerConstants,
  InAppPurchaseValidationResult,
  ValidationFailureData,
  SubscriptionValidationResult,
  MissingConfigurationException,
  OnResponse,
  OnFailure,
  OnReceivePurchaseRevenueValidationInfo,
} from "./PurchaseConnector";

// Re-exports all RPC domain types (ConversionData, *Params, AppsFlyerError, ...) — owned by @appsflyer-sdk/js-core-plugin now, not this repo.
export * from "@appsflyer-sdk/js-core-plugin";

// 7.0.0+ has no legacy-bridge fallback — fail fast on Old Architecture instead of a confusing native crash later; skipped under Jest (no RN globals).
if (typeof jest === "undefined") {
  const isNewArchitectureEnabled =
    (globalThis as any).RN$Bridgeless === true ||
    (globalThis as any).__turboModuleProxy != null;
  if (!isNewArchitectureEnabled) {
    throw new Error(
      "react-native-appsflyer 7.0.0+ requires React Native's New Architecture (TurboModules). " +
        "Enable it via `newArchEnabled=true` in android/gradle.properties (Android) and " +
        "`RCT_NEW_ARCH_ENABLED=1` before `pod install` (iOS), or stay on react-native-appsflyer ^6 " +
        "if you cannot migrate to New Architecture yet."
    );
  }
}

export interface PurchaseConnectorConfig {
  logSubscriptions: boolean;
  logInApps: boolean;
  sandbox: boolean;
  storeKitVersion?: "SK1" | "SK2";
}

export interface PurchaseRevenueDataSourceBase {
  additionalParameters?: { [key: string]: any };
}

// Structurally identical to the StoreKit2 variant below; both stay exported (public API) backed by one shared shape.
export type PurchaseRevenueDataSource = PurchaseRevenueDataSourceBase;
export type PurchaseRevenueDataSourceStoreKit2 = PurchaseRevenueDataSourceBase;

export interface PurchaseEventDataSourceBase {
  onNewPurchases: (purchaseEvents: any[]) => { [key: string]: any };
}

// Same pattern: shared shape, both names kept exported for backward compatibility.
export type SubscriptionPurchaseEventDataSource = PurchaseEventDataSourceBase;
export type InAppPurchaseEventDataSource = PurchaseEventDataSourceBase;

export interface PurchaseConnector {
  create(config: PurchaseConnectorConfig): void;
  startObservingTransactions(): void;
  stopObservingTransactions(): void;

  // iOS methods
  logConsumableTransaction(transactionId: string): void;

  OnReceivePurchaseRevenueValidationInfo(
    callback: OnReceivePurchaseRevenueValidationInfo
  ): void;

  setPurchaseRevenueDataSource: (dataSource: PurchaseRevenueDataSource) => void;
  setPurchaseRevenueDataSourceStoreKit2: (dataSource: PurchaseRevenueDataSourceStoreKit2) => void;

  // Android methods
  onSubscriptionValidationResultSuccess(
    callback: OnResponse<SubscriptionValidationResult>
  ): () => void;
  onSubscriptionValidationResultFailure(callback: OnFailure): () => void;
  onInAppValidationResultSuccess(
    callback: OnResponse<InAppPurchaseValidationResult>
  ): () => void;
  onInAppValidationResultFailure(callback: OnFailure): () => void;

  setSubscriptionPurchaseEventDataSource: (dataSource: SubscriptionPurchaseEventDataSource) => void;
  setInAppPurchaseEventDataSource: (dataSource: InAppPurchaseEventDataSource) => void;
}

// Purchase Connector native bridge objects — unrelated to core, untouched by this migration (out of scope; see CLAUDE.md).
const { PCAppsFlyer } = NativeModules;
const AppsFlyerPurchaseConnector = {} as PurchaseConnector;
const purchaseConnectorEventEmitter = new NativeEventEmitter(PCAppsFlyer);

export const StoreKitVersion = {
  SK1: "SK1",
  SK2: "SK2",
} as const;

AppsFlyerPurchaseConnector.startObservingTransactions = () => {
  PCAppsFlyer.startObservingTransactions();
};

AppsFlyerPurchaseConnector.stopObservingTransactions = () => {
  PCAppsFlyer.stopObservingTransactions();
};

// Shared by the 4 Android listener setters below: guard callback type, subscribe, parse, return remove().
function addValidationListener<TParsed>(
  eventName: string,
  parse: (result: any) => TParsed,
  callback: (parsed: TParsed) => void,
  parseErrorMessage: string
): () => void {
  const listener = purchaseConnectorEventEmitter.addListener(eventName, (result: any) => {
    try {
      callback(parse(result));
    } catch (error) {
      console.error(parseErrorMessage, error);
    }
  });

  return () => listener.remove();
}

// Purchase Connector Android methods
AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess = (onSuccess) => {
  if (typeof onSuccess !== "function") {
    throw new Error("onSuccess callback must be a function");
  }

  return addValidationListener(
    AppsFlyerConstants.SUBSCRIPTION_VALIDATION_SUCCESS,
    (result: Record<string, any>) => {
      const parsedResults = new Map<string, SubscriptionValidationResult>();
      for (const [purchaseToken, validationResult] of Object.entries(result)) {
        parsedResults.set(purchaseToken, SubscriptionValidationResult.fromJson(validationResult));
      }
      return parsedResults;
    },
    onSuccess,
    "Failed to parse subscription validation results:"
  );
};

AppsFlyerPurchaseConnector.onSubscriptionValidationResultFailure = (onFailure) => {
  if (typeof onFailure !== "function") {
    throw new Error("onFailure callback must be a function");
  }

  return addValidationListener(
    AppsFlyerConstants.SUBSCRIPTION_VALIDATION_FAILURE,
    (result: any) => ValidationFailureData.fromJson(result),
    onFailure as any,
    "Failed to handle subscription validation result:"
  );
};

AppsFlyerPurchaseConnector.onInAppValidationResultSuccess = (onSuccess) => {
  if (typeof onSuccess !== "function") {
    throw new Error("onSuccess callback must be a function");
  }

  return addValidationListener(
    AppsFlyerConstants.IN_APP_PURCHASE_VALIDATION_SUCCESS,
    (result: Record<string, any>) => {
      const parsedResults = new Map<string, InAppPurchaseValidationResult>();
      for (const [purchaseToken, validationResult] of Object.entries(result)) {
        parsedResults.set(purchaseToken, InAppPurchaseValidationResult.fromJson(validationResult));
      }
      return parsedResults;
    },
    onSuccess,
    "Failed to handle in-app purchase validation results:"
  );
};

AppsFlyerPurchaseConnector.onInAppValidationResultFailure = (onFailure) => {
  if (typeof onFailure !== "function") {
    throw new Error("onFailure callback must be a function");
  }

  return addValidationListener(
    AppsFlyerConstants.IN_APP_PURCHASE_VALIDATION_FAILURE,
    (result: any) => ValidationFailureData.fromJson(result),
    onFailure as any,
    "Failed to handle in-app purchase validation result:"
  );
};

AppsFlyerPurchaseConnector.setSubscriptionPurchaseEventDataSource = (dataSource) => {
  if (!dataSource || typeof dataSource !== "object") {
    throw new Error("dataSource must be an object");
  }
  PCAppsFlyer.setSubscriptionPurchaseEventDataSource(dataSource);
};

AppsFlyerPurchaseConnector.setInAppPurchaseEventDataSource = (dataSource) => {
  if (!dataSource || typeof dataSource !== "object") {
    throw new Error("dataSource must be an object");
  }
  PCAppsFlyer.setInAppPurchaseEventDataSource(dataSource);
};

// Purchase Connector iOS methods
AppsFlyerPurchaseConnector.logConsumableTransaction = (transactionId: string) => {
  PCAppsFlyer.logConsumableTransaction(transactionId);
};

AppsFlyerPurchaseConnector.OnReceivePurchaseRevenueValidationInfo = (callback) => {
  if (typeof callback !== "function") {
    throw new Error("The callback must be a function");
  }

  const revenueValidationListener = purchaseConnectorEventEmitter.addListener(
    AppsFlyerConstants.DID_RECEIVE_PURCHASE_REVENUE_VALIDATION_INFO,
    (info: any) => {
      try {
        if (info.error) {
          callback(undefined, info.error);
        } else {
          const validationInfo = JSON.stringify(info);
          callback(validationInfo as any, undefined);
        }
      } catch (error) {
        console.error("Failed to handle iOS validation result:", error);
      }
    }
  );

  return () => revenueValidationListener.remove();
};

AppsFlyerPurchaseConnector.setPurchaseRevenueDataSource = (dataSource) => {
  if (!dataSource || typeof dataSource !== "object") {
    throw new Error("dataSource must be an object");
  }
  PCAppsFlyer.setPurchaseRevenueDataSource(dataSource);
};

AppsFlyerPurchaseConnector.setPurchaseRevenueDataSourceStoreKit2 = (dataSource) => {
  if (!dataSource || typeof dataSource !== "object") {
    throw new Error("dataSource must be an object");
  }
  PCAppsFlyer.setPurchaseRevenueDataSourceStoreKit2(dataSource);
};

export const AppsFlyerPurchaseConnectorConfig = {
  setConfig: ({
    logSubscriptions,
    logInApps,
    sandbox,
    storeKitVersion,
  }: PurchaseConnectorConfig): PurchaseConnectorConfig => {
    return {
      logSubscriptions,
      logInApps,
      sandbox,
      storeKitVersion: storeKitVersion || StoreKitVersion.SK1,
    };
  },
};

AppsFlyerPurchaseConnector.create = (config: PurchaseConnectorConfig) => {
  if (!config) {
    throw new MissingConfigurationException();
  }
  PCAppsFlyer.create(config);
};

export { AppsFlyerPurchaseConnector };

// Core SDK: everything below delegates to @appsflyer-sdk/js-core-plugin

export const MEDIATION_NETWORK = Object.freeze({
  IRONSOURCE: "ironsource",
  APPLOVIN_MAX: "applovin_max",
  GOOGLE_ADMOB: "google_admob",
  FYBER: "fyber",
  APPODEAL: "appodeal",
  ADMOST: "Admost",
  TOPON: "Topon",
  TRADPLUS: "Tradplus",
  YANDEX: "Yandex",
  CHARTBOOST: "chartboost",
  UNITY: "Unity",
  TOPON_PTE: "topon_pte",
  CUSTOM_MEDIATION: "custom_mediation",
  DIRECT_MONETIZATION_NETWORK: "direct_monetization_network",
});

// Reported via setPluginInfo; distinguishing Expo from bare RN predates this migration.
const PLUGIN_NAME = NativeModules.ExponentConstants != null ? "expo" : "react_native";

const sdk = new AppsFlyerSDK(new RNTransport(), {
  plugin: PLUGIN_NAME,
  pluginVersion: require("./package.json").version,
});

// Public SDK instance — this repo only supplies the transport now; named export matches other plugin-core plugins, default export kept for existing call sites.
export const AppsFlyer = sdk;
export default AppsFlyer;

export const AFPurchaseType = {
  SUBSCRIPTION: "subscription",
  ONE_TIME_PURCHASE: "one_time_purchase",
} as const;

// Pre-7.0.0 these came from the legacy native module's getConstants(); TurboModule has no equivalent, so they're plain JS constants now.
export const AFInAppEventType = Object.freeze({
  ACHIEVEMENT_UNLOCKED: "af_achievement_unlocked",
  ADD_PAYMENT_INFO: "af_add_payment_info",
  ADD_TO_CART: "af_add_to_cart",
  ADD_TO_WISH_LIST: "af_add_to_wishlist",
  COMPLETE_REGISTRATION: "af_complete_registration",
  CONTENT_VIEW: "af_content_view",
  INITIATED_CHECKOUT: "af_initiated_checkout",
  INVITE: "af_invite",
  LEVEL_ACHIEVED: "af_level_achieved",
  LOCATION_CHANGED: "af_location_changed",
  LOCATION_COORDINATES: "af_location_coordinates",
  LOGIN: "af_login",
  OPENED_FROM_PUSH_NOTIFICATION: "af_opened_from_push_notification",
  ORDER_ID: "af_order_id",
  PURCHASE: "af_purchase",
  RATE: "af_rate",
  RE_ENGAGE: "af_re_engage",
  SEARCH: "af_search",
  SHARE: "af_share",
  SPENT_CREDIT: "af_spent_credits",
  TRAVEL_BOOKING: "af_travel_booking",
  TUTORIAL_COMPLETION: "af_tutorial_completion",
  UPDATE: "af_update",
});
