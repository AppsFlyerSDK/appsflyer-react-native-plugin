export type PrepaidPlanJson = {
  allowExtendAfterTime?: string;
};

export class PrepaidPlan {
  allowExtendAfterTime?: string;

  constructor(allowExtendAfterTime?: string) {
    this.allowExtendAfterTime = allowExtendAfterTime;
  }

  static fromJson(json: PrepaidPlanJson): PrepaidPlan {
    return new PrepaidPlan(json.allowExtendAfterTime);
  }

  toJson(): PrepaidPlanJson {
    return {
      allowExtendAfterTime: this.allowExtendAfterTime,
    };
  }
}
