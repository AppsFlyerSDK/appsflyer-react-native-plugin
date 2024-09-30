import { AutoRenewingPlanJson, AutoRenewingPlan } from "./auto_renewing_plan";
import { DeferredItemReplacementJson, DeferredItemReplacement } from "./deferred_item_replacement";
import { OfferDetailsJson, OfferDetails } from "./offer_details";
import { PrepaidPlanJson, PrepaidPlan } from "./prepaid_plan";

export type SubscriptionPurchaseLineItemJson = {
  productId: string;
  expiryTime: string;
  autoRenewingPlan?: AutoRenewingPlanJson;
  deferredItemReplacement?: DeferredItemReplacementJson;
  offerDetails?: OfferDetailsJson;
  prepaidPlan?: PrepaidPlanJson;
};

export class SubscriptionPurchaseLineItem {
  productId: string;
  expiryTime: string;
  autoRenewingPlan?: AutoRenewingPlan;
  deferredItemReplacement?: DeferredItemReplacement;
  offerDetails?: OfferDetails;
  prepaidPlan?: PrepaidPlan;

  constructor(
    productId: string,
    expiryTime: string,
    autoRenewingPlan?: AutoRenewingPlan,
    deferredItemReplacement?: DeferredItemReplacement,
    offerDetails?: OfferDetails,
    prepaidPlan?: PrepaidPlan
  ) {
    this.productId = productId;
    this.expiryTime = expiryTime;
    this.autoRenewingPlan = autoRenewingPlan;
    this.deferredItemReplacement = deferredItemReplacement;
    this.offerDetails = offerDetails;
    this.prepaidPlan = prepaidPlan;
  }

  static fromJson(
    json: SubscriptionPurchaseLineItemJson
  ): SubscriptionPurchaseLineItem {
    return new SubscriptionPurchaseLineItem(
      json.productId,
      json.expiryTime,
      json.autoRenewingPlan
        ? AutoRenewingPlan.fromJson(json.autoRenewingPlan)
        : undefined,
      json.deferredItemReplacement
        ? DeferredItemReplacement.fromJson(json.deferredItemReplacement)
        : undefined,
      json.offerDetails ? OfferDetails.fromJson(json.offerDetails) : undefined,
      json.prepaidPlan ? PrepaidPlan.fromJson(json.prepaidPlan) : undefined
    );
  }

  toJson(): SubscriptionPurchaseLineItemJson {
    return {
      productId: this.productId,
      expiryTime: this.expiryTime,
      autoRenewingPlan: this.autoRenewingPlan?.toJson(),
      deferredItemReplacement: this.deferredItemReplacement?.toJson(),
      offerDetails: this.offerDetails?.toJson(),
      prepaidPlan: this.prepaidPlan?.toJson(),
    };
  }
}
