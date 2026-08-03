import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import NativeAppsFlyer from "./src/NativeAppsFlyer";
import AppsFlyerConstants from "./PurchaseConnector/constants/constants";
import InAppPurchaseValidationResult from "./PurchaseConnector/models/in_app_purchase_validation_result";
import ValidationFailureData from "./PurchaseConnector/models/validation_failure_data";
import SubscriptionValidationResult from "./PurchaseConnector/models/subscription_validation_result";
import { MissingConfigurationException } from "./PurchaseConnector/models/missing_configuration_exception";
import {
  OnResponse,
  OnFailure,
  OnReceivePurchaseRevenueValidationInfo,
} from "./PurchaseConnector/utils/connector_callbacks";

// 7.0.0+ has no legacy-bridge fallback — fail fast on Old Architecture instead of a
// confusing native crash later. Skipped under Jest (no RN globals in a plain Node env).
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

// Verified against native source: AFRPCRequestHandlerDelegates.swift (iOS,
// `onConversionDataSuccess` emits the SDK's raw conversion dict directly) and
// AppsFlyerRpcHandler.kt (Android, `notifyPlugin("onConversionDataSuccess", conversionData)`).
// Both platforms emit the conversion fields flat — there is no `status`/`type`/`data` wrapper.
export type ConversionData = {
  is_first_launch: boolean;
  media_source?: string;
  campaign?: string;
  af_status?: "Organic" | "Non-organic";
  [key: string]: any;
};

// both platforms emit {status, deepLink?, error?} —
// there is no `deepLinkStatus`/`data`/`type`/`isDeferred` field.
export type UnifiedDeepLinkData = {
  status: "found" | "notFound" | "failure";
  error?: string;
  deepLink?: {
    campaign?: string;
    deep_link_value?: string;
    deep_link_sub1?: string;
    media_source?: string;
    pid?: string;
    link?: string;
    af_sub1?: string;
    af_sub2?: string;
    af_sub3?: string;
    af_sub4?: string;
    af_sub5?: string;
    af_dp?: string;
    is_retargeting?: string;
    af_channel?: string;
    af_cost_currency?: string;
    c?: string;
    af_adset?: string;
    af_click_lookback?: string;
    path?: string; // Uri-Scheme
    host?: string; // Uri-Scheme
    shortlink?: string; // Uri-Scheme
    scheme?: string; // Uri-Scheme
    [key: string]: any;
  } | string;
};

export interface AFPurchaseDetails {
  purchaseType: AFPurchaseType;
  transactionId: string; //aka PurchaseToken
  productId: string;
}

export interface GenerateInviteLinkParams {
  channel: string;
  campaign?: string;
  customerID?: string;
  userParams?: {
    deep_link_value?: string;
    [key: string]: any;
  };
  referrerName?: string;
  referrerImageUrl?: string;
  /** @deprecated No native counterpart on either platform — ignored (logs a warning). */
  deeplinkPath?: string;
  baseDeeplink?: string;
  brandDomain?: string;
}

export interface AFAdRevenueData {
  monetizationNetwork: string;
  mediationNetwork: string;
  currencyIso4217Code: string;
  revenue: number;
  additionalParameters?: { [key: string]: any };
}

export interface PurchaseConnectorConfig {
  logSubscriptions: boolean;
  logInApps: boolean;
  sandbox: boolean;
  storeKitVersion?: "SK1" | "SK2";
}

export interface PurchaseRevenueDataSource {
  additionalParameters?: { [key: string]: any };
}

export interface PurchaseRevenueDataSourceStoreKit2 {
  additionalParameters?: { [key: string]: any };
}

export interface SubscriptionPurchaseEventDataSource {
  onNewPurchases: (purchaseEvents: any[]) => { [key: string]: any };
}

export interface InAppPurchaseEventDataSource {
  onNewPurchases: (purchaseEvents: any[]) => { [key: string]: any };
}

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

const appsFlyer = {} as AppsFlyerApi;
const appsFlyerEventEmitter = new NativeEventEmitter(NativeAppsFlyer as any);

//Purchase Connector native bridge objects
const { PCAppsFlyer } = NativeModules;
const AppsFlyerPurchaseConnector = {} as PurchaseConnector;
const purchaseConnectorEventEmitter = new NativeEventEmitter(PCAppsFlyer);

export const StoreKitVersion = {
  SK1: "SK1",
  SK2: "SK2",
} as const;

function startObservingTransactions() {
  PCAppsFlyer.startObservingTransactions();
}

AppsFlyerPurchaseConnector.startObservingTransactions =
  startObservingTransactions;

function stopObservingTransactions() {
  PCAppsFlyer.stopObservingTransactions();
}

AppsFlyerPurchaseConnector.stopObservingTransactions =
  stopObservingTransactions;

// Purchase Connector Android methods
AppsFlyerPurchaseConnector.onSubscriptionValidationResultSuccess = (
  onSuccess
) => {
  if (typeof onSuccess !== "function") {
    throw new Error("onSuccess callback must be a function");
  }

  const subValidationSuccessListener =
  purchaseConnectorEventEmitter.addListener(
    AppsFlyerConstants.SUBSCRIPTION_VALIDATION_SUCCESS,
    (result: Record<string, any>) => {
      try {
        const parsedResults = Object.entries(result).reduce(
          (acc: Map<string, SubscriptionValidationResult>, [purchaseToken, validationResult]) => {
            acc.set(purchaseToken, SubscriptionValidationResult.fromJson(validationResult));
            return acc;
          },
          new Map<string, SubscriptionValidationResult>()
        );
        onSuccess(parsedResults);
      } catch (error) {
        console.error(
          "Failed to parse subscription validation results:",
          error
        );
      }
    }
  );

  return function remove() {
    subValidationSuccessListener.remove();
  };
};

AppsFlyerPurchaseConnector.onSubscriptionValidationResultFailure = (
  onFailure
) => {
  if (typeof onFailure !== "function") {
    throw new Error("onFailure callback must be a function");
  }

  const subValidationFailureListener =
    purchaseConnectorEventEmitter.addListener(
      AppsFlyerConstants.SUBSCRIPTION_VALIDATION_FAILURE,
      (result: any) => {
        try {
          const failureValidationResult =
            ValidationFailureData.fromJson(result);
          onFailure(failureValidationResult as any);
        } catch (error) {
          console.error(
            "Failed to handle subscription validation result:",
            error
          );
        }
      }
    );

  return function remove() {
    subValidationFailureListener.remove();
  };
};

