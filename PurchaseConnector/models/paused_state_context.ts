type PausedStateContextJson = {
  autoResumeTime: string;
};

export class PausedStateContext {
  autoResumeTime: string;

  constructor(autoResumeTime: string) {
    this.autoResumeTime = autoResumeTime;
  }

  static fromJson(json: PausedStateContextJson): PausedStateContext {
    return new PausedStateContext(json.autoResumeTime);
  }

  toJson(): PausedStateContextJson {
    return {
      autoResumeTime: this.autoResumeTime,
    };
  }
}
