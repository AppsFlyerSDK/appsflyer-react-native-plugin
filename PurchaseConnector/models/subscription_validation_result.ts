import { SubscriptionPurchase } from "./subscription_purchase";
import { ValidationFailureData } from "./validation_failure_data";

export default class SubscriptionValidationResult {
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

  static fromJson(json: any): SubscriptionValidationResult {
    return new SubscriptionValidationResult(
      json.success,
      json.subscriptionPurchase,
      json.failureData
    );
  }

  toJson(): any {
    return {
      success: this.success,
      subscriptionPurchase: this.subscriptionPurchase,
      failureData: this.failureData,
    };
  }
}