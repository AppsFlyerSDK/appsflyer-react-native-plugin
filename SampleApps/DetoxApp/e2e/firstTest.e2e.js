describe('React-Native AppsFlyer Plugin', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        // await device.reloadReactNative();
    });

    afterAll(async () => {
        // await device.terminateApp();
    });

    it('initSdk should return Success', async () => {
        await expect(element(by.id('successInitButton'))).toBeVisible();
        await element(by.id('successInitButton')).tap();
        await expect(element(by.id('successInitResult'))).toHaveText('Success');
    });

    it('initSdk should return \'No \'devKey\' found or its empty\'', async () => {
        await expect(element(by.id('noDevKeyButton'))).toBeVisible();
        await element(by.id('noDevKeyButton')).tap();
        await expect(element(by.id('noDevKeyInitResult'))).toHaveText('No \'devKey\' found or its empty');
    });
});
