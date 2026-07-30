import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import NativeAppsFlyer from "./src/NativeAppsFlyer";
import AppsFlyerConstants from "./PurchaseConnector/constants/constants";
import InAppPurchaseValidationResult from "./PurchaseConnector/models/in_app_purchase_validation_result";
import ValidationFailureData from "./PurchaseConnector/models/validation_failure_data";
import SubscriptionValidationResult from "./PurchaseConnector/models/subscription_validation_result";
import { MissingConfigurationException } from "./PurchaseConnector/models/missing_configuration_exception";

// 7.0.0+ has no legacy-bridge fallback — fail fast on Old Architecture instead of a
// confusing native crash later. Skipped under Jest (no RN globals in a plain Node env).
if (typeof jest === "undefined") {
  const isNewArchitectureEnabled =
    global.RN$Bridgeless === true || global.__turboModuleProxy != null;
  if (!isNewArchitectureEnabled) {
    throw new Error(
      "react-native-appsflyer 7.0.0+ requires React Native's New Architecture (TurboModules). " +
        "Enable it via `newArchEnabled=true` in android/gradle.properties (Android) and " +
        "`RCT_NEW_ARCH_ENABLED=1` before `pod install` (iOS), or stay on react-native-appsflyer ^6 " +
        "if you cannot migrate to New Architecture yet."
    );
  }
}

const appsFlyer = {};
const appsFlyerEventEmitter = new NativeEventEmitter(NativeAppsFlyer);

//Purchase Connector native bridge objects
const { PCAppsFlyer } = NativeModules;
const AppsFlyerPurchaseConnector = {};
const pcEventsMap = {};
const purchaseConnectorEventEmitter = new NativeEventEmitter(PCAppsFlyer);

