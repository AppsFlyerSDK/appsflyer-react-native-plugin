---
title: In-App Events
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 5
hidden: false
---

## In-App events

In-App Events provide insight on what is happening in your app. It is recommended to take the time and define the events you want to measure to allow you to measure ROI (Return on Investment) and LTV (Lifetime Value).

Recording in-app events is performed by calling logEvent with event name and value parameters. See In-App Events documentation for more details.

**Note:** An In-App Event name must be no longer than 45 characters. Events names with more than 45 characters do not appear in the dashboard, but only in the raw Data, Pull and Push APIs.
Find more info about recording events [here](https://dev.appsflyer.com/hc/docs/in-app-events-sdk).

## Send Event

> 📘 Note
>
> For events with **revenue**, including in-app purchases, subscriptions, and ad revenue events, AppsFlyer customers with an ROI360 subscription should avoid using the `AFInAppEvents.REVENUE`(`af_revenue`) parameter in their in-app events. Doing so can result in duplicate revenue being reported. Instead, they should utilize the  [ad revenue SDK API](https://dev.appsflyer.com/hc/docs/rn_api#logadrevenue).

**`logEvent(eventName, eventValues, success, error)`**

| parameter    | type     | description                                   |
| -----------  |----------|------------------------------------------     |
| eventName    | string   |  In-App Event name  |                      
| eventValues  | json     | The event values that are sent with the event 
| success      | function | success callback |                             
| error        | function | error callback |                          


*Example:*
```javascript
const eventName = 'af_add_to_cart';
const eventValues = {
  af_content_id: 'id123',
  af_currency: 'USD',
  af_revenue: '2',
};

appsFlyer.logEvent(
  eventName,
  eventValues,
  (res) => {
    console.log(res);
  },
  (err) => {
    console.error(err);
  }
);
```

---
## In-app purchase validation

> ⚠️ **`callback` is currently inert**: no native event delivers a validation result yet — this
> call only dispatches the RPC. See the [API reference](/Docs/RN_API.md#validateandloginapppurchase)
> for the full signature and `AFPurchaseDetails`/`AFPurchaseType` shapes.

Receipt validation is a secure mechanism whereby the payment platform (e.g. Apple or Google) validates that an in-app purchase indeed occurred as reported.
Learn more [here](https://support.appsflyer.com/hc/en-us/articles/207032106-Receipt-validation-for-in-app-purchases).

❗Important❗ for iOS - set SandBox to ```true```
```appsFlyer.setUseReceiptValidationSandbox(true);```

| parameter            | type                 | description                                   |
| -------------------- | -------------------- | ---------------------------------------------- |
| purchaseDetails      | `AFPurchaseDetails`  | `{ purchaseType, transactionId, productId }`   |
| additionalParameters | object               | extra data to attach to the validation request |
| callback             | function             | currently inert — see note above               |

*Example:*

```javascript
import appsFlyer, { AFPurchaseType } from 'react-native-appsflyer';

const purchaseDetails = {
  purchaseType: AFPurchaseType.ONE_TIME_PURCHASE,
  transactionId: '1000000614252747',
  productId: 'identifier',
};

appsFlyer.validateAndLogInAppPurchase(purchaseDetails, { foo: 'bar' });
```
