import {describe, jest, test} from "@jest/globals";
import appsFlyer, {RNAppsFlyer} from "../index";


describe("initSDK", () => {
    const initSdk = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.initSdkWithCallBack = initSdk.bind(RNAppsFlyer);
    RNAppsFlyer.initSdkWithPromise = initSdk.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.initSdk).toBeDefined();
    });
    test('initSdk with params and callback: should return success', () => {
        expect(appsFlyer.initSdk({devKey: 'xxxx', isDebug: true}, console.log, console.error)).toBeUndefined();
    });
    test('initSdk with params: should return success', () => {
        expect(appsFlyer.initSdk({devKey: 'xxxx', isDebug: true})).toBe("success");
    });
})

describe("logEvent", () => {
    const logEvent = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.logEvent = logEvent.bind(RNAppsFlyer);
    RNAppsFlyer.logEventWithPromise = logEvent.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.logEvent).toBeDefined();
    });
    test('logEvent with params: should return success', () => {
        expect(appsFlyer.logEvent('af_purchase', {af_price: 152, af_currency: "USD"})).toBe("success");
    });
    test('logEvent with params and callback: should return success', () => {
        expect(appsFlyer.logEvent('af_purchase', {
            af_price: 152,
            af_currency: "USD"
        }, console.log, console.error)).toBeUndefined();
    });
})

describe("logLocation", () => {
    test('is function defined?', () => {
        expect(appsFlyer.logLocation).toBeDefined();
    });
    test('should return undefined with no parameters', () => {
        expect(appsFlyer.logLocation()).toBeUndefined();
    });
    test('should return success with string parameters', () => {
        const logLocation = jest.fn().mockImplementation(function () {
            return "success"
        })
        RNAppsFlyer.logLocation = logLocation.bind(RNAppsFlyer);
        expect(appsFlyer.logLocation('15', '15')).toBe("success");
    });
    test('should return success with real numbers', () => {
        expect(appsFlyer.logLocation(15, 15)).toBe("success");
    });
    test('should return success with real numbers and callback', () => {
        expect(appsFlyer.logLocation(15, 15, console.log)).toBe("success");
    });
})

describe("setUserEmails", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setUserEmails).toBeDefined();
    });
    test('should return success with parameters', () => {
        const setUserEmails = jest.fn().mockImplementation(function () {
            return "success"
        })
        RNAppsFlyer.setUserEmails = setUserEmails.bind(RNAppsFlyer);
        expect(appsFlyer.setUserEmails("test@appsflyer.com")).toBe("success")
    })
})

describe("setAdditionalData", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setAdditionalData).toBeDefined();
    });
    test('should return success with parameters only', () => {
        const setAdditionalData = jest.fn().mockImplementation(function () {
            return "success"
        })
        RNAppsFlyer.setAdditionalData = setAdditionalData.bind(RNAppsFlyer);
        expect(appsFlyer.setAdditionalData({data: "really important data"})).toBe("success")
    });
    test('should return success with parameters and callback', () => {
        expect(appsFlyer.setAdditionalData({data: "really important data"}, console.log)).toBe("success")
    });
})

describe("getAppsFlyerUID", () => {
    test('is function defined?', () => {
        expect(appsFlyer.getAppsFlyerUID).toBeDefined();
    });
    test('should return success with callback', () => {
        const getAppsFlyerUID = jest.fn().mockImplementation(function () {
            return "success"
        })
        RNAppsFlyer.getAppsFlyerUID = getAppsFlyerUID.bind(RNAppsFlyer);
        expect(appsFlyer.getAppsFlyerUID(console.log)).toBe("success")
    });
})

describe("updateServerUninstallToken", () => {
    const updateServerUninstallToken = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.updateServerUninstallToken = updateServerUninstallToken.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.updateServerUninstallToken).toBeDefined();
    });
    test('cover use case where token is null', () => {
        expect(appsFlyer.updateServerUninstallToken(null)).toBe("success")
    });
    test('cover use case where token isn\'t string', () => {
        expect(appsFlyer.updateServerUninstallToken(1453)).toBe("success")
    });
    test('cover use case where callback is given', () => {
        expect(appsFlyer.updateServerUninstallToken("15312", console.log)).toBe("success")
    });
})

describe("setCustomerUserId", () => {
    const setCustomerUserId = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setCustomerUserId = setCustomerUserId.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setCustomerUserId).toBeDefined();
    });
    test('cover use case where userId is null', () => {
        expect(appsFlyer.setCustomerUserId(null)).toBe("success")
    });
    test('cover use case where userId isn\'t string', () => {
        expect(appsFlyer.setCustomerUserId(1453)).toBe("success")
    });
    test('cover use case where callback is given', () => {
        expect(appsFlyer.setCustomerUserId("15312", console.log)).toBe("success")
    });
})

