export type MoneyArgs = {
  currencyCode: string;
  nanos: number;
  units: number;
};

export class Money {
  currencyCode: string;
  nanos: number;
  units: number;

  constructor(currencyCode: string, nanos: number, units: number) {
    this.currencyCode = currencyCode;
    this.nanos = nanos;
    this.units = units;
  }

  static fromJson(json: MoneyArgs): Money {
    return new Money(json.currencyCode, json.nanos, json.units);
  }

  toJson(): MoneyArgs {
    return {
      currencyCode: this.currencyCode,
      nanos: this.nanos,
      units: this.units,
    };
  }
}