export const StoreKitVersion = {
  SK1: "SK1",
  SK2: "SK2",
};

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
    (result) => {
      try {
        const parsedResults = Object.entries(result).reduce(
          (acc, [purchaseToken, validationResult]) => {
            acc[purchaseToken] = SubscriptionValidationResult.fromJson(validationResult);
            return acc;
          },
          {}
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

  pcEventsMap[AppsFlyerConstants.SUBSCRIPTION_VALIDATION_SUCCESS] =
    subValidationSuccessListener;

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
      (result) => {
        try {
          const failureValidationResult =
            ValidationFailureData.fromJson(result);
          onFailure(failureValidationResult);
        } catch (error) {
          console.error(
            "Failed to handle subscription validation result:",
            error
          );
        }
      }
    );

  pcEventsMap[AppsFlyerConstants.SUBSCRIPTION_VALIDATION_FAILURE] =
    subValidationFailureListener;

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
      (result) => {
        try {
          const parsedResults = Object.entries(result).reduce(
            (acc, [purchaseToken, validationResult]) => {
              acc[purchaseToken] = InAppPurchaseValidationResult.fromJson(validationResult);
              return acc;
            },
            {}
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

  pcEventsMap[AppsFlyerConstants.IN_APP_PURCHASE_VALIDATION_SUCCESS] =
    inAppValidationSuccessListener;

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
      (result) => {
        try {
          const failureValidationResult =
            ValidationFailureData.fromJson(result);
          onFailure(failureValidationResult);
        } catch (error) {
          console.error(
            "Failed to handle in-app purchase validation result:",
            error
          );
        }
      }
    );

  pcEventsMap[AppsFlyerConstants.IN_APP_PURCHASE_VALIDATION_FAILURE] =
    inAppValidationFailureListener;

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
function logConsumableTransaction(transactionId){
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
    (info) => {
      try {
        if (info.error) {
          callback(null, info.error);
        }else{
          const validationInfo = JSON.stringify(info);
          callback(validationInfo, null);
        }
      } catch (error) {
        console.error(
          "Failed to handle iOS validation result:",
          error
        );      
      }
    }
  );

  pcEventsMap[AppsFlyerConstants.DID_RECEIVE_PURCHASE_REVENUE_VALIDATION_INFO] =
    revenueValidationListener;

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

const AppsFlyerPurchaseConnectorConfig = {
  setConfig: ({ logSubscriptions, logInApps, sandbox, storeKitVersion }) => {
    return {
      logSubscriptions,
      logInApps,
      sandbox,
      storeKitVersion: storeKitVersion || StoreKitVersion.SK1, // Default to SK1 if not provided
    };
  },
};

function create(config) {
  if (!config) {
    throw new MissingConfigurationException();
  }
  PCAppsFlyer.create(config);
}

AppsFlyerPurchaseConnector.create = create;
export { AppsFlyerPurchaseConnector, AppsFlyerPurchaseConnectorConfig };

// Encodes {method, params}, calls the TurboModule, decodes response. Rejects only on transport failure.
function dispatchRpc(method, params) {
  const requestJson = JSON.stringify({ method, params });
  return NativeAppsFlyer.executeRpc(requestJson).then((responseJson) =>
    JSON.parse(responseJson)
  );
}

// Unwraps normalized { success, data|error } into resolve(data)/reject(error). Shared by callRpc
// and setUserFbLoginId, which bypasses callRpc's JSON.stringify to avoid Number()'s precision loss.
function unwrapRpcResponse(response) {
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

function callRpc(method, params = {}) {
  return dispatchRpc(method, params).then(unwrapRpcResponse);
}

// For void-returning config setters: fire the call, log instead of throwing on failure.
function callRpcVoid(method, params) {
  callRpc(method, params).catch((error) =>
    console.warn(`[AppsFlyer] ${method} failed:`, error)
  );
}

// Legacy single-callback methods (bridge-patterns.md #2) receive errors too, so warn before forwarding.
function callRpcWithCallback(method, params, successC) {
  const callback = successC || ((result) => console.log(result));
  callRpc(method, params).then(callback, (error) => {
    console.warn(`[AppsFlyer] ${method} failed:`, error);
    callback(error);
  });
}

// Coerces a value to a string, falling back when null/undefined.
function toStringOrEmpty(value, fallback = "") {
  return value == null ? fallback : String(value);
}

// iOS wraps getter values in a keyed dict ({uid}, {version}), Android returns the bare value; `in` (not truthiness) so a falsy value like isSessionReady:false still unwraps.
function unwrapKeyed(data, key) {
  return data && typeof data === "object" && key in data ? data[key] : data;
}

// devKey/appId only, positional — matches AFRPCInitRequest's real wire shape (see MIGRATION.md).
// appId is required on iOS, unused on Android.
appsFlyer.init = (devKey, appId) => {
  if (typeof appId !== "string" && typeof appId !== "undefined") {
    return Promise.reject("appId should be a string!");
  }
  return callRpc("init", { devKey, appId });
};

// Dedicated RPC call, separate from init (matches native SDK7 alignment).
appsFlyer.setIsDebug = (isDebug) => callRpcVoid("isDebug", { isDebug });

appsFlyer.logEvent = (eventName, eventValues, successCOrAwait, error, awaitResponse) => {
  if (typeof successCOrAwait === "function" && typeof error === "function") {
    callRpc("logEvent", { eventName, eventValues, awaitResponse: !!awaitResponse }).then(
      successCOrAwait,
      error
    );
  } else {
    return callRpc("logEvent", {
      eventName,
      eventValues,
      awaitResponse: !!successCOrAwait,
    });
  }
};

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

const MEDIATION_NETWORK_OVERRIDES = {
  [MEDIATION_NETWORK.APPLOVIN_MAX]: { android: "applovinmax" },
  [MEDIATION_NETWORK.GOOGLE_ADMOB]: { android: "googleadmob" },
  [MEDIATION_NETWORK.TOPON_PTE]: { android: "toponpte" },
  [MEDIATION_NETWORK.CUSTOM_MEDIATION]: { android: "customMediation", ios: "custom" },
  [MEDIATION_NETWORK.DIRECT_MONETIZATION_NETWORK]: {
    android: "directMonetizationNetwork",
    ios: "directmonetization",
  },
};

function resolveMediationNetworkWireValue(mediationNetwork) {
  const override = MEDIATION_NETWORK_OVERRIDES[mediationNetwork];
  return (override && override[Platform.OS]) || mediationNetwork;
}

appsFlyer.logAdRevenue = (adRevenueData) => {
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
 * @param callback success callback function
 */
appsFlyer.logLocation = (longitude, latitude, callback) => {
  if (
    longitude == null ||
    latitude == null ||
    longitude == "" ||
    latitude == ""
  ) {
    console.log("longitude or latitude are missing!");
    return;
  }
  if (typeof longitude != "number" || typeof latitude != "number") {
    longitude = parseFloat(longitude);
    latitude = parseFloat(latitude);
  }
  return callRpcWithCallback("logLocation", { longitude, latitude }, callback);
};

/**
 * Set the user's email address. Hashed by the native SDK before transmission.
 *
 * @param email the email address.
 * @param successC success callback function.
 * @param errorC error callback function.
 */
appsFlyer.setUserEmail = (email, successC, errorC) => {
  return callRpc("setUserEmail", { email: toStringOrEmpty(email) }).then(
    (data) => successC && successC(data),
    (error) => errorC && errorC(error)
  );
};

/**
 * @deprecated since 7.0.0 — use {@link appsFlyer.setUserEmail}. SDK7's RPC layer exposes only
 * a single-address `setUserEmail`; neither the email array nor `emailsCryptType` has a native
 * counterpart on either platform. Only the first address is sent.
 */
appsFlyer.setUserEmails = (options, successC, errorC) => {
  const { emails, emailsCryptType } = options || {};
  console.warn(
    "[AppsFlyer] setUserEmails is deprecated and will be removed — use setUserEmail(email). " +
      "SDK7 supports a single address" +
      (emailsCryptType !== undefined
        ? " and no longer supports emailsCryptType (ignored)."
        : ".")
  );
  const [first, ...rest] = Array.isArray(emails) ? emails : [];
  if (rest.length) {
    console.warn(
      `[AppsFlyer] setUserEmails: only the first of ${rest.length + 1} addresses is sent.`
    );
  }
  return appsFlyer.setUserEmail(first, successC, errorC);
};

/**
 * Set additional data to be sent to AppsFlyer.
 *
 * @param additionalData additional data Dictionary.
 * @param successC success callback function.
 */
appsFlyer.setAdditionalData = (additionalData, successC) => {
  callRpcWithCallback("setAdditionalData", { customData: additionalData }, successC);
};

/**
 * Get AppsFlyer's unique device ID is created for every new install of an app.
 *
 * @callback callback function that returns (error,uid)
 */
appsFlyer.getAppsFlyerUID = (callback) => {
  callRpc("getAppsFlyerUID", {}).then(
    (data) => callback(null, unwrapKeyed(data, "uid")),
    (error) => callback(error, null)
  );
};

appsFlyer.getSDKVersion = (callback) => {
  callRpc("getSdkVersion", {}).then(
    (data) => callback(null, unwrapKeyed(data, "version")),
    (error) => callback(error, null)
  );
};

/**
 * Manually pass the Firebase / GCM Device Token for Uninstall measurement.
 *
 * @param token Firebase Device Token.
 * @param successC success callback function.
 */
appsFlyer.updateServerUninstallToken = (token, successC) => {
  // iOS reads `deviceToken` (via registerUninstall), Android reads `token` — send both.
  const value = toStringOrEmpty(token);
  callRpcWithCallback(
    "updateServerUninstallToken",
    { token: value, deviceToken: value },
    successC
  );
};

/**
 * Setting your own customer ID enables you to cross-reference your own unique ID with AppsFlyer's unique ID and the other devices' IDs.
 * This ID is available in AppsFlyer CSV reports along with Postback APIs for cross-referencing with your internal IDs.
 *
 * @param {string} userId Customer ID for client.
 * @param successC callback function.
 */
appsFlyer.setCustomerUserId = (userId, successC) => {
  callRpcWithCallback("setCustomerUserId", { customerId: toStringOrEmpty(userId) }, successC);
};

/**
 * Once this API is invoked, our SDK no longer communicates with our servers and stops functioning.
 * In some extreme cases you might want to shut down all SDK activity due to legal and privacy compliance.
 * This can be achieved with the stop API.
 *
 * @param {boolean} isStopped boolean should SDK be stopped.
 * @param successC callback function.
 */
appsFlyer.stop = (isStopped, successC) => {
  // Wire param is `shouldStop` on both platforms; public JS arg name stays `isStopped` for compatibility.
  callRpcWithCallback("stop", { shouldStop: isStopped }, successC);
};

/**
 * Opt-out of collection of Android ID.
 * If the app does NOT contain Google Play Services, Android ID is collected by the SDK.
 * However, apps with Google play services should avoid Android ID collection as this is in violation of the Google Play policy.
 *
 * @param {boolean} isCollect boolean, false to opt out.
 * @param successC callback function.
 * @platform android
 */
appsFlyer.setCollectAndroidID = (isCollect, successC) => {
  callRpcWithCallback("setCollectAndroidID", { isCollect }, successC);
};

/**
 * Set the OneLink ID that should be used for User-Invite-API.
 * The link that is generated for the user invite will use this OneLink as the base link.
 *
 * @param {string} oneLinkID OneLink ID obtained from the AppsFlyer Dashboard.
 * @param successC callback function.
 */
appsFlyer.setAppInviteOneLinkID = (oneLinkID, successC) => {
  callRpcWithCallback("setAppInviteOneLink", { oneLinkId: toStringOrEmpty(oneLinkID) }, successC);
};

/**
 * The LinkGenerator class builds the invite URL according to various setter methods which allow passing on additional information on the click.
 * @see https://support.appsflyer.com/hc/en-us/articles/115004480866-User-invite-attribution-
 *
 * @param parameters Dictionary.
 * @param success success callback function..
 * @param error error callback function.
 */
appsFlyer.generateInviteLink = (parameters = {}, success, error) => {
  // customerID → both referrerCustomerId (iOS) and customerId (Android); deeplinkPath has no native counterpart.
  const { customerID, baseDeeplink, deeplinkPath, ...rest } = parameters;
  if (deeplinkPath !== undefined) {
    console.warn(
      "[AppsFlyer] generateInviteLink: `deeplinkPath` is not supported by the native SDK and is ignored."
    );
  }
  const payload = { ...rest };
  if (customerID !== undefined) {
    payload.referrerCustomerId = customerID;
    payload.customerId = customerID;
  }
  if (baseDeeplink !== undefined) {
    payload.baseDeepLink = baseDeeplink;
  }
  return callRpc("generateInviteLink", payload).then(success, error);
};

/**
 * Log a user invite event.
 * @param channel the channel through which the invite was sent (optional).
 * @param eventParameters additional event parameters (optional).
 */
appsFlyer.logInvite = (channel, eventParameters) => {
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
appsFlyer.logCrossPromotionImpression = (appId, campaign, parameters) => {
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
appsFlyer.logCrossPromotionAndOpenStore = (appId, campaign, params) => {
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
 * @param successC success callback function.
 */
appsFlyer.setCurrencyCode = (currencyCode, successC) => {
  if (currencyCode == null || currencyCode == "") {
    console.log("currencyCode is missing!");
    return;
  }
  callRpcWithCallback("setCurrencyCode", { currencyCode: toStringOrEmpty(currencyCode) }, successC);
};

// Both platforms emit one shared event; this block demuxes the envelope onto public listener APIs.
const RPC_EVENT_NAME = "RNAppsFlyer_rpcEvent";

// Maps native event name → JS listener bucket (iOS uses onDeepLinkReceived, Android uses onDeepLinking).
const RPC_EVENT_DEMUX = {
  onConversionDataSuccess: "onInstallConversionData",
  onConversionDataFail: "onInstallConversionFailure",
  onDeepLinkReceived: "onDeepLink",
  onDeepLinking: "onDeepLink",
  onSessionReady: "onSessionReady",
};

const rpcListenerBuckets = {
  onInstallConversionData: [],
  onInstallConversionFailure: [],
  onDeepLink: [],
  onSessionReady: [],
};

// Android historically sends stringified JSON where iOS sends an object — normalize defensively.
function normalizeRpcEventData(rawData) {
  if (typeof rawData !== "string") {
    return rawData;
  }
  try {
    return JSON.parse(rawData);
  } catch (_error) {
    return new AFParseJSONException("Invalid data structure", rawData);
  }
}

let rpcEventSubscription = null;
function ensureRpcEventSubscription() {
  if (rpcEventSubscription) {
    return;
  }
  rpcEventSubscription = appsFlyerEventEmitter.addListener(
    RPC_EVENT_NAME,
    (envelopeRaw) => {
      let envelope;
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
function onceRegistrar(method) {
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
function createBucketListener(bucket, ensureRegistered) {
  return (callback) => {
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
 * @param callback receives `{status, type, data}` — see AppsFlyer docs for the payload shape.
 * @returns {function} call to unregister the listener (e.g. from componentWillUnmount).
 */
appsFlyer.onInstallConversionData = createBucketListener(
  "onInstallConversionData",
  ensureConversionListenerRegistered
);

appsFlyer.onInstallConversionFailure = createBucketListener(
  "onInstallConversionFailure",
  ensureConversionListenerRegistered
);

appsFlyer.onDeepLink = createBucketListener("onDeepLink", ensureDeepLinkListenerRegistered);

/**
 * Fires once the native SDK's session becomes ready to serve attribution / deep-link data.
 * Both platforms emit a real `onSessionReady` event once registered — this was previously
 * silently dropped (no bucket wired for it). Net-new in 7.0.0 — no 6.x equivalent.
 * @param callback invoked with no arguments when the session becomes ready.
 * @returns {function} call to unregister the listener (e.g. from componentWillUnmount).
 */
appsFlyer.registerSessionReadyListener = createBucketListener(
  "onSessionReady",
  ensureSessionReadyListenerRegistered
);

/**
 * Query whether the native SDK's session is ready to serve attribution / deep-link data.
 * Net-new in 7.0.0 — no 6.x equivalent.
 * @returns {Promise<boolean>}
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
const IOS_PURCHASE_TYPES = Object.freeze({
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
appsFlyer.validateAndLogInAppPurchase = (purchaseDetails, additionalParameters, _callback) => {
  // iOS wants nested {product:{productId}, transaction:{transactionId, purchaseType}}; Android
  // wants flat {productId, purchaseToken, purchaseType} (purchaseToken == transactionId). Send
  // the union — each side reads its own keys and its own purchaseType spelling (IOS_PURCHASE_TYPES).
  const { productId, transactionId, purchaseType } = purchaseDetails || {};
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
 * @param successC success callback function.
 */
appsFlyer.anonymizeUser = (shouldAnonymize, successC) => {
  callRpcWithCallback("anonymizeUser", { shouldAnonymize }, successC);
};

/**
 * Set Onelink custom/branded domains
 * Use this API during the SDK Initialization to indicate branded domains.
 * For more information please refer to https://support.appsflyer.com/hc/en-us/articles/360002329137-Implementing-Branded-Links
 * @param domains array of strings
 * @param successC success callback function.
 * @param errorC error callback function.
 */
appsFlyer.setOneLinkCustomDomains = (domains, successC, errorC) => {
  return callRpc("setOneLinkCustomDomain", { domains }).then(successC, errorC);
};

/**
 * Set domains used by ESP when wrapping your deeplinks.
 * Use this API during the SDK Initialization to indicate that links from certain domains should be resolved
 * in order to get original deeplink
 * For more information please refer to https://support.appsflyer.com/hc/en-us/articles/360001409618-Email-service-provider-challenges-with-iOS-Universal-links
 * @param urls array of strings
 * @param successC success callback function.
 * @param errorC error callback function.
 */
appsFlyer.setResolveDeepLinkURLs = (urls, successC, errorC) => {
  return callRpc("setResolveDeepLinkURLs", { urls }).then(successC, errorC);
};

/**
 * Disables IDFA collection in iOS and Advertising ID in Android
 * @param shouldDisable Flag to disable/enable IDFA collection
 */
appsFlyer.disableAdvertisingIdentifier = (isDisable) => {
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
appsFlyer.disableIDFVCollection = (shouldDisable) => {
  callRpcVoid("setDisableIDFVCollection", { disable: shouldDisable });
};

/**
 * Disables Apple Search Ads collecting
 * @param shouldDisable Flag to disable/enable Apple Search Ads data collection
 * @platform ios
 */
appsFlyer.disableCollectASA = (shouldDisable) => {
  callRpcVoid("setDisableCollectASA", { disable: shouldDisable });
};

// Export AFPurchaseType enum for the new validateAndLogInAppPurchase API
export const AFPurchaseType = {
  SUBSCRIPTION: "subscription",
  ONE_TIME_PURCHASE: "one_time_purchase"
};

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
appsFlyer.setUseReceiptValidationSandbox = (isSandbox) => {
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
  pushPayload,
  errorC = null,
  androidCampaignData = null
) => {
  // Note: on Android this triggers an extra Launch event even mid-session — inherited native SDK behavior.
  // iOS locates the `af` block in the raw payload itself; Android SDK7 dropped raw-payload
  // support and needs campaign/pid/isRetargeting supplied explicitly by the caller instead.
  const { campaign, pid, isRetargeting, additionalParameters } =
    androidCampaignData || {};
  if (!androidCampaignData) {
    console.warn(
      "[AppsFlyer] sendPushNotificationData: no androidCampaignData supplied — Android " +
        "requires explicit {campaign, pid, isRetargeting} and will report an empty " +
        "re-engagement without it. iOS is unaffected."
    );
  }
  callRpcWithCallback(
    "sendPushNotificationData",
    {
      pushPayload,
      campaign: toStringOrEmpty(campaign),
      pid: toStringOrEmpty(pid),
      isRetargeting: !!isRetargeting,
      additionalParameters,
    },
    errorC
  );
};

/**
 * Set a custom host
 * @param hostPrefix
 * @param hostName
 * @param successC: success callback
 */
appsFlyer.setHost = (hostPrefix, hostName, successC) => {
  // Breaking: SDK7 renamed/reordered these into {hostPrefixName, hostName} — see MIGRATION.md.
  callRpcWithCallback(
    "setHost",
    { hostPrefixName: hostPrefix, hostName },
    successC
  );
};

/**
 * The addPushNotificationDeepLinkPath method provides app owners with a flexible interface for configuring how deep links are extracted from push notification payloads.
 * for more information: https://support.appsflyer.com/hc/en-us/articles/207032126-Android-SDK-integration-for-developers#core-apis-65-configure-push-notification-deep-link-resolution
 * @param path: an array of string that represents the path
 * @param successC: success callback
 * @param errorC: error callback
 */
appsFlyer.addPushNotificationDeepLinkPath = (path, successC, errorC) => {
  callRpc("addPushNotificationDeepLinkPath", { deepLinkPath: path }).then(successC, errorC);
};

/**
 * enable or disable SKAD support. set True if you want to disable it!
 * @param isDisabled
 * @platform ios
 */
appsFlyer.disableSKAD = (disableSkad) => {
  callRpcVoid("setDisableSKAdNetwork", { disable: disableSkad });
};

/**
 * Set the language of the device. The data will be displayed in Raw Data Reports
 * @param language
 * @platform ios
 */
appsFlyer.setCurrentDeviceLanguage = (language) => {
  if (typeof language === "string") {
    callRpcVoid("setCurrentDeviceLanguage", { language });
  }
};

/**
 *  Used by advertisers to exclude specified networks/integrated partners from getting data.
 */
appsFlyer.setSharingFilterForPartners = (partners) => {
  callRpcVoid("setSharingFilterForPartners", { partners });
};
/**
 * Allows sending custom data for partner integration purposes.
 * @param partnerId: ID of the partner (usually suffixed with "_int").
 * @param partnerData: Customer data, depends on the integration configuration with the specific partner.
 */
appsFlyer.setPartnerData = (partnerId, partnerData) => {
  if (typeof partnerId === "string" && typeof partnerData === "object") {
    callRpcVoid("setPartnerData", { partnerId, data: partnerData });
  }
};

/**
 * Matches URLs that contain contains as a substring and appends query parameters to them. In case the URL does not match, parameters are not appended to it.
 * @param contains: The string to check in URL.
 * @param parameters: Parameters to append to the deeplink url after it passed validation.
 */
appsFlyer.appendParametersToDeepLinkingURL = (contains, parameters) => {
  if (typeof contains === "string" && typeof parameters === "object") {
    callRpcVoid("appendParametersToDeepLinkingURL", { contains, parameters });
  }
};

/**
 * Disable the SDK's network data collection.
 * @param disable
 * @platform android
 */
appsFlyer.setDisableNetworkData = (disable) => {
  callRpcVoid("setDisableNetworkData", { isDisable: disable });
};

// Now returns a Promise (it didn't pre-7.0.0) — callers that ignored the return value are
// unaffected; callers may now await/.then() it if they choose.
appsFlyer.startSdk = () => callRpc("start", { awaitResponse: true });

/**
 * Re-run deep link resolution for a URL.
 * @param {string} url the deep link URL to resolve.
 * @param {boolean} [shouldTriggerSession=false] whether resolution should also start a session.
 * @platform android
 */
appsFlyer.performOnDeepLinking = (url, shouldTriggerSession = false) => {
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
 * @param enabled: if the sdk should collect the TCF data. true/false
 */
appsFlyer.enableTCFDataCollection = (enabled) => {
  callRpcVoid("enableTCFDataCollection", { shouldCollect: enabled });
};

/**
 * If your app does not use a CMP compatible with TCF v2.2, use the SDK API detailed below to provide the consent data directly to the SDK.
 * @param  consentData: AppsFlyerConsent object.
 */
appsFlyer.setConsentData = (consentData) => {
  callRpcVoid("setConsentData", consentData);
};

class AFParseJSONException extends Error {
  constructor(message, data) {
    super(message);
    this.name = "AFParseJSONException";
    this.data = data;
  }
}

export { AFParseJSONException };

export class AppsFlyerConsent {
    /**
     * Creates an instance of AppsFlyerConsent.
     * @param {boolean} [isUserSubjectToGDPR] - Indicates whether GDPR applies to the user.
     * @param {boolean} [hasConsentForDataUsage] - Indicates whether the user has consented to data usage.
     * @param {boolean} [hasConsentForAdsPersonalization] - Indicates whether the user has consented to ads personalization.
     * @param {boolean} [hasConsentForAdStorage] - Indicates whether the user has consented to ad storage.
     */
    constructor(
        isUserSubjectToGDPR,
        hasConsentForDataUsage,
        hasConsentForAdsPersonalization,
        hasConsentForAdStorage
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
 * @param {number} seconds minimum number of seconds between sessions.
 */
appsFlyer.setMinTimeBetweenSessions = (seconds) =>
  callRpc("setMinTimeBetweenSessions", { seconds });

/**
 * Override the AppsFlyer-generated install ID with a custom identifier.
 * @param {string} installId custom install ID.
 */
appsFlyer.setInstallId = (installId) => callRpc("setInstallId", { installId });

/**
 * Set how long the SDK waits to resolve a deep link before giving up.
 * @param {number} timeout deep link resolution timeout, in milliseconds.
 * @remarks Param units (milliseconds) follow the native SDK's documented convention but
 *   are not independently confirmed against live native source — verify before relying on it.
 */
appsFlyer.setDeepLinkTimeout = (timeout) =>
  callRpc("setDeepLinkTimeout", { timeout });

// --- Deep-link ---

/**
 * Forward an opened URL (iOS AppDelegate `application:openURL:options:`) to the SDK for
 * deep link resolution.
 * @param {string} url the opened URL string.
 * @param {object} [options] iOS `UIApplication.OpenURLOptionsKey` dictionary, passed
 *   through as-is.
 * @remarks Safe to call before {@link appsFlyer.init} resolves (e.g. a cold start via
 *   Universal Link/URI scheme) — native buffers this call and flushes it once init succeeds,
 *   instead of failing with "Not ready".
 * @platform ios
 */
appsFlyer.handleOpenURL = (url, options = {}) =>
  callRpc("handleOpenURL", { url, options });

/**
 * Legacy (pre-iOS 9) `application:openURL:sourceApplication:annotation:` deep link path.
 * Case-sensitive and a distinct RPC method from {@link appsFlyer.handleOpenURL} — do not
 * collapse the two.
 * @param {string} url the opened URL string.
 * @param {object} [options] the openURL options dictionary.
 * @remarks Safe to call before {@link appsFlyer.init} resolves — see {@link appsFlyer.handleOpenURL}.
 * @platform ios
 */
appsFlyer.handleOpenUrl = (url, options = {}) =>
  // The native handler reads only {url, options}; the old `sourceApplication`/`annotation`
  // arguments were never read by any RPC layer and are gone rather than silently dropped.
  callRpc("handleOpenUrl", { url, options });

/**
 * Forward a Universal Link (from AppDelegate's
 * `application:continueUserActivity:restorationHandler:`) to the SDK.
 * @param {string} url the activity's `webpageURL`.
 * @param {string} [activityType] defaults natively to `NSUserActivityTypeBrowsingWeb`.
 * @remarks Safe to call before {@link appsFlyer.init} resolves — see {@link appsFlyer.handleOpenURL}.
 * @platform ios
 */
appsFlyer.continueUserActivity = (url, activityType) =>
  // Native requires a flat `url` (parsed via requireURL) — it never read a `userActivity` object.
  callRpc("continueUserActivity", {
    url,
    ...(activityType === undefined ? {} : { activityType }),
  });

/**
 * Enable or disable resolution of Facebook deferred app links.
 * @param {boolean} isEnabled
 */
appsFlyer.enableFacebookDeferredApplinks = (isEnabled) =>
  callRpc("enableFacebookDeferredApplinks", { isEnabled });

/**
 * Explicitly resolve a Facebook deferred app link from the app's `open(url:options:)`
 * payload.
 * @param {object} [options] iOS open-URL options dictionary containing the Facebook
 *   app link data.
 * @platform ios
 * @remarks Best-effort passthrough — param shape not confirmed against live native source.
 */
appsFlyer.setFacebookDeferredAppLink = (options = {}) =>
  callRpc("setFacebookDeferredAppLink", options);

// --- Hashed PII (hashed by the native SDK before transmission) ---

/**
 * Native reads a split country code + number, never a single combined `phone` string.
 * @param {string} countryCode e.g. "1" or "+1".
 * @param {string} phoneNumber the subscriber number, without the country code.
 */
appsFlyer.setUserPhone = (countryCode, phoneNumber) =>
  callRpc("setUserPhone", {
    countryCode: toStringOrEmpty(countryCode),
    phoneNumber: toStringOrEmpty(phoneNumber),
  });

/** @param {string} firstName */
appsFlyer.setUserFirstName = (firstName) =>
  callRpc("setUserFirstName", { firstName });

/** @param {string} lastName */
appsFlyer.setUserLastName = (lastName) =>
  callRpc("setUserLastName", { lastName });

/**
 * @param {string|number} fbLoginId numeric Facebook login ID (commonly 15-18 digits). iOS
 *   requires a JSON number (`requireInt64`), but a JS `Number` only safely holds integers up to
 *   2^53 — `Number(fbLoginId)` silently rounds longer IDs (e.g. "100003456789012345" ->
 *   100003456789012350) before it ever reaches JSON.stringify. The validated digits are spliced
 *   into the request body directly instead, so the exact value reaches native on both platforms.
 */
appsFlyer.setUserFbLoginId = (fbLoginId) => {
  const digits = String(fbLoginId).trim();
  if (!/^-?\d+$/.test(digits)) {
    return Promise.reject(new TypeError("setUserFbLoginId: fbLoginId must be an integer"));
  }
  return NativeAppsFlyer.executeRpc(
    `{"method":"setUserFbLoginId","params":{"fbLoginId":${digits}}}`
  ).then((responseJson) => unwrapRpcResponse(JSON.parse(responseJson)));
};

/** Clear all previously set hashed PII (phone, first/last name, Facebook login ID, emails). */
appsFlyer.clearUserPii = () => callRpc("clearUserPii");

/**
 * Forward the app's cold-start launch options (e.g. from a push notification or deep
 * link) to the SDK during startup.
 * @param {object} launchOptions the raw launch options dictionary.
 * @platform ios
 */
appsFlyer.handleLaunchOptions = (launchOptions) =>
  callRpc("handleLaunchOptions", { launchOptions });

// --- Android-only ---

/**
 * @returns {Promise<string>} the currently configured custom host name.
 * @platform android
 */
appsFlyer.getHostName = () => callRpc("getHostName");

/**
 * @returns {Promise<string>} the currently configured custom host prefix.
 * @platform android
 */
appsFlyer.getHostPrefix = () => callRpc("getHostPrefix");

/**
 * @returns {Promise<string>} the currently configured out-of-store source name.
 * @platform android
 */
appsFlyer.getOutOfStore = () => callRpc("getOutOfStore");

/**
 * @returns {Promise<string>} the Google Play install referrer attribution ID.
 * @platform android
 */
appsFlyer.getAttributionId = () => callRpc("getAttributionId");

/**
 * @returns {Promise<boolean>} whether the SDK is currently stopped (see {@link appsFlyer.stop}).
 * @platform android
 */
appsFlyer.isStopped = () => callRpc("isStopped");

/**
 * @returns {Promise<boolean>} whether the app was pre-installed on the device.
 * @platform android
 */
appsFlyer.isPreInstalledApp = () => callRpc("isPreInstalledApp");

/**
 * Report an out-of-store source (e.g. an alternative app store) for attribution.
 * @param {string} sourceName
 * @platform android
 */
appsFlyer.setOutOfStore = (sourceName) =>
  callRpc("setOutOfStore", { sourceName });

/**
 * Set the native SDK's log verbosity.
 * @param {string} logLevel one of the native SDK's log level names (e.g. "NONE",
 *   "DEBUG", "VERBOSE").
 * @platform android
 */
appsFlyer.setLogLevel = (logLevel) => callRpc("setLogLevel", { logLevel });

/**
 * Mark the current install as an update rather than a fresh install (testing aid).
 * @param {boolean} isUpdate
 * @platform android
 */
appsFlyer.setIsUpdate = (isUpdate) => callRpc("setIsUpdate", { isUpdate });

/**
 * Override the app ID reported to AppsFlyer (for apps whose package name differs from
 * their store listing ID).
 * @param {string} appId
 * @platform android
 */
appsFlyer.setAppId = (appId) => callRpc("setAppId", { appId });

/**
 * Report pre-install attribution for apps bundled directly onto a device (OEM deals).
 * @param {string} mediaSource
 * @param {string} campaign
 * @param {string} siteId
 * @platform android
 */
appsFlyer.setPreinstallAttribution = (mediaSource, campaign, siteId) =>
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

export default appsFlyer;
