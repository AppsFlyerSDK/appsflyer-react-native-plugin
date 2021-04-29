jestExpect = require('expect');
const deepLinkData = '{"status":"success","type":"onAppOpenAttribution","data":{"c":"firstCampign","campaign":"firstCampign","af_dp":"rnoaoaautomation://","link":"https://rnautomated.onelink.me/lraA/mySMScampign","deep_link_value":"OAOA","media_source":"SMS","af_sub1":"lala","pid":"SMS"}}';
describe('Organic install', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        // await device.launchApp();
    });

    afterEach(async () => {
        // await device.terminateApp();
    });

    afterAll(async () => {
        await device.terminateApp();
        await device.uninstallApp();
    });

    it('initSdk should return \'No \'devKey\' found or its empty\'', async () => {
        await expect(element(by.id('noDevKeyButton'))).toBeVisible();
        await element(by.id('noDevKeyButton')).tap();
        await expect(element(by.id('testResult'))).toHaveText('No \'devKey\' found or its empty');
    });

    it('initSdk should return Success organic GCD', async () => {
        await expect(element(by.id('successOrganicGCDButton'))).toBeVisible();
        await element(by.id('successOrganicGCDButton')).tap();
        const gcdAttr = await element(by.id('testResult')).getAttributes();
        jestExpect(gcdAttr.text).toContain('\"status\":\"success\"');
        jestExpect(gcdAttr.text).toContain('\"type\":\"onInstallConversionDataLoaded\"');
        jestExpect(gcdAttr.text).toContain('\"data\"');
        jestExpect(gcdAttr.text).toContain('\"is_first_launch\":true');
        jestExpect(gcdAttr.text).toContain('\"af_status\":\"Organic\"');
    });

    it('logEvent should return Success', async () => {
        await expect(element(by.id('logEventSuccessButton'))).toBeVisible();
        await element(by.id('logEventSuccessButton')).tap();
        await waitFor(element(by.text('Alert'))).toBeVisible().withTimeout(3000);
        await expect(element(by.text('Success'))).toHaveText('Success');
        await element(by.text('OK')).tap();
    });

    it('App goes to background and opens via deep link', async () => {
        await device.sendToHome();
        await device.launchApp({newInstance: false, url: 'https://rnautomated.onelink.me/lraA/mySMScampign'});
        await waitFor(element(by.text('Alert'))).toBeVisible().withTimeout(3000);
        await waitFor(element(by.text(`${deepLinkData}`))).toBeVisible().withTimeout(3000);
        await expect(element(by.text(`${deepLinkData}`))).toHaveText(deepLinkData);
    });
});
