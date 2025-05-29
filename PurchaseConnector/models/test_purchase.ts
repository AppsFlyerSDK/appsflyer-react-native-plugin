interface TestPurchaseJson {}

export class TestPurchase {
  constructor() {}

  static fromJson(json: TestPurchaseJson): TestPurchase {
    return new TestPurchase();
  }

  toJson(): TestPurchaseJson {
    return {};
  }
}
