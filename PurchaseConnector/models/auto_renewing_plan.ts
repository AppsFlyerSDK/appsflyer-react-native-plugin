import { SubscriptionItemPriceChangeDetailsJson, SubscriptionItemPriceChangeDetails } from "./subscription_item_price_change_details";

export type AutoRenewingPlanJson = {
  autoRenewEnabled?: boolean;
  priceChangeDetails?: SubscriptionItemPriceChangeDetailsJson;
};

export class AutoRenewingPlan {
  autoRenewEnabled?: boolean;
  priceChangeDetails?: SubscriptionItemPriceChangeDetails;

  constructor(
    autoRenewEnabled?: boolean,
    priceChangeDetails?: SubscriptionItemPriceChangeDetails
  ) {
    this.autoRenewEnabled = autoRenewEnabled;
    this.priceChangeDetails = priceChangeDetails;
  }

  static fromJson(json: AutoRenewingPlanJson): AutoRenewingPlan {
    return new AutoRenewingPlan(
      json.autoRenewEnabled,
      json.priceChangeDetails &&
        SubscriptionItemPriceChangeDetails.fromJson(json.priceChangeDetails)
    );
  }

  toJson(): AutoRenewingPlanJson {
    return {
      autoRenewEnabled: this.autoRenewEnabled,
      priceChangeDetails: this.priceChangeDetails?.toJson(),
    };
  }
}
