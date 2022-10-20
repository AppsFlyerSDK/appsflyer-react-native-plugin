/**
 * Typescript Definition Sync with v5.1.1
 **/
declare module "react-native-appsflyer" {
    type Response<T> = void | Promise<T>;
    type SuccessCB = (result?: any) => any;
    type ErrorCB = (error?: any) => any;
    export type ConversionData = {
        status: "success" | "failure",
        type: "onInstallConversionDataLoaded" | "onInstallConversionFailure"
        data: {
            is_first_launch: "true" | "false";
            media_source: string;
            campaign: string;
            af_status: "Organic" | "Non-organic";
            [key: string]: any;
        }
    }

    export type OnAppOpenAttributionData = {
        status: "success" | "failure",
        type: "onAppOpenAttribution" | "onAttributionFailure"
        data: {
            af_dp?: string;
            is_retargeting?: string,
            af_channel?: string,
            af_cost_currency?: string,
            c?: string;
            af_adset?: string,
            af_click_lookback: string,
            deep_link_sub1?: string;
            campaign: string;
            deep_link_value: string;
            link: string;
            media_source: string;
            pid?: string;
            path?: string // Uri-Scheme
            host?: string // Uri-Scheme
            shortlink?: string // Uri-Scheme
            scheme?: string // Uri-Scheme
            af_sub1?: string;
            af_sub2?: string;
            af_sub3?: string;
            af_sub4?: string;
            af_sub5?: string;
            [key: string]: any;
        }
    }

    export type UnifiedDeepLinkData = {
        status: "success" | "failure",
        type: "onDeepLinking",
        deepLinkStatus: 'FOUND' | 'NOT_FOUND' | 'Error',
        isDeferred: boolean,
        data: {
            campaign: string;
            deep_link_value: string;
            deep_link_sub1?: string;
            media_source: string;
            pid?: string;
            af_sub1?: string;
            af_sub2?: string;
            af_sub3?: string;
            af_sub4?: string;
            af_sub5?: string;
            [key: string]: any;
        }
    }

    export enum AF_EMAIL_CRYPT_TYPE {
        NONE,
        SHA256
    }

    export interface InitSDKOptions {
        devKey: string;
        appId?: string; // iOS only
        isDebug?: boolean;
        onInstallConversionDataListener?: boolean;
        onDeepLinkListener?: boolean;
        timeToWaitForATTUserAuthorization?: number; // iOS only
        manualStart?: boolean
    }

    export interface InAppPurchase {
        publicKey: string;
        productIdentifier: string;
        signature: string;
        transactionId: string;
        purchaseData: string;
        price: string;
        currency: string;
        additionalParameters?: object;
    }

    export interface SetEmailsOptions {
        emails?: string[];
        emailsCryptType: AF_EMAIL_CRYPT_TYPE | 0 | 3;
    }

    export interface GenerateInviteLinkParams {
        channel: string;
        campaign?: string;
        customerID?: string;
        userParams?: object;

        [key: string]: any;
    }

    const appsFlyer: {
        onInstallConversionData(callback: (data: ConversionData) => any): () => void;
        onInstallConversionFailure(callback: (data: ConversionData) => any): () => void;
        onAppOpenAttribution(callback: (data: OnAppOpenAttributionData) => any): () => void;
        onAttributionFailure(callback: (data: OnAppOpenAttributionData) => any): () => void;
        onDeepLink(callback: (data: UnifiedDeepLinkData) => any): () => void;
        initSdk(options: InitSDKOptions): Promise<string>;
        initSdk(options: InitSDKOptions, successC: SuccessCB, errorC: ErrorCB): void;
        logEvent(eventName: string, eventValues: object): Promise<string>;
        logEvent(eventName: string, eventValues: object, successC: SuccessCB, errorC: ErrorCB): void;
        setUserEmails(options: SetEmailsOptions, successC: SuccessCB, errorC: ErrorCB): void
        setAdditionalData(additionalData: object, successC?: SuccessCB): void
        getAppsFlyerUID(callback: (error: Error, uid: string) => any): void
        setCustomerUserId(userId: string, successC?: SuccessCB): void
        stop(isStopped: boolean, successC?: SuccessCB): void
        setAppInviteOneLinkID(oneLinkID: string, successC?: SuccessCB): void
        generateInviteLink(params: GenerateInviteLinkParams, successC: SuccessCB, errorC: ErrorCB): void
        logCrossPromotionImpression(appId: string, campaign: string, parameters: object): void
        logCrossPromotionAndOpenStore(appId: string, campaign: string, params: object): void
        setCurrencyCode(currencyCode: string, successC?: SuccessCB): void
        anonymizeUser(shouldAnonymize: boolean, successC?: SuccessCB): void
        setOneLinkCustomDomains(domains: string[], successC: SuccessCB, errorC: ErrorCB): void
        setResolveDeepLinkURLs(urls: string[], successC: SuccessCB, errorC: ErrorCB): void
        performOnAppAttribution(urlString: string, successC: SuccessCB, errorC: ErrorCB): void
        setSharingFilterForAllPartners(): void
        setSharingFilter(partners: string[], successC?: SuccessCB, errorC?: ErrorCB): void
        logLocation(longitude: number, latitude: number, successC?: SuccessCB): void
        validateAndLogInAppPurchase(purchaseInfo: InAppPurchase, successC: SuccessCB, errorC: ErrorCB): Response<string>
        updateServerUninstallToken(token: string, successC?: SuccessCB): void
        sendPushNotificationData(pushPayload: object, errorC?: ErrorCB): void
        setHost(hostPrefix: string, hostName: string, success: SuccessCB): void
        addPushNotificationDeepLinkPath(path: string[], successC: SuccessCB, errorC: ErrorCB): void
        disableAdvertisingIdentifier(isDisable: boolean): void
        setSharingFilterForPartners(partners: string[]): void
        setPartnerData(partnerId: string, partnerData: object): void
        appendParametersToDeepLinkingURL(contains: string, parameters: object): void
        startSdk(): void

        /**
         * For iOS Only
         * */
        disableCollectASA(shouldDisable: boolean): void
        setUseReceiptValidationSandbox(isSandbox: boolean): void
        disableSKAD(disableSkad: boolean): void
        setCurrentDeviceLanguage(language: string): void
        disableIDFVCollection(shouldDisable: boolean): void

        /**
         * For Android Only
         * */
        setCollectIMEI(isCollect: boolean, successC?: SuccessCB): void
        setCollectAndroidID(isCollect: boolean, successC?: SuccessCB): void
        setDisableNetworkData(disable: boolean): void
        performOnDeepLinking(): void
    };

    export default appsFlyer;
}
