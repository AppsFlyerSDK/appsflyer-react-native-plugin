interface TestPurchaseJson {}

export class TestPurchase {
  constructor() {}

  static fromJson(_json: TestPurchaseJson): TestPurchase {
    return new TestPurchase();
  }

  toJson(): TestPurchaseJson {
    return {};
  }
}
