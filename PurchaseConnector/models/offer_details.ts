export type OfferDetailsJson = {
  offerTags?: string[];
  basePlanId: string;
  offerId?: string;
};

export class OfferDetails {
  offerTags?: string[];
  basePlanId: string;
  offerId?: string;

  constructor(
    offerTags: string[] | undefined,
    basePlanId: string,
    offerId: string | undefined
  ) {
    this.offerTags = offerTags;
    this.basePlanId = basePlanId;
    this.offerId = offerId;
  }

  static fromJson(json: OfferDetailsJson): OfferDetails {
    return new OfferDetails(json.offerTags, json.basePlanId, json.offerId);
  }

  toJson(): OfferDetailsJson {
    return {
      offerTags: this.offerTags,
      basePlanId: this.basePlanId,
      offerId: this.offerId,
    };
  }
}
