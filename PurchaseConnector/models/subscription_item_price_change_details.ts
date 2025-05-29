import { Money, MoneyArgs } from "./money_model";

export type SubscriptionItemPriceChangeDetailsJson = {
  expectedNewPriceChargeTime: string;
  priceChangeMode: string;
  priceChangeState: string;
  newPrice?: MoneyArgs;
};

export class SubscriptionItemPriceChangeDetails {
  expectedNewPriceChargeTime: string;
  priceChangeMode: string;
  priceChangeState: string;
  newPrice?: Money;

  constructor(
    expectedNewPriceChargeTime: string,
    priceChangeMode: string,
    priceChangeState: string,
    newPrice?: Money
  ) {
    this.expectedNewPriceChargeTime = expectedNewPriceChargeTime;
    this.priceChangeMode = priceChangeMode;
    this.priceChangeState = priceChangeState;
    this.newPrice = newPrice;
  }

  static fromJson(
    json: SubscriptionItemPriceChangeDetailsJson
  ): SubscriptionItemPriceChangeDetails {
    const newPriceInstance = json.newPrice
      ? Money.fromJson(json.newPrice)
      : undefined;

    return new SubscriptionItemPriceChangeDetails(
      json.expectedNewPriceChargeTime,
      json.priceChangeMode,
      json.priceChangeState,
      newPriceInstance
    );
  }

  toJson(): SubscriptionItemPriceChangeDetailsJson {
    return {
      expectedNewPriceChargeTime: this.expectedNewPriceChargeTime,
      priceChangeMode: this.priceChangeMode,
      priceChangeState: this.priceChangeState,
      newPrice: this.newPrice ? this.newPrice.toJson() : undefined,
    };
  }
}
