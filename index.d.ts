import InAppPurchaseValidationResult from "./PurchaseConnector/models/in_app_purchase_validation_result";
import SubscriptionValidationResult from "./PurchaseConnector/models/subscription_validation_result";
import {
  OnResponse,
  OnFailure,
  OnReceivePurchaseRevenueValidationInfo,
} from "./PurchaseConnector/utils/connector_callbacks";

declare module "react-native-appsflyer" {
  type SuccessCB = (result?: unknown) => unknown;
  type ErrorCB = (error?: Error) => unknown;
  export type ConversionData = {
    status: "success" | "failure";
    type: "onInstallConversionDataLoaded" | "onInstallConversionFailure";
    data: {
      is_first_launch: boolean;
      media_source: string;
      campaign: string;
      af_status: "Organic" | "Non-organic";
      [key: string]: any;
    };
  };

    export type UnifiedDeepLinkData = {
        status: "success" | "failure",
        type: "onDeepLinking",
        deepLinkStatus: 'FOUND' | 'NOT_FOUND' | 'ERROR',
        isDeferred: boolean,
        data: {
            campaign: string;
            deep_link_value: string;
            deep_link_sub1?: string;
            media_source: string;
            pid?: string;
            link: string,
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
        }
    }

  export enum AF_EMAIL_CRYPT_TYPE {
    NONE,
    SHA256,
  }

  export enum AFPurchaseType {
    SUBSCRIPTION = "subscription",
    ONE_TIME_PURCHASE = "one_time_purchase"
  }

  export interface AFPurchaseDetails {
    purchaseType: AFPurchaseType;
    transactionId: string; //aka PurchaseToken
    productId: string;
  }

