class AppsFlyerConstants {
    static readonly RE_CONFIGURE_ERROR_MSG: string = "[PurchaseConnector] Re configure instance is not permitted. Returned the existing instance";
    static readonly MISSING_CONFIGURATION_EXCEPTION_MSG: string = "Could not create an instance without configuration";
      
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
    static readonly VALIDATION_INFO: string = "validationInfo";
    static readonly CONFIGURE_KEY: string = "configure";
    static readonly LOG_SUBS_KEY: string = "logSubscriptions";
    static readonly LOG_IN_APP_KEY: string = "logInApps";
    static readonly SANDBOX_KEY: string = "sandbox";
  }
  
  export default AppsFlyerConstants;