AppsFlyerPurchaseConnector.onInAppValidationResultSuccess = (onSuccess) => {
  if (typeof onSuccess !== "function") {
    throw new Error("onSuccess callback must be a function");
  }

  const inAppValidationSuccessListener =
    purchaseConnectorEventEmitter.addListener(
      AppsFlyerConstants.IN_APP_PURCHASE_VALIDATION_SUCCESS,
      (result: Record<string, any>) => {
        try {
          const parsedResults = Object.entries(result).reduce(
            (acc: Map<string, InAppPurchaseValidationResult>, [purchaseToken, validationResult]) => {
              acc.set(purchaseToken, InAppPurchaseValidationResult.fromJson(validationResult));
              return acc;
            },
            new Map<string, InAppPurchaseValidationResult>()
          );
          onSuccess(parsedResults);
        } catch (error) {
          console.error(
            "Failed to handle in-app purchase validation results:",
            error
          );
        }
      }
    );

  return function remove() {
    inAppValidationSuccessListener.remove();
  };
};

AppsFlyerPurchaseConnector.onInAppValidationResultFailure = (onFailure) => {
  if (typeof onFailure !== "function") {
    throw new Error("onFailure callback must be a function");
  }

  const inAppValidationFailureListener =
    purchaseConnectorEventEmitter.addListener(
      AppsFlyerConstants.IN_APP_PURCHASE_VALIDATION_FAILURE,
      (result: any) => {
        try {
          const failureValidationResult =
            ValidationFailureData.fromJson(result);
          onFailure(failureValidationResult as any);
        } catch (error) {
          console.error(
            "Failed to handle in-app purchase validation result:",
            error
          );
        }
      }
    );

  return function remove() {
    inAppValidationFailureListener.remove();
  };
};

AppsFlyerPurchaseConnector.setSubscriptionPurchaseEventDataSource = (dataSource) => {
	if (!dataSource || typeof dataSource !== 'object') {
		throw new Error('dataSource must be an object');
	}
	PCAppsFlyer.setSubscriptionPurchaseEventDataSource(dataSource);
};

AppsFlyerPurchaseConnector.setInAppPurchaseEventDataSource = (dataSource) => {
	if (!dataSource || typeof dataSource !== 'object') {
		throw new Error('dataSource must be an object');
	}
	PCAppsFlyer.setInAppPurchaseEventDataSource(dataSource);
};

// Purchase Connector iOS methods
function logConsumableTransaction(transactionId: string) {
	PCAppsFlyer.logConsumableTransaction(transactionId);
}

AppsFlyerPurchaseConnector.logConsumableTransaction = logConsumableTransaction;

AppsFlyerPurchaseConnector.OnReceivePurchaseRevenueValidationInfo = (
  callback
) => {
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
        console.error(
          "Failed to handle iOS validation result:",
          error
        );
      }
    }
  );

  return function remove() {
    revenueValidationListener.remove();
  };
};

AppsFlyerPurchaseConnector.setPurchaseRevenueDataSource = (dataSource) => {
	if (!dataSource || typeof dataSource !== 'object') {
		throw new Error('dataSource must be an object');
	}
	PCAppsFlyer.setPurchaseRevenueDataSource(dataSource);
};

AppsFlyerPurchaseConnector.setPurchaseRevenueDataSourceStoreKit2 = (dataSource) => {
	if (!dataSource || typeof dataSource !== 'object') {
		throw new Error('dataSource must be an object');
	}
	PCAppsFlyer.setPurchaseRevenueDataSourceStoreKit2(dataSource);
};

export const AppsFlyerPurchaseConnectorConfig = {
  setConfig: ({ logSubscriptions, logInApps, sandbox, storeKitVersion }: PurchaseConnectorConfig): PurchaseConnectorConfig => {
    return {
      logSubscriptions,
      logInApps,
      sandbox,
      storeKitVersion: storeKitVersion || StoreKitVersion.SK1, // Default to SK1 if not provided
    };
  },
};

function create(config: PurchaseConnectorConfig) {
  if (!config) {
    throw new MissingConfigurationException();
  }
  PCAppsFlyer.create(config);
}

AppsFlyerPurchaseConnector.create = create;
export { AppsFlyerPurchaseConnector };

type RpcResponse =
  | { success: true; data: any }
  | { success: false; error: { code: number; message: string } };

// Encodes {method, params}, calls the TurboModule, decodes response. Rejects only on transport failure.
function dispatchRpc(method: string, params: unknown): Promise<RpcResponse> {
  const requestJson = JSON.stringify({ method, params });
  return NativeAppsFlyer.executeRpc(requestJson).then((responseJson: string) =>
    JSON.parse(responseJson)
  );
}

// Unwraps normalized { success, data|error } into resolve(data)/reject(error). Shared by callRpc
// and setUserFbLoginId, which bypasses callRpc's JSON.stringify to avoid Number()'s precision loss.
function unwrapRpcResponse(response: RpcResponse): any {
  if (!response.success) {
    const error = response.error;
    // ponytail: Android maps unknown-method to 422 with this message substring; normalize to 404
    // to match iOS's dedicated 404 per rpc-error-normalization-contract.md §FR-007 Decision —
    // remove when Android throws METHOD_NOT_FOUND (404) for real.
    if (
      error &&
      error.code === 422 &&
      typeof error.message === "string" &&
      error.message.indexOf("Unknown or missing method") !== -1
    ) {
      return Promise.reject({ code: 404, message: error.message });
    }
    return Promise.reject(error);
  }
  return response.data;
}

function callRpc(method: string, params: unknown = {}): Promise<any> {
  return dispatchRpc(method, params).then(unwrapRpcResponse);
}

// For void-returning config setters: fire the call, log instead of throwing on failure.
function callRpcVoid(method: string, params?: unknown): void {
  callRpc(method, params).catch((error) =>
    console.warn(`[AppsFlyer] ${method} failed:`, error)
  );
}

