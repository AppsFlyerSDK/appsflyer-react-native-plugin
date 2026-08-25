---
title: In-App Events
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 5
hidden: false
---

## In-App Events

In-App Events provide insight on what is happening in your app. It is recommended to take the time and define the events you want to measure to allow you to measure ROI (Return on Investment) and LTV (Lifetime Value).

**Note:** An In-App Event name must be no longer than 45 characters. Events names with more than 45 characters do not appear in the dashboard, but only in the raw Data, Pull and Push APIs.
Find more info about recording events [here](https://dev.appsflyer.com/hc/docs/in-app-events-sdk).

> 📘 Note
>
> For events with **revenue**, including in-app purchases, subscriptions, and ad revenue events, AppsFlyer customers with an ROI360 subscription should avoid setting the `'af_revenue'` parameter in their in-app events. Doing so can result in duplicate revenue being reported. Instead, they should utilize the  [ad revenue SDK API](https://dev.appsflyer.com/hc/docs/rn_api#logadrevenue).

**`logEvent(eventName, eventValues, awaitResponse?): Promise<string>`**

| parameter    | type     | description                                   |
| -----------  |----------|------------------------------------------     |
| eventName    | string   |  In-App Event name  |                      
| eventValues  | object   | The event values that are sent with the event 
| awaitResponse | boolean? | Optional. When true, waits for server round-trip before resolving the promise. Defaults to false. |                          


*Example:*
```javascript
const eventName = 'af_add_to_cart';
const eventValues = {
  af_content_id: 'id123',
  af_currency: 'USD',
  af_revenue: '2',
};

AppsFlyer.logEvent(eventName, eventValues, true)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.error(err);
  });
```

---

## In-App Purchase Validation

To validate and log in-app purchases, see the comprehensive [In-App Purchase Validation documentation in the API reference](/Docs/RN_API.md#validateandloginapppurchase).

For iOS, remember to set the sandbox flag if testing:
```javascript
AppsFlyer.setUseReceiptValidationSandbox(true);
```
