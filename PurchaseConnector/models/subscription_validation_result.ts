import { SubscriptionPurchase } from "./subscription_purchase";
import { ValidationFailureData } from "./validation_failure_data";

type SubscriptionValidationResultArgs = {
  success: boolean;
  subscriptionPurchase?: SubscriptionPurchase;
  failureData?: ValidationFailureData;
};

class SubscriptionValidationResult {
  success: boolean;
  subscriptionPurchase?: SubscriptionPurchase;
  failureData?: ValidationFailureData;

  constructor(
    success: boolean,
    subscriptionPurchase?: SubscriptionPurchase,
    failureData?: ValidationFailureData
  ) {
    this.success = success;
    this.subscriptionPurchase = subscriptionPurchase;
    this.failureData = failureData;
  }

  static fromJson(json: { [key: string]: any }): SubscriptionValidationResult {
    const subscriptionPurchaseInstance = json.subscriptionPurchase
      ? SubscriptionPurchase.fromJson(json.subscriptionPurchase)
      : undefined;

    const failureDataInstance = json.failureData
      ? ValidationFailureData.fromJson(json.failureData)
      : undefined;

    return new SubscriptionValidationResult(
      json.success,
      subscriptionPurchaseInstance,
      failureDataInstance
    );
  }

  toJson(): SubscriptionValidationResultArgs {
    return {
      success: this.success,
      subscriptionPurchase: this.subscriptionPurchase,
      failureData: this.failureData,
    };
  }
}

export default SubscriptionValidationResult;