describe("stop", () => {
    const stop = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.stop = stop.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.stop).toBeDefined();
    });
    test('should return success with callback', () => {
        expect(appsFlyer.stop(true, console.log)).toBe("success")
    });
    test('should return success without callback', () => {
        expect(appsFlyer.stop(true)).toBe("success")
    });
})

describe("setCollectIMEI", () => {
    const setCollectIMEI = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setCollectIMEI = setCollectIMEI.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setCollectIMEI).toBeDefined();
    });
    test('should return success with callback', () => {
        expect(appsFlyer.setCollectIMEI(true, console.log)).toBeDefined();
    });
})

describe("setCollectAndroidID", () => {
    const setCollectAndroidID = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setCollectAndroidID = setCollectAndroidID.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setCollectAndroidID).toBeDefined();
    });
    test('should return success with callback', () => {
        expect(appsFlyer.setCollectAndroidID(true, console.log)).toBeDefined();
    });
})

describe("setAppInviteOneLinkID", () => {
    const setAppInviteOneLinkID = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setAppInviteOneLinkID = setAppInviteOneLinkID.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setAppInviteOneLinkID).toBeDefined();
    });
    test('cover use case where oneLinkID is null', () => {
        expect(appsFlyer.setAppInviteOneLinkID(null)).toBe("success")
    });
    test('cover use case where oneLinkID isn\'t string', () => {
        expect(appsFlyer.setAppInviteOneLinkID(1453)).toBe("success")
    });
    test('cover use case where callback is given', () => {
        expect(appsFlyer.setAppInviteOneLinkID("15312", console.log)).toBe("success")
    });
})

describe("generateInviteLink", () => {
    const generateInviteLink = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.generateInviteLink = generateInviteLink.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.generateInviteLink).toBeDefined();
    });
    test('should return success with callback', () => {
        expect(appsFlyer.generateInviteLink({af_campign: "test"}, console.log, console.error)).toBeDefined();
    });
})

describe("logCrossPromotionImpression", () => {
    const logCrossPromotionImpression = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.logCrossPromotionImpression = logCrossPromotionImpression.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.logCrossPromotionImpression).toBeDefined();
    });
    test('logCrossPromotionImpression with null appId should return undefined', () => {
        expect(appsFlyer.logCrossPromotionImpression(null, "campaign", {param: "test"})).toBeUndefined();
    });
    test('logCrossPromotionImpression with empty appId should return undefined', () => {
        expect(appsFlyer.logCrossPromotionImpression("", "campaign", {param: "test"})).toBeUndefined();
    });
    test('logCrossPromotionImpression with non-string appId and null campaign should return success', () => {
        expect(appsFlyer.logCrossPromotionImpression(15632, null, {param: "test"})).toBe("success");
    });
})

describe("logCrossPromotionAndOpenStore", () => {
    const logCrossPromotionAndOpenStore = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.logCrossPromotionAndOpenStore = logCrossPromotionAndOpenStore.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.logCrossPromotionAndOpenStore).toBeDefined();
    });
    test('logCrossPromotionAndOpenStore with null appId should return undefined', () => {
        expect(appsFlyer.logCrossPromotionAndOpenStore(null, "campaign", {param: "test"})).toBeUndefined();
    });
    test('logCrossPromotionAndOpenStore with empty appId should return undefined', () => {
        expect(appsFlyer.logCrossPromotionAndOpenStore("", "campaign", {param: "test"})).toBeUndefined();
    });
    test('logCrossPromotionAndOpenStore with non-string appId and null campaign should return success', () => {
        expect(appsFlyer.logCrossPromotionAndOpenStore(15632, null, {param: "test"})).toBe("success");
    });
})

describe("setCurrencyCode", () => {
    const setCurrencyCode = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setCurrencyCode = setCurrencyCode.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setCurrencyCode).toBeDefined();
    });
    test('setCurrencyCode with null currency code should return undefined', () => {
        expect(appsFlyer.setCurrencyCode(null, console.log)).toBeUndefined();
    });
    test('setCurrencyCode with non-string currency code and callback should return success', () => {
        expect(appsFlyer.setCurrencyCode(123, console.log)).toBe("success");
    });
    test('setCurrencyCode with string currency code and no callback should return success', () => {
        expect(appsFlyer.setCurrencyCode("USD")).toBe("success");
    });
})

describe("anonymizeUser", () => {
    const anonymizeUser = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.anonymizeUser = anonymizeUser.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.anonymizeUser).toBeDefined();
    });
    test('anonymizeUser with callback should return success', () => {
        expect(appsFlyer.anonymizeUser(true, console.log)).toBe("success");
    });
    test('anonymizeUser with no callback should return success', () => {
        expect(appsFlyer.anonymizeUser(true)).toBe("success");
    });
})

