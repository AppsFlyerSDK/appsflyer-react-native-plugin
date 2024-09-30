export type ProductPurchaseArgs = {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  developerPayload: string;
  orderId: string;
  purchaseType: number;
  acknowledgementState: number;
  purchaseToken: string;
  productId: string;
  quantity: number;
  obfuscatedExternalAccountId: string;
  obfuscatedExternalProfileId: string;
  regionCode: string;
};

export class ProductPurchase {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  developerPayload: string;
  orderId: string;
  purchaseType: number;
  acknowledgementState: number;
  purchaseToken: string;
  productId: string;
  quantity: number;
  obfuscatedExternalAccountId: string;
  obfuscatedExternalProfileId: string;
  regionCode: string;

  constructor(args: ProductPurchaseArgs) {
    this.kind = args.kind;
    this.purchaseTimeMillis = args.purchaseTimeMillis;
    this.purchaseState = args.purchaseState;
    this.consumptionState = args.consumptionState;
    this.developerPayload = args.developerPayload;
    this.orderId = args.orderId;
    this.purchaseType = args.purchaseType;
    this.acknowledgementState = args.acknowledgementState;
    this.purchaseToken = args.purchaseToken;
    this.productId = args.productId;
    this.quantity = args.quantity;
    this.obfuscatedExternalAccountId = args.obfuscatedExternalAccountId;
    this.obfuscatedExternalProfileId = args.obfuscatedExternalProfileId;
    this.regionCode = args.regionCode;
  }

  toJson(): Record<string, any> {
    return {
      kind: this.kind,
      purchaseTimeMillis: this.purchaseTimeMillis,
      purchaseState: this.purchaseState,
      consumptionState: this.consumptionState,
      developerPayload: this.developerPayload,
      orderId: this.orderId,
      purchaseType: this.purchaseType,
      acknowledgementState: this.acknowledgementState,
      purchaseToken: this.purchaseToken,
      productId: this.productId,
      quantity: this.quantity,
      obfuscatedExternalAccountId: this.obfuscatedExternalAccountId,
      obfuscatedExternalProfileId: this.obfuscatedExternalProfileId,
      regionCode: this.regionCode,
    };
  }

  static fromJson(json: any): ProductPurchase {
    return new ProductPurchase({
      kind: json.kind as string,
      purchaseTimeMillis: json.purchaseTimeMillis as string,
      purchaseState: json.purchaseState as number,
      consumptionState: json.consumptionState as number,
      developerPayload: json.developerPayload as string,
      orderId: json.orderId as string,
      purchaseType: json.purchaseType as number,
      acknowledgementState: json.acknowledgementState as number,
      purchaseToken: json.purchaseToken as string,
      productId: json.productId as string,
      quantity: json.quantity as number,
      obfuscatedExternalAccountId: json.obfuscatedExternalAccountId as string,
      obfuscatedExternalProfileId: json.obfuscatedExternalProfileId as string,
      regionCode: json.regionCode as string,
    });
  }
}

/**
 * // Usage:
 * // To convert to JSON:
 * const productPurchaseInstance = new ProductPurchase({ ...args });
 * const json = productPurchaseInstance.toJson();
 *
 * // To convert from JSON:
 * const json = {...json };
 * const productPurchaseInstance = ProductPurchase.fromJson(json);
 */