  export interface SetEmailsOptions {
    emails?: string[];
    emailsCryptType: AF_EMAIL_CRYPT_TYPE | 0 | 3;
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
        );
    }

  //Log Ad Revenue Section
  export enum MEDIATION_NETWORK {
    IRONSOURCE,
    APPLOVIN_MAX,
    GOOGLE_ADMOB,
    FYBER,
    APPODEAL,
    ADMOST,
    TOPON,
    TRADPLUS,
    YANDEX,
    CHARTBOOST,
    UNITY,
    TOPON_PTE,
    CUSTOM_MEDIATION,
    DIRECT_MONETIZATION_NETWORK,
  }

  export interface AFAdRevenueData {
    monetizationNetwork: string;
    mediationNetwork: MEDIATION_NETWORK;
    currencyIso4217Code: string;
    revenue: number;
    additionalParameters?: { [key: string]: any };
  }

  /**
   * PurchaseConnector
   */
  export const StoreKitVersion: {
    readonly SK1: "SK1";
    readonly SK2: "SK2";
  };

  export interface PurchaseConnectorConfig {
    logSubscriptions: boolean;
    logInApps: boolean;
    sandbox: boolean;
    storeKitVersion?: keyof typeof StoreKitVersion; // Optional property
  }

  export const AppsFlyerPurchaseConnectorConfig: {
    setConfig(config: PurchaseConnectorConfig): PurchaseConnectorConfig;
  };

  // iOS interfaces

  export interface PurchaseRevenueDataSource {
    additionalParameters?: { [key: string]: any };
  }

  export interface PurchaseRevenueDataSourceStoreKit2 {
    additionalParameters?: { [key: string]: any };
  }

  // Android interfaces
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
      callback: (data:OnResponse<SubscriptionValidationResult>) => any
    ): () => void;
    onSubscriptionValidationResultFailure(
      callback: (data:OnFailure) => any
    ): () => void;
    onInAppValidationResultSuccess(
      callback: (data:OnResponse<InAppPurchaseValidationResult>) => any
    ): () => void;
    onInAppValidationResultFailure(
      callback: (data:OnFailure) => any
    ): () => void;

    setSubscriptionPurchaseEventDataSource: (dataSource: SubscriptionPurchaseEventDataSource) => void;
    setInAppPurchaseEventDataSource: (dataSource: InAppPurchaseEventDataSource) => void;
  }

  export const AppsFlyerPurchaseConnector: PurchaseConnector;

  const appsFlyer: {
    onInstallConversionData(
      callback: (data: ConversionData) => any
    ): () => void;
    onInstallConversionFailure(
      callback: (data: ConversionData) => any
    ): () => void;
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
    logEvent(
      eventName: string,
      eventValues: object,
      successC: SuccessCB,
      errorC: ErrorCB,
      awaitResponse?: boolean
    ): void;
    /** Set the user's email address. Hashed by the native SDK before transmission. */
    setUserEmail(email: string, successC?: SuccessCB, errorC?: ErrorCB): void;
    /** @deprecated since 7.0.0 — use {@link setUserEmail}; only the first address is sent, `emailsCryptType` is ignored. */
    setUserEmails(
      options: SetEmailsOptions,
      successC?: SuccessCB,
      errorC?: ErrorCB
    ): void;
    setAdditionalData(additionalData: object, successC?: SuccessCB): void;
    getAppsFlyerUID(callback: (error: Error, uid: string) => any): void;
    getSDKVersion(callback: (error: Error, version: string) => any): void;
    setCustomerUserId(userId: string, successC?: SuccessCB): void;
    stop(isStopped: boolean, successC?: SuccessCB): void;
    setAppInviteOneLinkID(oneLinkID: string, successC?: SuccessCB): void;
    generateInviteLink(
      params: GenerateInviteLinkParams,
      successC: SuccessCB,
      errorC: ErrorCB
    ): void;
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
    setCurrencyCode(currencyCode: string, successC?: SuccessCB): void;
    anonymizeUser(shouldAnonymize: boolean, successC?: SuccessCB): void;
    setOneLinkCustomDomains(
      domains: string[],
      successC: SuccessCB,
      errorC: ErrorCB
    ): void;
    setResolveDeepLinkURLs(
      urls: string[],
      successC: SuccessCB,
      errorC: ErrorCB
    ): void;
    logLocation(
      longitude: number,
      latitude: number,
      successC?: SuccessCB
    ): void;
    /**
     * validateAndLogInAppPurchase API with AFPurchaseDetails.
     * @remarks `callback` is currently inert — no native event delivers a validation result yet
     *   (see index.js's remarks on this method). A 401/500 response after calling this is an
     *   expected server-side rejection when the app isn't registered for purchase validation.
     */
    validateAndLogInAppPurchase(
      purchaseDetails: AFPurchaseDetails,
      additionalParameters?: { [key: string]: any },
      callback?: (data: any) => void
    ): void;
   
    updateServerUninstallToken(token: string, successC?: SuccessCB): void;
    /**
     * @param pushPayload the raw remote-notification payload — iOS locates the `af` block itself.
     * @param androidCampaignData required on Android (SDK7 dropped raw-payload support there); omitting it reports an empty re-engagement.
     */
    sendPushNotificationData(
      pushPayload: object,
      errorC?: ErrorCB,
      androidCampaignData?: {
        campaign?: string;
        pid?: string;
        isRetargeting?: boolean;
        additionalParameters?: Record<string, unknown>;
      }
    ): void;
    setHost(hostPrefix: string, hostName: string, success: SuccessCB): void;
    addPushNotificationDeepLinkPath(
      path: string[],
      successC: SuccessCB,
      errorC: ErrorCB
    ): void;
    disableAdvertisingIdentifier(isDisable: boolean): void;
    setSharingFilterForPartners(partners: string[]): void;
    setPartnerData(partnerId: string, partnerData: object): void;
    appendParametersToDeepLinkingURL(
      contains: string,
      parameters: object
    ): void;
    startSdk(): Promise<string>;
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
    setCollectAndroidID(isCollect: boolean, successC?: SuccessCB): void;
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

    /**
     * Forward an opened URL (iOS `application:openURL:options:`) for deep link resolution.
     * @platform ios
     */
    handleOpenURL(url: string, options?: Record<string, unknown>): Promise<void>;
    /**
     * Legacy (pre-iOS 9) `application:openURL:sourceApplication:annotation:` path.
     * Case-sensitive and distinct from {@link handleOpenURL} — do not collapse the two.
     * @platform ios
     */
    handleOpenUrl(url: string, options?: Record<string, unknown>): Promise<void>;
    /**
     * Forward a Universal Link for deep link resolution.
     * @param url the activity's `webpageURL`.
     * @param activityType defaults natively to `NSUserActivityTypeBrowsingWeb`.
     * @platform ios
     */
    continueUserActivity(url: string, activityType?: string): Promise<void>;
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

    // --- Lifecycle (net-new) ---

    /**
     * Forward the app's cold-start launch options to the SDK during startup.
     * @platform ios
     * @remarks Not present in the Android RPC contract's supported method list.
     */
    handleLaunchOptions(launchOptions: Record<string, unknown>): Promise<void>;

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
  };

  export default appsFlyer;
}
