# User invite
A complete list of supported parameters is available [here](https://support.appsflyer.com/hc/en-us/articles/115004480866-User-Invite-Tracking). Custom parameters can be passed using a userParams{} nested object, as in the example above.

| parameter       | type     | description                      |
| ----------      |----------|------------------                |
| parameters      | json     | parameters for Invite link       |
| success         | function | success callback (generated link)|
| error           | function | error callback                   |


*Example:*

```javascript

// set the tamplate ID, without it UserInvite won't work
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