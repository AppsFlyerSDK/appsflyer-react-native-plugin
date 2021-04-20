/**
 * Typescript Definition Sync with v5.1.1
 **/
declare module "react-native-appsflyer" {
    type Response<T> = void | Promise<T>;
    type SuccessCB = (result?: any) => any;
    type ErrorCB = (error?: any) => any;
    export type ConversionData = {
        status: "success" | "failure",
        type: "onAppOpenAttribution"
            | "onInstallConversionDataLoaded"
            | "onAttributionFailure"
            | "onInstallConversionFailure"
        data: {
            is_first_launch: "true" | "false",
            media_source: string,
            campaign: string,
            af_status: "Organic" | "Non-organic",
            af_dp: string,
            deep_link_value: string,
            link: string,
            [key: string]: any;
        }
    }

    export type onDeepLinkData = {
        deepLinkStatus: "FOUND" | "NOT_FOUND" | "Error" | any,
        isDeferred: boolean,
        status: "success" | "failure",
        type: "onDeepLinking",
        data: {
            campaign: string,
            deep_link_value: string,
            media_source: string,
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
        onAppOpenAttribution(callback: (data: ConversionData) => any): () => void;
        onAttributionFailure(callback: (data: ConversionData) => any): () => void;
        onDeepLink(callback: (data: onDeepLinkData) => any): () => void;
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
        setSharingFilter(partners: string[], successC: SuccessCB, errorC: ErrorCB): void
        logLocation(longitude: number, latitude: number, successC?: SuccessCB): void
        validateAndLogInAppPurchase(purchaseInfo: InAppPurchase, successC: SuccessCB, errorC: ErrorCB): Response<string>
        updateServerUninstallToken(token: string, successC?: SuccessCB): void
        sendPushNotificationData(pushPayload: object): void
        setHost(hostPrefix: string, hostName: string, success: SuccessCB): void
        addPushNotificationDeepLinkPath(path: string[], successC: SuccessCB, errorC: ErrorCB): void

        /**
         * For iOS Only
         * */
        disableAdvertisingIdentifier(shouldDisable: boolean): void
        disableCollectASA(shouldDisable: boolean): void
        setUseReceiptValidationSandbox(isSandbox: boolean): void
        disableSKAD(disableSkad: boolean): void

        /**
         * For Android Only
         * */
        setCollectIMEI(isCollect: boolean, successC?: SuccessCB): void
        setCollectAndroidID(isCollect: boolean, successC?: SuccessCB): void
    };

    export default appsFlyer;
}
