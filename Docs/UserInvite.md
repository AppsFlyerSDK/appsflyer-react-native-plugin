# User invite


##### 1. <a id="setCustomerUserId"> **`setCustomerUserId(userId, callback)`**

Setting your own Custom ID enables you to cross-reference your own unique ID with AppsFlyer’s user ID and the other devices’ IDs. This ID is available in AppsFlyer CSV reports along with postbacks APIs for cross-referencing with you internal IDs.<br>
If you wish to see the CUID (Customer User ID) under your installs raw data reports, it should be called before starting the SDK.<br>
If you simply would like to add additional user id to the events raw data reports, then you can freely call it anytime you need.


| parameter | type     | description      |
| ----------|----------|------------------|
| userId    | string   | user ID          |
| callback  | function | success callback |

 
 
 ##### 2. <a id="generateInviteLink"> **`generateInviteLink(parameters, success, error)`**
 A complete list of supported parameters is available [here](https://support.appsflyer.com/hc/en-us/articles/115004480866-User-Invite-Tracking). Custom parameters can be passed using a userParams{} nested object, as in the example above.


| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| parameters      | json     | parameters for Invite link       |
| success         | function | success callback (generated link)|
| error           | function | error callback                   |
 
 

*Example:*

```javascript

// set the tamplate ID before you generate a link. Without it UserInvite won't work.
appsFlyer.setAppInviteOneLinkID('scVs', null, null);

// set the user invite params
appsFlyer.generateInviteLink(
 {
   channel: 'gmail',
   campaign: 'myCampaign',
   customerID: '1234',
   deep_link_value : 'value', // deep link param
   deep_link_sub1 : 'sub1', // deep link param
   userParams: {
     myParam: 'newUser',
     anotherParam: 'fromWeb',
     amount: 1,
   },
 },
 (link) => {
   console.log(link);
 },
 (err) => {
   console.log(err);
 }
);
```