describe("setOneLinkCustomDomains", () => {
    const setOneLinkCustomDomains = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setOneLinkCustomDomains = setOneLinkCustomDomains.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setOneLinkCustomDomains).toBeDefined();
    });
    test('setOneLinkCustomDomains with callback and params should return success', () => {
        expect(appsFlyer.setOneLinkCustomDomains("[domain1, domain2]", console.log, console.error)).toBe("success");
    });
})

describe("setResolveDeepLinkURLs", () => {
    const setResolveDeepLinkURLs = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setResolveDeepLinkURLs = setResolveDeepLinkURLs.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setResolveDeepLinkURLs).toBeDefined();
    });
    test('setResolveDeepLinkURLs with callback and params should return success', () => {
        expect(appsFlyer.setResolveDeepLinkURLs("[url1, url2]", console.log, console.error)).toBe("success");
    });
})

describe("performOnAppAttribution", () => {
    const performOnAppAttribution = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.performOnAppAttribution = performOnAppAttribution.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.performOnAppAttribution).toBeDefined();
    });
    test('performOnAppAttribution with non-string url should return success', () => {
        expect(appsFlyer.performOnAppAttribution(123, console.log, console.error)).toBe("success");
    });
})

describe("setSharingFilterForAllPartners", () => {
    const setSharingFilterForAllPartners = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setSharingFilterForAllPartners = setSharingFilterForAllPartners.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setSharingFilterForAllPartners).toBeDefined();
    });
    test('setSharingFilterForAllPartners should return success', () => {
        expect(appsFlyer.setSharingFilterForAllPartners()).toBe("success");
    });
})

describe("setSharingFilter", () => {
    const setSharingFilter = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setSharingFilter = setSharingFilter.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setSharingFilter).toBeDefined();
    });
    test('setSharingFilter with strings array should return success', () => {
        expect(appsFlyer.setSharingFilter("[partner1, partner2]", console.log, console.error)).toBe("success");
    });
})

describe("disableAdvertisingIdentifier", () => {
    const disableAdvertisingIdentifier = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.disableAdvertisingIdentifier = disableAdvertisingIdentifier.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.disableAdvertisingIdentifier).toBeDefined();
    });
    test('disableAdvertisingIdentifier with bool value should return success', () => {
        expect(appsFlyer.disableAdvertisingIdentifier(true)).toBe("success");
    });
})

describe("disableCollectASA", () => {
    const disableCollectASA = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.disableCollectASA = disableCollectASA.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.disableCollectASA).toBeDefined();
    });
    test('disableCollectASA with bool value should return success', () => {
        expect(appsFlyer.disableCollectASA(true)).toBe("success");
    });
})

describe("validateAndLogInAppPurchase", () => {
    const validateAndLogInAppPurchase = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.validateAndLogInAppPurchase = validateAndLogInAppPurchase.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.validateAndLogInAppPurchase).toBeDefined();
    });
    test('validateAndLogInAppPurchase with purchaseInfo and callbacks should return success', () => {
        expect(appsFlyer.validateAndLogInAppPurchase({key: "val"}, console.log, console.error)).toBe("success");
    });
})

describe("setUseReceiptValidationSandbox", () => {
    const setUseReceiptValidationSandbox = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.setUseReceiptValidationSandbox = setUseReceiptValidationSandbox.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.setUseReceiptValidationSandbox).toBeDefined();
    });
    test('setUseReceiptValidationSandbox with bool value and callbacks should return success', () => {
        expect(appsFlyer.setUseReceiptValidationSandbox(true, console.log, console.error)).toBe("success");
    });
})

describe("sendPushNotificationData", () => {
    const sendPushNotificationData = jest.fn().mockImplementation(function () {
        return "success"
    })
    RNAppsFlyer.sendPushNotificationData = sendPushNotificationData.bind(RNAppsFlyer);
    test('is function defined?', () => {
        expect(appsFlyer.sendPushNotificationData).toBeDefined();
    });
    test('sendPushNotificationData with pushPayload should return success', () => {
        expect(appsFlyer.sendPushNotificationData({data: "very important"})).toBe("success");
    });
})

describe("onInstallConversionData", () => {
    test('is function defined?', () => {
        expect(appsFlyer.onInstallConversionData).toBeDefined();
    });
})
describe("onInstallConversionFailure", () => {
    test('is function defined?', () => {
        expect(appsFlyer.onInstallConversionFailure).toBeDefined();
    });
})
describe("onAppOpenAttribution", () => {
    test('is function defined?', () => {
        expect(appsFlyer.onAppOpenAttribution).toBeDefined();
    });
})
