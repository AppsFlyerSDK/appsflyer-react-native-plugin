class AppsFlyerConstants {
    // Adding method constants
    static readonly SUBSCRIPTION_VALIDATION_SUCCESS: string = 'subscriptionValidationSuccess';
    static readonly SUBSCRIPTION_VALIDATION_FAILURE: string = 'subscriptionValidationFailure';
    static readonly IN_APP_PURCHASE_VALIDATION_SUCCESS: string = 'inAppPurchaseValidationSuccess';
    static readonly IN_APP_PURCHASE_VALIDATION_FAILURE: string = 'inAppPurchaseValidationFailure';
    static readonly DID_RECEIVE_PURCHASE_REVENUE_VALIDATION_INFO: string =
      "onDidReceivePurchaseRevenueValidationInfo";
  
    // Adding key constants
    static readonly RESULT: string = "result";
    static readonly ERROR: string = "error";
  }
  
  export default AppsFlyerConstants;