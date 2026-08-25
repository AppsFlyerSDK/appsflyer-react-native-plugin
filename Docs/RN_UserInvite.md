---
title: User invite
category: 5f9705393c689a065c409b23
parentDoc: 645213236f53a00d4daa9230
order: 10
hidden: false
---

# User invite


##### 1. `setAppInviteOneLink(oneLinkId)`

Set the OneLink ID that should be used for User-Invite-API.
The link that is generated for the user invite will use this OneLink ID as the base link ID.

| parameter       | type     | description               |
| ----------      |----------|------------------         |
| oneLinkId       | string   | oneLinkId                 |
 
 > 📘 Note
 > 
 > - Make sure to call `setAppInviteOneLink()` **before** calling `start`.
 > - The OneLink template must be assigned to the app. 

 ##### 2. `generateInviteLink(parameters?)`
 A complete list of supported parameters is available [here](https://support.appsflyer.com/hc/en-us/articles/115004480866-User-Invite-Tracking). Custom parameters can be passed using a userParams{} nested object, as shown in the example below.

 **Parameters:**

| parameter       | type                       | description                                  |
| ----------      |----------------------------|----------------------------------------------|
| channel         | string                     | channel for the invite (e.g., 'gmail')       |
| campaign        | string (optional)          | campaign name                                |
| customerID      | string (optional)          | customer/referrer ID                         |
| referrerName    | string (optional)          | name of the referrer                         |
| referrerImageUrl| string (optional)          | referrer's image URL                         |
| baseDeeplink    | string (optional)          | base deep link URL                           |
| brandDomain     | string (optional)          | brand domain for the invite link             |
| userParams      | object (optional)          | custom deep link parameters (nested object) |

 **Returns:** Promise resolving to either a string (Android) or an object with `{ url: string }` (iOS).
 
 

*Example:*

```javascript

// set the template ID before you generate a link. Without it UserInvite won't work.
AppsFlyer.setAppInviteOneLink('scVs');

// generate the user invite link
AppsFlyer.generateInviteLink({
  channel: 'gmail',
  campaign: 'myCampaign',
  customerID: '1234',
  referrerName: 'John Doe',
  brandDomain: 'myexample.com',
  userParams: {
    deep_link_value: 'value',
    deep_link_sub1: 'sub1',
    custom_param: 'custom',
  },
})
  .then((result) => {
    // iOS returns { url: string }, Android returns a string
    const link = typeof result === 'string' ? result : result.url;
    console.log('Generated invite link:', link);
  })
  .catch((err) => {
    console.error('Failed to generate invite link:', err);
  });
```

**Note:** Pass `brandDomain` as a top-level field, not inside `userParams` — nesting it sends it as a generic link parameter instead of setting the brand domain.

##### 3. `logInvite(channel?, eventParameters?)`

Log a user invite event to track when invites are sent.

| parameter       | type                | description                                      |
| ----------      |---------------------|--------------------------------------------------|
| channel         | string (optional)   | channel through which the invite was sent        |
| eventParameters | object (optional)   | additional event parameters                      |

*Example:*

```javascript
AppsFlyer.logInvite('gmail', {
  invitation_id: 'inv_123',
  recipient_count: 5,
});
```
