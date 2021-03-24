import {beforeEach, describe, jest, test} from "@jest/globals";
import {NativeModules} from 'react-native';
import appsFlyer from "../index";

describe('initSdk', () => {
    beforeEach(() => {
        NativeModules.RNAppsFlyer = {
            ...NativeModules.RNAppsFlyer,
        }
    });
    test('initSdk with params and callback: should return success', () => {
        expect(appsFlyer.initSdk).toBeDefined();
    });
});

describe("logEvent", () => {
    test('is function defined?', () => {
        expect(appsFlyer.logEvent).toBeDefined();
    });
})

describe("logLocation", () => {
    test('is function defined?', () => {
        expect(appsFlyer.logLocation).toBeDefined();
    });
})

describe("setUserEmails", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setUserEmails).toBeDefined();
    });
})

describe("setAdditionalData", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setAdditionalData).toBeDefined();
    });
})

describe("getAppsFlyerUID", () => {
    test('is function defined?', () => {
        expect(appsFlyer.getAppsFlyerUID).toBeDefined();
    });
})

describe("updateServerUninstallToken", () => {
    test('is function defined?', () => {
        expect(appsFlyer.updateServerUninstallToken).toBeDefined();
    });
})

describe("setCustomerUserId", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setCustomerUserId).toBeDefined();
    });
})

describe("stop", () => {
    test('is function defined?', () => {
        expect(appsFlyer.stop).toBeDefined();
    });
})

describe("setCollectIMEI", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setCollectIMEI).toBeDefined();
    });
})

describe("setCollectAndroidID", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setCollectAndroidID).toBeDefined();
    });
})

describe("setAppInviteOneLinkID", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setAppInviteOneLinkID).toBeDefined();
    });
})

describe("generateInviteLink", () => {
    test('is function defined?', () => {
        expect(appsFlyer.generateInviteLink).toBeDefined();
    });
})

describe("logCrossPromotionImpression", () => {
    test('is function defined?', () => {
        expect(appsFlyer.logCrossPromotionImpression).toBeDefined();
    });
})

describe("logCrossPromotionAndOpenStore", () => {
    test('is function defined?', () => {
        expect(appsFlyer.logCrossPromotionAndOpenStore).toBeDefined();
    });
})

describe("setCurrencyCode", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setCurrencyCode).toBeDefined();
    });
})

describe("anonymizeUser", () => {
    test('is function defined?', () => {
        expect(appsFlyer.anonymizeUser).toBeDefined();
    });
})

describe("setOneLinkCustomDomains", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setOneLinkCustomDomains).toBeDefined();
    });
})

describe("setResolveDeepLinkURLs", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setResolveDeepLinkURLs).toBeDefined();
    });
})

describe("performOnAppAttribution", () => {
    test('is function defined?', () => {
        expect(appsFlyer.performOnAppAttribution).toBeDefined();
    });
})

describe("setSharingFilterForAllPartners", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setSharingFilterForAllPartners).toBeDefined();
    });
})

describe("setSharingFilter", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setSharingFilter).toBeDefined();
    });
})

describe("disableAdvertisingIdentifier", () => {
    test('is function defined?', () => {
        expect(appsFlyer.disableAdvertisingIdentifier).toBeDefined();
    })
})

describe("disableCollectASA", () => {
    test('is function defined?', () => {
        expect(appsFlyer.disableCollectASA).toBeDefined();
    });
})

describe("validateAndLogInAppPurchase", () => {
    test('is function defined?', () => {
        expect(appsFlyer.validateAndLogInAppPurchase).toBeDefined();
    });
})

describe("setUseReceiptValidationSandbox", () => {
    test('is function defined?', () => {
        expect(appsFlyer.setUseReceiptValidationSandbox).toBeDefined();
    });
})

describe("sendPushNotificationData", () => {
    test('is function defined?', () => {
        expect(appsFlyer.sendPushNotificationData).toBeDefined();
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
