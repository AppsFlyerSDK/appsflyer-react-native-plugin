import { ProductPurchase } from "./product_purchase";
import { ValidationFailureData } from "./validation_failure_data";

export class InAppPurchaseValidationResult {
    success: boolean;
    productPurchase?: ProductPurchase;
    failureData?: ValidationFailureData;
  
    constructor(
      success: boolean,
      productPurchase?: ProductPurchase,
      failureData?: ValidationFailureData
    ) {
      this.success = success;
      this.productPurchase = productPurchase;
      this.failureData = failureData;
    }
  
    static fromJson(json: any): InAppPurchaseValidationResult {
      return new InAppPurchaseValidationResult(
        json.success,
        json.productPurchase,
        json.failureData
      );
    }
  
    toJson(): any {
      return {
        success: this.success,
        productPurchase: this.productPurchase,
        failureData: this.failureData,
      };
    }
  }