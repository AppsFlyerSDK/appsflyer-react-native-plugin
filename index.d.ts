declare module "react-native-appsflyer" {
    type Response<T>    = void | Promise<T>;
    type SuccessCB      = (result?:any) => any;
    type ErrorCB        = (error?:any) => any;
    type ConversionData = {
        status: "success" | "failure",
        type: "onAppOpenAttribution"
            | "onInstallConversionDataLoaded"
            | "onAttributionFailure"
            | "onInstallConversionFailure",
        data: {
            [key:string]:string
        }
    }

    const appsFlyer: {
        initSdk(options:any, successC?:SuccessCB, errorC?:ErrorCB): Response<string>
        trackEvent(eventName:string, eventValues:object, successC?:SuccessCB, errorC?:ErrorCB): Response<string>
        trackLocation(longitude:number, latitude:number, callback:SuccessCB): void
        setUserEmails(options:any, successC?:SuccessCB, errorC?:ErrorCB): void
        setAdditionalData(additionalData:object, successC?:SuccessCB): void
        getAppsFlyerUID(callback:(error:Error, uid:string)=>any): void
        sendDeepLinkData(callback:any): void
        updateServerUninstallToken(token:string, successC?:SuccessCB): void
        setCustomerUserId(userId:string, successC?:SuccessCB): void
        stopTracking(isStopTracking:boolean, successC?:SuccessCB): void
        setAppInviteOneLinkID(oneLinkID:string, successC?:SuccessCB): void
        generateInviteLink(params:object, successC?:SuccessCB, errorC?:ErrorCB): void
        trackCrossPromotionImpression(appId:string, campaign:string): void
        trackAndOpenStore(appId:string, campaign:string, params: any): void
        setCurrencyCode(currencyCode:string, successC:SuccessCB): void
        onInstallConversionData(callback:(data:ConversionData)=>any): any
        onAppOpenAttribution(callback:(data:any)=>any): any

        /**
         * For iOS Only
         * */
        trackAppLaunch(): void

        /**
         * For Android Only
         * */
        enableUninstallTracking(gcmProjectNumber:any, successC?:SuccessCB): void
        setCollectIMEI(isCollect:boolean, successC?:SuccessCB): void
        setCollectAndroidID(isCollect:boolean, successC?:SuccessCB): void

        /**
         * @deprecated
         * */
        setGCMProjectNumber(gcmProjectNumber:any, successC?:SuccessCB, errorC?:ErrorCB): void
    };

    export default appsFlyer;
}