// Coerces a value to a string, falling back when null/undefined.
function toStringOrEmpty(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

// iOS wraps getter values in a keyed dict ({uid}, {version}), Android returns the bare value; `in` (not truthiness) so a falsy value like isSessionReady:false still unwraps.
function unwrapKeyed(data: any, key: string): any {
  return data && typeof data === "object" && key in data ? data[key] : data;
}

// devKey/appId only, positional — matches AFRPCInitRequest's real wire shape (see MIGRATION.md).
// appId is required on iOS, unused on Android.
appsFlyer.init = (devKey: string, appId?: string) => {
  if (typeof appId !== "string" && typeof appId !== "undefined") {
    return Promise.reject("appId should be a string!");
  }
  callRpcVoid("setPluginInfo", {
    plugin: NativeModules.ExponentConstants != null ? "expo" : "react_native",
    pluginVersion: require("./package.json").version,
  });
  return callRpc("init", { devKey, appId });
};

// Dedicated RPC call, separate from init (matches native SDK7 alignment).
appsFlyer.setIsDebug = (isDebug: boolean) => callRpcVoid("isDebug", { isDebug });

appsFlyer.logEvent = (eventName: string, eventValues: object, awaitResponse?: boolean) =>
  callRpc("logEvent", { eventName, eventValues, awaitResponse: !!awaitResponse });

export const MEDIATION_NETWORK = Object.freeze({
	IRONSOURCE : "ironsource",
	APPLOVIN_MAX : "applovin_max",
	GOOGLE_ADMOB : "google_admob",
	FYBER : "fyber",
	APPODEAL : "appodeal",
	ADMOST : "Admost",
	TOPON : "Topon",
	TRADPLUS : "Tradplus",
	YANDEX : "Yandex",
	CHARTBOOST : "chartboost",
	UNITY : "Unity",
	TOPON_PTE : "topon_pte",
	CUSTOM_MEDIATION : "custom_mediation",
	DIRECT_MONETIZATION_NETWORK : "direct_monetization_network"
});

export type MEDIATION_NETWORK = (typeof MEDIATION_NETWORK)[keyof typeof MEDIATION_NETWORK];

const MEDIATION_NETWORK_OVERRIDES: Record<string, { android?: string; ios?: string }> = {
  [MEDIATION_NETWORK.APPLOVIN_MAX]: { android: "applovinmax" },
  [MEDIATION_NETWORK.GOOGLE_ADMOB]: { android: "googleadmob" },
  [MEDIATION_NETWORK.TOPON_PTE]: { android: "toponpte" },
  [MEDIATION_NETWORK.CUSTOM_MEDIATION]: { android: "customMediation", ios: "custom" },
  [MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK]: {
    android: "directMonetizationNetwork",
    ios: "directmonetization",
  },
};

function resolveMediationNetworkWireValue(mediationNetwork: string | undefined): string | undefined {
  const override = mediationNetwork ? MEDIATION_NETWORK_OVERRIDES[mediationNetwork] : undefined;
  return (override && (override as any)[Platform.OS]) || mediationNetwork;
}

appsFlyer.logAdRevenue = (adRevenueData: AFAdRevenueData) => {
  callRpcVoid("logAdRevenue", {
    ...adRevenueData,
    mediationNetwork: resolveMediationNetworkWireValue(adRevenueData && adRevenueData.mediationNetwork),
  });
};

/**
 * Manually record the location of the user
 *
 * @param longitude latitude as double.
 * @param latitude latitude as double.
 */
appsFlyer.logLocation = (longitude: number | string, latitude: number | string) => {
  if (
    longitude == null ||
    latitude == null ||
    (longitude as any) == "" ||
    (latitude as any) == ""
  ) {
    console.log("longitude or latitude are missing!");
    return;
  }
  if (typeof longitude != "number" || typeof latitude != "number") {
    longitude = parseFloat(longitude as string);
    latitude = parseFloat(latitude as string);
  }
  callRpcVoid("logLocation", { longitude, latitude });
};

/**
 * Set the user's email address. Hashed by the native SDK before transmission.
 *
 * @param email the email address.
 */
appsFlyer.setUserEmail = (email: string) => callRpc("setUserEmail", { email: toStringOrEmpty(email) });

/**
 * Set additional data to be sent to AppsFlyer.
 *
 * @param additionalData additional data Dictionary.
 */
appsFlyer.setAdditionalData = (additionalData: object) => {
  callRpcVoid("setAdditionalData", { customData: additionalData });
};

/**
 * Get AppsFlyer's unique device ID is created for every new install of an app.
 */
appsFlyer.getAppsFlyerUID = () =>
  callRpc("getAppsFlyerUID", {}).then((data) => unwrapKeyed(data, "uid"));

appsFlyer.getSDKVersion = () =>
  callRpc("getSdkVersion", {}).then((data) => unwrapKeyed(data, "version"));

/**
 * Manually pass the Firebase / GCM Device Token for Uninstall measurement.
 *
 * @param token Firebase Device Token.
 */
appsFlyer.updateServerUninstallToken = (token: string) => {
  // iOS reads `deviceToken` (via registerUninstall), Android reads `token` — send both.
  const value = toStringOrEmpty(token);
  callRpcVoid("updateServerUninstallToken", { token: value, deviceToken: value });
};

/**
 * Setting your own customer ID enables you to cross-reference your own unique ID with AppsFlyer's unique ID and the other devices' IDs.
 * This ID is available in AppsFlyer CSV reports along with Postback APIs for cross-referencing with your internal IDs.
 *
 * @param userId Customer ID for client.
 */
appsFlyer.setCustomerUserId = (userId: string) => {
  callRpcVoid("setCustomerUserId", { customerId: toStringOrEmpty(userId) });
};

/**
 * Once this API is invoked, our SDK no longer communicates with our servers and stops functioning.
 * In some extreme cases you might want to shut down all SDK activity due to legal and privacy compliance.
 * This can be achieved with the stop API.
 *
 * @param isStopped boolean should SDK be stopped.
 */
appsFlyer.stop = (isStopped: boolean) => {
  // Wire param is `shouldStop` on both platforms; public JS arg name stays `isStopped` for compatibility.
  callRpcVoid("stop", { shouldStop: isStopped });
};

/**
 * Opt-out of collection of Android ID.
 * If the app does NOT contain Google Play Services, Android ID is collected by the SDK.
 * However, apps with Google play services should avoid Android ID collection as this is in violation of the Google Play policy.
 *
 * @param isCollect boolean, false to opt out.
 * @platform android
 */
appsFlyer.setCollectAndroidID = (isCollect: boolean) => {
  callRpcVoid("setCollectAndroidID", { isCollect });
};

/**
 * Set the OneLink ID that should be used for User-Invite-API.
 * The link that is generated for the user invite will use this OneLink as the base link.
 *
 * @param oneLinkID OneLink ID obtained from the AppsFlyer Dashboard.
 */
appsFlyer.setAppInviteOneLinkID = (oneLinkID: string) => {
  callRpcVoid("setAppInviteOneLink", { oneLinkId: toStringOrEmpty(oneLinkID) });
};

/**
 * The LinkGenerator class builds the invite URL according to various setter methods which allow passing on additional information on the click.
 * @see https://support.appsflyer.com/hc/en-us/articles/115004480866-User-invite-attribution-
 *
 * @param parameters Dictionary.
 */
appsFlyer.generateInviteLink = (parameters: GenerateInviteLinkParams = {} as GenerateInviteLinkParams) => {
  // customerID → both referrerCustomerId (iOS) and customerId (Android); deeplinkPath has no native counterpart.
  const { customerID, baseDeeplink, deeplinkPath, ...rest } = parameters;
  if (deeplinkPath !== undefined) {
    console.warn(
      "[AppsFlyer] generateInviteLink: `deeplinkPath` is not supported by the native SDK and is ignored."
    );
  }
  const payload: Record<string, unknown> = { ...rest };
  if (customerID !== undefined) {
    payload.referrerCustomerId = customerID;
    payload.customerId = customerID;
  }
  if (baseDeeplink !== undefined) {
    payload.baseDeepLink = baseDeeplink;
  }
  return callRpc("generateInviteLink", payload);
};

/**
 * Log a user invite event.
 * @param channel the channel through which the invite was sent (optional).
 * @param eventParameters additional event parameters (optional).
 */
appsFlyer.logInvite = (channel?: string, eventParameters?: object) => {
  callRpcVoid("logInvite", { channel, eventParameters });
};

/**
 * To attribute an impression use the following API call.
 * Make sure to use the promoted App ID as it appears within the AppsFlyer dashboard.
 *
 * @param appId promoted App ID.
 * @param campaign cross promotion campaign.
 * @param parameters additional params to be added to the attribution link
 */
appsFlyer.logCrossPromotionImpression = (appId: string, campaign: string, parameters: object) => {
  if (appId == null || appId == "") {
    console.log("appid is missing!");
    return;
  }
  callRpcVoid("logCrossPromoteImpression", {
    appId: toStringOrEmpty(appId),
    campaign: toStringOrEmpty(campaign),
    userParams: parameters,
  });
};

/**
 * Use the following API to attribute the click and launch the app store's app page.
 *
 * @param appId promoted App ID.
 * @param campaign cross promotion campaign.
 * @param params additional user params.
 */
appsFlyer.logCrossPromotionAndOpenStore = (appId: string, campaign: string, params: object) => {
  if (appId == null || appId == "") {
    console.log("appid is missing!");
    return;
  }
  // `promotedAppId`, not `appId` — differs from logCrossPromoteImpression on both platforms.
  callRpcVoid("logAndOpenStore", {
    promotedAppId: toStringOrEmpty(appId),
    campaign: toStringOrEmpty(campaign),
    userParams: params,
  });
};

/**
 * Setting user local currency code for in-app purchases.
 * The currency code should be a 3 character ISO 4217 code. (default is USD).
 * You can set the currency code for all events by calling the following method.
 * @param currencyCode
 */
appsFlyer.setCurrencyCode = (currencyCode: string) => {
  if (currencyCode == null || currencyCode == "") {
    console.log("currencyCode is missing!");
    return;
  }
  callRpcVoid("setCurrencyCode", { currencyCode: toStringOrEmpty(currencyCode) });
};

// Both platforms emit one shared event; this block demuxes the envelope onto public listener APIs.
const RPC_EVENT_NAME = "RNAppsFlyer_rpcEvent";

// Maps native event name → JS listener bucket (iOS uses onDeepLinkReceived, Android uses onDeepLinking).
const RPC_EVENT_DEMUX: Record<string, string> = {
  onConversionDataSuccess: "onInstallConversionData",
  onConversionDataFail: "onInstallConversionFailure",
  onDeepLinkReceived: "onDeepLink",
  onDeepLinking: "onDeepLink",
  onSessionReady: "onSessionReady",
};

const rpcListenerBuckets: Record<string, Array<(data: any) => void>> = {
  onInstallConversionData: [],
  onInstallConversionFailure: [],
  onDeepLink: [],
  onSessionReady: [],
};

// Android historically sends stringified JSON where iOS sends an object — normalize defensively.
function normalizeRpcEventData(rawData: unknown): any {
  if (typeof rawData !== "string") {
    return rawData;
  }
  try {
    return JSON.parse(rawData);
  } catch (_error) {
    return new AFParseJSONException("Invalid data structure", rawData);
  }
}

let rpcEventSubscription: ReturnType<typeof appsFlyerEventEmitter.addListener> | null = null;
function ensureRpcEventSubscription() {
  if (rpcEventSubscription) {
    return;
  }
  rpcEventSubscription = appsFlyerEventEmitter.addListener(
    RPC_EVENT_NAME,
    (envelopeRaw: unknown) => {
      let envelope: any;
      try {
        envelope =
          typeof envelopeRaw === "string" ? JSON.parse(envelopeRaw) : envelopeRaw;
      } catch (error) {
        console.error(
          "AppsFlyer: failed to parse native RPC event envelope",
          error
        );
        return;
      }
      const bucket = envelope && RPC_EVENT_DEMUX[envelope.event];
      if (!bucket) {
        return; // unmapped/forward-compatible native event -- not this release's concern
      }
      const data = normalizeRpcEventData(envelope.data);
      rpcListenerBuckets[bucket].forEach((callback) => {
        if (typeof callback === "function") {
          callback(data);
        }
      });
    }
  );
}

// Fires the register*Listener RPC on first attach only; subsequent attaches are no-ops.
// Calls made before init resolves are buffered natively and flushed after init completes.
function onceRegistrar(method: string) {
  let requested = false;
  const ensure = () => {
    if (requested) {
      return;
    }
    requested = true;
    callRpc(method, {}).catch((error) =>
      console.error(`AppsFlyer: ${method} RPC failed`, error)
    );
  };
  ensure.reset = () => {
    requested = false;
  };
  return ensure;
}

const ensureConversionListenerRegistered = onceRegistrar("registerConversionListener");
const ensureDeepLinkListenerRegistered = onceRegistrar("registerDeeplinkListener");
const ensureSessionReadyListenerRegistered = onceRegistrar("registerSessionReadyListener");

// Shared shape for onInstallConversionData/onInstallConversionFailure/onDeepLink: subscribe to
// the demuxed event bucket, request native registration once, return an unsubscribe function.
function createBucketListener(bucket: string, ensureRegistered: () => void) {
  return (callback: (data: any) => void) => {
    ensureRpcEventSubscription();
    ensureRegistered();
    rpcListenerBuckets[bucket].push(callback);
    return function remove() {
      rpcListenerBuckets[bucket] = rpcListenerBuckets[bucket].filter(
        (registered) => registered !== callback
      );
    };
  };
}

/**
 * Access AppsFlyer attribution/conversion data (deferred deep linking).
 * @param callback receives the raw conversion data dict flat (`is_first_launch`, `media_source`,
 *   `campaign`, `af_status`, custom params like `af_dp`/`deep_link_value`, ...) — no wrapper object.
 * @returns call to unregister the listener (e.g. from componentWillUnmount).
 */
appsFlyer.onInstallConversionData = createBucketListener(
  "onInstallConversionData",
  ensureConversionListenerRegistered
);

appsFlyer.onInstallConversionFailure = createBucketListener(
  "onInstallConversionFailure",
  ensureConversionListenerRegistered
);

/**
 * Access unified deep link data (direct + deferred deep linking).
 * @param callback receives `{status, deepLink?, error?}` — see `UnifiedDeepLinkData`.
 * @returns call to unregister the listener (e.g. from componentWillUnmount).
 */
appsFlyer.onDeepLink = createBucketListener("onDeepLink", ensureDeepLinkListenerRegistered);

/**
 * Fires once the native SDK's session becomes ready to serve attribution / deep-link data.
 * Both platforms emit a real `onSessionReady` event once registered — this was previously
 * silently dropped (no bucket wired for it). Net-new in 7.0.0 — no 6.x equivalent.
 * @param callback invoked with no arguments when the session becomes ready.
 * @returns call to unregister the listener (e.g. from componentWillUnmount).
 */
appsFlyer.registerSessionReadyListener = createBucketListener(
  "onSessionReady",
  ensureSessionReadyListenerRegistered
);

/**
 * Query whether the native SDK's session is ready to serve attribution / deep-link data.
 * Net-new in 7.0.0 — no 6.x equivalent.
 */
appsFlyer.isSessionReady = () =>
  callRpc("isSessionReady", {}).then((data) =>
    Boolean(unwrapKeyed(data, "isSessionReady"))
  );

/**
 * Remove a previously registered session-ready listener.
 * Net-new in 7.0.0 — no 6.x equivalent.
 */
appsFlyer.unregisterSessionReadyListener = () => {
  ensureSessionReadyListenerRegistered.reset();
  rpcListenerBuckets.onSessionReady = [];
  callRpcVoid("unregisterSessionReadyListener", {});
};

// Maps Android's AFPurchaseType spelling to the camelCase form iOS's purchaseTypeMapping requires.
const IOS_PURCHASE_TYPES: Record<string, string> = Object.freeze({
  one_time_purchase: "oneTimePurchase",
  subscription: "subscription",
});

/**
 * validateAndLogInAppPurchase API with AFPurchaseDetails support.
 *
 * @remarks The `callback` param is currently inert: neither native side emits a
 *   validation-result event through the single RPC channel (bridge-patterns.md §3), so there is
 *   nothing to deliver it. A prior version of this method subscribed to a raw `"onValidationResult"`
 *   event name that no native code ever emitted — under New Architecture, RCTEventEmitter crashes
 *   on `addListener` for any event outside the module's declared `supportedEvents`, so every call
 *   to this method crashed the host app. Wiring a real result event requires native emission work
 *   on both platforms; until then this only dispatches the RPC (see the 401/500 you get back if
 *   the app isn't registered for purchase validation — that's an expected server-side response,
 *   not a bridge failure).
 */
appsFlyer.validateAndLogInAppPurchase = (
  purchaseDetails: AFPurchaseDetails,
  additionalParameters?: { [key: string]: any },
  _callback?: (data: any) => void
) => {
  // iOS wants nested {product:{productId}, transaction:{transactionId, purchaseType}}; Android
  // wants flat {productId, purchaseToken, purchaseType} (purchaseToken == transactionId). Send
  // the union — each side reads its own keys and its own purchaseType spelling (IOS_PURCHASE_TYPES).
  const { productId, transactionId, purchaseType } = purchaseDetails || ({} as AFPurchaseDetails);
  callRpcVoid("validateAndLogInAppPurchase", {
    product: { productId },
    transaction: {
      transactionId,
      purchaseType: IOS_PURCHASE_TYPES[purchaseType] || purchaseType,
    },
    productId,
    purchaseToken: transactionId,
    purchaseType,
    additionalParameters,
  });

  // No-op: kept for signature compatibility with callers that unregister in componentWillUnmount().
  return function remove() {};
};

/**
 * Anonymize user Data.
 * Use this API during the SDK Initialization to explicitly anonymize a user's installs, events and sessions.
 * Default is false
 * @param shouldAnonymize boolean
 */
appsFlyer.anonymizeUser = (shouldAnonymize: boolean) => {
  callRpcVoid("anonymizeUser", { shouldAnonymize });
};

/**
 * Set Onelink custom/branded domains
 * Use this API during the SDK Initialization to indicate branded domains.
 * For more information please refer to https://support.appsflyer.com/hc/en-us/articles/360002329137-Implementing-Branded-Links
 * @param domains array of strings
 */
appsFlyer.setOneLinkCustomDomains = (domains: string[]) => callRpc("setOneLinkCustomDomain", { domains });

/**
 * Set domains used by ESP when wrapping your deeplinks.
 * Use this API during the SDK Initialization to indicate that links from certain domains should be resolved
 * in order to get original deeplink
 * For more information please refer to https://support.appsflyer.com/hc/en-us/articles/360001409618-Email-service-provider-challenges-with-iOS-Universal-links
 * @param urls array of strings
 */
appsFlyer.setResolveDeepLinkURLs = (urls: string[]) => callRpc("setResolveDeepLinkURLs", { urls });

/**
 * Disables IDFA collection in iOS and Advertising ID in Android
 * @param isDisable Flag to disable/enable IDFA collection
 */
appsFlyer.disableAdvertisingIdentifier = (isDisable: boolean) => {
  // Divergent key names for the same flag: iOS reads `disable`, Android reads `isDisable`.
  callRpcVoid("setDisableAdvertisingIdentifiers", {
    isDisable,
    disable: isDisable,
  });
};

/**
 * Disables app vendor identifier (IDFV) collection in iOS
 * @param shouldDisable Flag to disable/enable IDFA collection
 * @platform ios
 */
appsFlyer.disableIDFVCollection = (shouldDisable: boolean) => {
  callRpcVoid("setDisableIDFVCollection", { disable: shouldDisable });
};

/**
 * Disables Apple Search Ads collecting
 * @param shouldDisable Flag to disable/enable Apple Search Ads data collection
 * @platform ios
 */
appsFlyer.disableCollectASA = (shouldDisable: boolean) => {
  callRpcVoid("setDisableCollectASA", { disable: shouldDisable });
};

// Export AFPurchaseType enum for the new validateAndLogInAppPurchase API
export const AFPurchaseType = {
  SUBSCRIPTION: "subscription",
  ONE_TIME_PURCHASE: "one_time_purchase",
} as const;

export type AFPurchaseType = (typeof AFPurchaseType)[keyof typeof AFPurchaseType];

// Pre-7.0.0 these were exposed via the legacy native module's getConstants(); the TurboModule
// spec has no equivalent, so they're plain JS constants now, under the same names. Values
// confirmed against the vendored native SDK's AFInAppEventType interface.
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

/**
 * Use the sandbox receipt-validation endpoint for in-app purchase validation.
 * @param isSandbox
 * @platform ios
 */
appsFlyer.setUseReceiptValidationSandbox = (isSandbox: boolean) => {
  callRpcVoid("setUseReceiptValidationSandbox", { sandbox: isSandbox });
};

/**
 *
 *Push-notification campaigns are used to create fast re-engagements with existing users.
 *AppsFlyer supplies an open-for-all solution, that enables measuring the success of push-notification campaigns, for both iOS and Android platforms.
 * Learn more - https://support.appsflyer.com/hc/en-us/articles/207364076-Measuring-Push-Notification-Re-Engagement-Campaigns
 * @param pushPayload
 */
appsFlyer.sendPushNotificationData = (
  pushPayload: object,
  androidCampaignData: {
    campaign?: string;
    pid?: string;
    isRetargeting?: boolean;
    additionalParameters?: Record<string, unknown>;
  } | null = null
) => {
  // Note: on Android this triggers an extra Launch event even mid-session — inherited native SDK behavior.
  // iOS locates the `af` block in the raw payload itself; Android SDK7 dropped raw-payload
  // support and needs campaign/pid/isRetargeting supplied explicitly by the caller instead.
  const { campaign, pid, isRetargeting, additionalParameters } =
    androidCampaignData || ({} as NonNullable<typeof androidCampaignData>);
  if (!androidCampaignData) {
    console.warn(
      "[AppsFlyer] sendPushNotificationData: no androidCampaignData supplied — Android " +
        "requires explicit {campaign, pid, isRetargeting} and will report an empty " +
        "re-engagement without it. iOS is unaffected."
    );
  }
  callRpcVoid("sendPushNotificationData", {
    pushPayload,
    campaign: toStringOrEmpty(campaign),
    pid: toStringOrEmpty(pid),
    isRetargeting: !!isRetargeting,
    additionalParameters,
  });
};

/**
 * Set a custom host
 * @param hostPrefix
 * @param hostName
 */
appsFlyer.setHost = (hostPrefix: string, hostName: string) => {
  // Breaking: SDK7 renamed/reordered these into {hostPrefixName, hostName} — see MIGRATION.md.
  callRpcVoid("setHost", { hostPrefixName: hostPrefix, hostName });
};

/**
 * The addPushNotificationDeepLinkPath method provides app owners with a flexible interface for configuring how deep links are extracted from push notification payloads.
 * for more information: https://support.appsflyer.com/hc/en-us/articles/207032126-Android-SDK-integration-for-developers#core-apis-65-configure-push-notification-deep-link-resolution
 * @param path an array of string that represents the path
 */
appsFlyer.addPushNotificationDeepLinkPath = (path: string[]) =>
  callRpc("addPushNotificationDeepLinkPath", { deepLinkPath: path });

/**
 * enable or disable SKAD support. set True if you want to disable it!
 * @param disableSkad
 * @platform ios
 */
appsFlyer.disableSKAD = (disableSkad: boolean) => {
  callRpcVoid("setDisableSKAdNetwork", { disable: disableSkad });
};

/**
 * Set the language of the device. The data will be displayed in Raw Data Reports
 * @param language
 * @platform ios
 */
appsFlyer.setCurrentDeviceLanguage = (language: string) => {
  if (typeof language === "string") {
    callRpcVoid("setCurrentDeviceLanguage", { language });
  }
};

/**
 *  Used by advertisers to exclude specified networks/integrated partners from getting data.
 */
appsFlyer.setSharingFilterForPartners = (partners: string[]) => {
  callRpcVoid("setSharingFilterForPartners", { partners });
};
/**
 * Allows sending custom data for partner integration purposes.
 * @param partnerId ID of the partner (usually suffixed with "_int").
 * @param partnerData Customer data, depends on the integration configuration with the specific partner.
 */
appsFlyer.setPartnerData = (partnerId: string, partnerData: object) => {
  if (typeof partnerId === "string" && typeof partnerData === "object") {
    callRpcVoid("setPartnerData", { partnerId, data: partnerData });
  }
};

/**
 * Matches URLs that contain contains as a substring and appends query parameters to them. In case the URL does not match, parameters are not appended to it.
 * @param contains The string to check in URL.
 * @param parameters Parameters to append to the deeplink url after it passed validation.
 */
appsFlyer.appendParametersToDeepLinkingURL = (contains: string, parameters: object) => {
  if (typeof contains === "string" && typeof parameters === "object") {
    callRpcVoid("appendParametersToDeepLinkingURL", { contains, parameters });
  }
};

/**
 * Disable the SDK's network data collection.
 * @param disable
 * @platform android
 */
appsFlyer.setDisableNetworkData = (disable: boolean) => {
  callRpcVoid("setDisableNetworkData", { isDisable: disable });
};

// Now returns a Promise (it didn't pre-7.0.0) — callers that ignored the return value are
// unaffected; callers may now await/.then() it if they choose.
appsFlyer.start = () => callRpc("start", { awaitResponse: true });

/**
 * Re-run deep link resolution for a URL.
 * @param url the deep link URL to resolve.
 * @param shouldTriggerSession whether resolution should also start a session.
 * @platform android
 */
appsFlyer.performOnDeepLinking = (url: string, shouldTriggerSession = false) => {
  // Native reads {url, shouldTriggerSession}; the old no-arg form resolved the empty string.
  callRpcVoid("performDeepLinking", {
    url: toStringOrEmpty(url),
    shouldTriggerSession,
  });
};

/**
 * Disable the collection of AppSet ID.
 * This method is only relevant for Android platform.
 */
appsFlyer.disableAppSetId = () => {
  callRpcVoid("disableAppSetId", {});
};

/**
 * instruct the SDK to collect the TCF data from the device.
 * @param enabled if the sdk should collect the TCF data. true/false
 */
appsFlyer.enableTCFDataCollection = (enabled: boolean) => {
  callRpcVoid("enableTCFDataCollection", { shouldCollect: enabled });
};

/**
 * If your app does not use a CMP compatible with TCF v2.2, use the SDK API detailed below to provide the consent data directly to the SDK.
 * @param consentData AppsFlyerConsent object.
 */
appsFlyer.setConsentData = (consentData: AppsFlyerConsent) => {
  callRpcVoid("setConsentData", consentData);
};

class AFParseJSONException extends Error {
  data: unknown;
  constructor(message: string, data: unknown) {
    super(message);
    this.name = "AFParseJSONException";
    this.data = data;
  }
}

export { AFParseJSONException };

export class AppsFlyerConsent {
    isUserSubjectToGDPR?: boolean;
    hasConsentForDataUsage?: boolean;
    hasConsentForAdsPersonalization?: boolean;
    hasConsentForAdStorage?: boolean;

    /**
     * Creates an instance of AppsFlyerConsent.
     * @param isUserSubjectToGDPR - Indicates whether GDPR applies to the user.
     * @param hasConsentForDataUsage - Indicates whether the user has consented to data usage.
     * @param hasConsentForAdsPersonalization - Indicates whether the user has consented to ads personalization.
     * @param hasConsentForAdStorage - Indicates whether the user has consented to ad storage.
     */
    constructor(
        isUserSubjectToGDPR?: boolean,
        hasConsentForDataUsage?: boolean,
        hasConsentForAdsPersonalization?: boolean,
        hasConsentForAdStorage?: boolean
    ) {
        this.isUserSubjectToGDPR = isUserSubjectToGDPR;
        this.hasConsentForDataUsage = hasConsentForDataUsage;
        this.hasConsentForAdsPersonalization = hasConsentForAdsPersonalization;
        this.hasConsentForAdStorage = hasConsentForAdStorage;
    }
}

// --- Complex config ---

/**
 * Set the minimum time that must elapse between app launches for a new session to be
 * counted.
 * @param seconds minimum number of seconds between sessions.
 */
appsFlyer.setMinTimeBetweenSessions = (seconds: number) =>
  callRpc("setMinTimeBetweenSessions", { seconds });

/**
 * Override the AppsFlyer-generated install ID with a custom identifier.
 * @param installId custom install ID.
 */
appsFlyer.setInstallId = (installId: string) => callRpc("setInstallId", { installId });

/**
 * Set how long the SDK waits to resolve a deep link before giving up.
 * @param timeout deep link resolution timeout, in milliseconds.
 * @remarks Param units (milliseconds) follow the native SDK's documented convention but
 *   are not independently confirmed against live native source — verify before relying on it.
 */
appsFlyer.setDeepLinkTimeout = (timeout: number) =>
  callRpc("setDeepLinkTimeout", { timeout });

// --- Deep-link ---

/**
 * Enable or disable resolution of Facebook deferred app links.
 * @param isEnabled
 */
appsFlyer.enableFacebookDeferredApplinks = (isEnabled: boolean) =>
  callRpc("enableFacebookDeferredApplinks", { isEnabled });

/**
 * Explicitly resolve a Facebook deferred app link from the app's `open(url:options:)`
 * payload.
 * @param options iOS open-URL options dictionary containing the Facebook
 *   app link data.
 * @platform ios
 * @remarks Best-effort passthrough — param shape not confirmed against live native source.
 */
appsFlyer.setFacebookDeferredAppLink = (options: Record<string, unknown> = {}) =>
  callRpc("setFacebookDeferredAppLink", options);

// --- Hashed PII (hashed by the native SDK before transmission) ---

/**
 * Native reads a split country code + number, never a single combined `phone` string.
 * @param countryCode e.g. "1" or "+1".
 * @param phoneNumber the subscriber number, without the country code.
 */
appsFlyer.setUserPhone = (countryCode: string, phoneNumber: string) =>
  callRpc("setUserPhone", {
    countryCode: toStringOrEmpty(countryCode),
    phoneNumber: toStringOrEmpty(phoneNumber),
  });

/** @param firstName */
appsFlyer.setUserFirstName = (firstName: string) =>
  callRpc("setUserFirstName", { firstName });

/** @param lastName */
appsFlyer.setUserLastName = (lastName: string) =>
  callRpc("setUserLastName", { lastName });

/**
 * @param fbLoginId numeric Facebook login ID (commonly 15-18 digits). iOS
 *   requires a JSON number (`requireInt64`), but a JS `Number` only safely holds integers up to
 *   2^53 — `Number(fbLoginId)` silently rounds longer IDs (e.g. "100003456789012345" ->
 *   100003456789012350) before it ever reaches JSON.stringify. The validated digits are spliced
 *   into the request body directly instead, so the exact value reaches native on both platforms.
 */
appsFlyer.setUserFbLoginId = (fbLoginId: string | number) => {
  const digits = String(fbLoginId).trim();
  if (!/^-?\d+$/.test(digits)) {
    return Promise.reject(new TypeError("setUserFbLoginId: fbLoginId must be an integer"));
  }
  return NativeAppsFlyer.executeRpc(
    `{"method":"setUserFbLoginId","params":{"fbLoginId":${digits}}}`
  ).then((responseJson: string) => unwrapRpcResponse(JSON.parse(responseJson)));
};

/** Clear all previously set hashed PII (phone, first/last name, Facebook login ID, emails). */
appsFlyer.clearUserPii = () => callRpc("clearUserPii");

// --- Android-only ---

/**
 * @platform android
 */
appsFlyer.getHostName = () => callRpc("getHostName");

/**
 * @platform android
 */
appsFlyer.getHostPrefix = () => callRpc("getHostPrefix");

/**
 * @platform android
 */
appsFlyer.getOutOfStore = () => callRpc("getOutOfStore");

/**
 * @platform android
 */
appsFlyer.getAttributionId = () => callRpc("getAttributionId");

/**
 * @platform android
 */
appsFlyer.isStopped = () => callRpc("isStopped");

/**
 * @platform android
 */
appsFlyer.isPreInstalledApp = () => callRpc("isPreInstalledApp");

/**
 * Report an out-of-store source (e.g. an alternative app store) for attribution.
 * @param sourceName
 * @platform android
 */
appsFlyer.setOutOfStore = (sourceName: string) =>
  callRpc("setOutOfStore", { sourceName });

/**
 * Set the native SDK's log verbosity.
 * @param logLevel one of the native SDK's log level names (e.g. "NONE",
 *   "DEBUG", "VERBOSE").
 * @platform android
 */
appsFlyer.setLogLevel = (logLevel: string) => callRpc("setLogLevel", { logLevel });

/**
 * Mark the current install as an update rather than a fresh install (testing aid).
 * @param isUpdate
 * @platform android
 */
appsFlyer.setIsUpdate = (isUpdate: boolean) => callRpc("setIsUpdate", { isUpdate });

/**
 * Override the app ID reported to AppsFlyer (for apps whose package name differs from
 * their store listing ID).
 * @param appId
 * @platform android
 */
appsFlyer.setAppId = (appId: string) => callRpc("setAppId", { appId });

/**
 * Report pre-install attribution for apps bundled directly onto a device (OEM deals).
 * @param mediaSource
 * @param campaign
 * @param siteId
 * @platform android
 */
appsFlyer.setPreinstallAttribution = (mediaSource: string, campaign: string, siteId: string) =>
  callRpc("setPreinstallAttribution", { mediaSource, campaign, siteId });

/**
 * Explicitly log a new session.
 * @platform android
 */
appsFlyer.logSession = () => callRpc("logSession");

/**
 * Forward the host Activity's `onPause` lifecycle event to the SDK.
 * @platform android
 */
appsFlyer.onPause = () => callRpc("onPause");

export interface AppsFlyerApi {
  onInstallConversionData(callback: (data: ConversionData) => any): () => void;
  onInstallConversionFailure(callback: (data: ConversionData) => any): () => void;
  onDeepLink(callback: (data: UnifiedDeepLinkData) => any): () => void;
  /**
   * Fires once the native SDK's session becomes ready to serve attribution/deep-link data.
   * Net-new in 7.0.0 -- see MIGRATION.md.
   */
  registerSessionReadyListener(callback: () => void): () => void;
  /**
   * Query whether the native SDK's session is ready to serve attribution/deep-link data.
   * Net-new in 7.0.0 -- see MIGRATION.md.
   */
  isSessionReady(): Promise<boolean>;
  /**
   * Remove a previously registered session-ready listener.
   * Net-new in 7.0.0 -- see MIGRATION.md.
   */
  unregisterSessionReadyListener(): void;
  /**
   * Set the native SDK's debug logging flag. A dedicated RPC call, separate from `init`.
   */
  setIsDebug(isDebug: boolean): void;
  /**
   * Initialize the SDK with the dev key (and appId, required on iOS).
   */
  init(devKey: string, appId?: string): Promise<string>;
  /**
   * By default (`awaitResponse` omitted or `false`), resolves once the SDK accepts the
   * event onto its internal queue — not once it's delivered to AppsFlyer's server.
   * Delivery is fire-and-forget; use the native SDK's own debug logs to verify server
   * receipt if needed.
   *
   * Pass `awaitResponse: true` to instead wait for the native SDK's own completion
   * handler (round-trips to AppsFlyer's server) — use when the caller needs to know the
   * event actually reached the server, e.g. to observe `isStopped`-suppression behavior.
   */
  logEvent(
    eventName: string,
    eventValues: object,
    awaitResponse?: boolean
  ): Promise<string>;
  /** Set the user's email address. Hashed by the native SDK before transmission. */
  setUserEmail(email: string): Promise<unknown>;
  setAdditionalData(additionalData: object): void;
  getAppsFlyerUID(): Promise<string>;
  getSDKVersion(): Promise<string>;
  setCustomerUserId(userId: string): void;
  stop(isStopped: boolean): void;
  setAppInviteOneLinkID(oneLinkID: string): void;
  generateInviteLink(params?: GenerateInviteLinkParams): Promise<unknown>;
  logInvite(channel?: string, eventParameters?: object): void;
  logCrossPromotionImpression(
    appId: string,
    campaign: string,
    parameters: object
  ): void;
  logCrossPromotionAndOpenStore(
    appId: string,
    campaign: string,
    params: object
  ): void;
  setCurrencyCode(currencyCode: string): void;
  anonymizeUser(shouldAnonymize: boolean): void;
  setOneLinkCustomDomains(domains: string[]): Promise<unknown>;
  setResolveDeepLinkURLs(urls: string[]): Promise<unknown>;
  logLocation(longitude: number | string, latitude: number | string): void;
  /**
   * validateAndLogInAppPurchase API with AFPurchaseDetails.
   * @remarks `callback` is currently inert — no native event delivers a validation result yet
   *   (see index.ts's remarks on this method). A 401/500 response after calling this is an
   *   expected server-side rejection when the app isn't registered for purchase validation.
   */
  validateAndLogInAppPurchase(
    purchaseDetails: AFPurchaseDetails,
    additionalParameters?: { [key: string]: any },
    callback?: (data: any) => void
  ): () => void;

  updateServerUninstallToken(token: string): void;
  /**
   * @param pushPayload the raw remote-notification payload — iOS locates the `af` block itself.
   * @param androidCampaignData required on Android (SDK7 dropped raw-payload support there); omitting it reports an empty re-engagement.
   */
  sendPushNotificationData(
    pushPayload: object,
    androidCampaignData?: {
      campaign?: string;
      pid?: string;
      isRetargeting?: boolean;
      additionalParameters?: Record<string, unknown>;
    } | null
  ): void;
  setHost(hostPrefix: string, hostName: string): void;
  addPushNotificationDeepLinkPath(path: string[]): Promise<unknown>;
  disableAdvertisingIdentifier(isDisable: boolean): void;
  setSharingFilterForPartners(partners: string[]): void;
  setPartnerData(partnerId: string, partnerData: object): void;
  appendParametersToDeepLinkingURL(
    contains: string,
    parameters: object
  ): void;
  start(): Promise<string>;
  enableTCFDataCollection(enabled: boolean): void;
  setConsentData(consentData: AppsFlyerConsent): void;
  logAdRevenue(adRevenueData: AFAdRevenueData): void;
  /**
   * For iOS Only
   * */
  disableCollectASA(shouldDisable: boolean): void;
  setUseReceiptValidationSandbox(isSandbox: boolean): void;
  disableSKAD(disableSkad: boolean): void;
  setCurrentDeviceLanguage(language: string): void;
  disableIDFVCollection(shouldDisable: boolean): void;

  /**
   * For Android Only
   * */
  setCollectAndroidID(isCollect: boolean): void;
  setDisableNetworkData(disable: boolean): void;
  performOnDeepLinking(url: string, shouldTriggerSession?: boolean): void;
  disableAppSetId(): void;

  // --- Complex config (net-new) ---

  /** Minimum number of seconds that must elapse between sessions for a new one to count. */
  setMinTimeBetweenSessions(seconds: number): Promise<void>;
  /** Override the AppsFlyer-generated install ID with a custom identifier. */
  setInstallId(installId: string): Promise<void>;
  /**
   * Deep link resolution timeout, in milliseconds.
   * @remarks Param key/units inferred from native SDK convention, not independently
   * confirmed against live native source for this plugin version.
   */
  setDeepLinkTimeout(timeout: number): Promise<void>;

  // --- Deep-link (net-new) ---

  /** Enable or disable resolution of Facebook deferred app links. */
  enableFacebookDeferredApplinks(isEnabled: boolean): Promise<void>;
  /**
   * Explicitly resolve a Facebook deferred app link from the app's `open(url:options:)` payload.
   * @platform ios
   * @remarks Param shape is a best-effort passthrough, not confirmed against live
   * native source — not present in the Android RPC contract at all.
   */
  setFacebookDeferredAppLink(options?: Record<string, unknown>): Promise<void>;

  // --- Hashed PII (net-new) ---

  /**
   * Set the user's phone number. Hashed by the native SDK before transmission.
   * Native reads a split country code + number, never a single combined string.
   */
  setUserPhone(countryCode: string, phoneNumber: string): Promise<void>;
  /** Set the user's first name. Hashed by the native SDK before transmission. */
  setUserFirstName(firstName: string): Promise<void>;
  /** Set the user's last name. Hashed by the native SDK before transmission. */
  setUserLastName(lastName: string): Promise<void>;
  /**
   * Set the user's Facebook login ID. Hashed by the native SDK before transmission.
   * Must be numeric — iOS parses it with `requireInt64` and rejects a JSON string.
   */
  setUserFbLoginId(fbLoginId: string | number): Promise<void>;
  /** Clear all previously set hashed PII (phone, first/last name, Facebook login ID, emails). */
  clearUserPii(): Promise<void>;

  // --- Android-only (net-new) ---

  /** @platform android */
  getHostName(): Promise<string>;
  /** @platform android */
  getHostPrefix(): Promise<string>;
  /** @platform android */
  getOutOfStore(): Promise<string>;
  /** @platform android */
  getAttributionId(): Promise<string>;
  /** @platform android */
  isStopped(): Promise<boolean>;
  /** @platform android */
  isPreInstalledApp(): Promise<boolean>;
  /** @platform android */
  setOutOfStore(sourceName: string): Promise<void>;
  /**
   * @platform android
   * @param logLevel one of the native SDK's log level names (e.g. "NONE", "DEBUG", "VERBOSE").
   */
  setLogLevel(logLevel: string): Promise<void>;
  /** @platform android */
  setIsUpdate(isUpdate: boolean): Promise<void>;
  /** @platform android */
  setAppId(appId: string): Promise<void>;
  /**
   * Report pre-install attribution for apps bundled directly onto a device (OEM deals).
   * @platform android
   */
  setPreinstallAttribution(
    mediaSource: string,
    campaign: string,
    siteId: string
  ): Promise<void>;
  /** @platform android */
  logSession(): Promise<void>;
  /** @platform android */
  onPause(): Promise<void>;
}

export default appsFlyer;
