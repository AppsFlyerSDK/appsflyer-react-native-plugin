export type DeferredItemReplacementJson = {
  productId: string;
};

export class DeferredItemReplacement {
  productId: string;

  constructor(productId: string) {
    this.productId = productId;
  }

  static fromJson(json: DeferredItemReplacementJson): DeferredItemReplacement {
    return new DeferredItemReplacement(json.productId);
  }

  toJson(): DeferredItemReplacementJson {
    return {
      productId: this.productId,
    };
  }
}
