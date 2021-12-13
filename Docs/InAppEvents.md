# In-App events

In-App Events provide insight on what is happening in your app. It is recommended to take the time and define the events you want to measure to allow you to measure ROI (Return on Investment) and LTV (Lifetime Value).

Recording in-app events is performed by calling sendEvent with event name and value parameters. See In-App Events documentation for more details.

**Note:** An In-App Event name must be no longer than 45 characters. Events names with more than 45 characters do not appear in the dashboard, but only in the raw Data, Pull and Push APIs.
Find more info about recording events [here](https://support.appsflyer.com/hc/en-us/articles/115005544169-Rich-in-app-events-guide#introduction).

## Send Event

**`logEvent(eventName, eventValues, success, error)`**
| parameter    | type     | description                                   |
| -----------  |----------|------------------------------------------     |
| eventName    | string   |  In-App Event name                       
| eventValues  | json     | The event values that are sent with the event 
| success      | function | success callback                              
| error        | function | success callback                              
|

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