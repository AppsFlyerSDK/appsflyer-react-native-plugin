export class CanceledStateContext {
  developerInitiatedCancellation?: DeveloperInitiatedCancellation;
  replacementCancellation?: ReplacementCancellation;
  systemInitiatedCancellation?: SystemInitiatedCancellation;
  userInitiatedCancellation?: UserInitiatedCancellation;

  constructor(
    developerInitiatedCancellation?: DeveloperInitiatedCancellation,
    replacementCancellation?: ReplacementCancellation,
    systemInitiatedCancellation?: SystemInitiatedCancellation,
    userInitiatedCancellation?: UserInitiatedCancellation
  ) {
    this.developerInitiatedCancellation = developerInitiatedCancellation;
    this.replacementCancellation = replacementCancellation;
    this.systemInitiatedCancellation = systemInitiatedCancellation;
    this.userInitiatedCancellation = userInitiatedCancellation;
  }

  static fromJson(json: any): CanceledStateContext {
    return new CanceledStateContext(
      json.developerInitiatedCancellation != null
        ? DeveloperInitiatedCancellation.fromJson(
            json.developerInitiatedCancellation
          )
        : undefined,
      json.replacementCancellation != null
        ? ReplacementCancellation.fromJson(json.replacementCancellation)
        : undefined,
      json.systemInitiatedCancellation != null
        ? SystemInitiatedCancellation.fromJson(json.systemInitiatedCancellation)
        : undefined,
      json.userInitiatedCancellation != null
        ? UserInitiatedCancellation.fromJson(json.userInitiatedCancellation)
        : undefined
    );
  }

  toJson(): Record<string, any> {
    return {
      developerInitiatedCancellation:
        this.developerInitiatedCancellation?.toJson(),
      replacementCancellation: this.replacementCancellation?.toJson(),
      systemInitiatedCancellation: this.systemInitiatedCancellation?.toJson(),
      userInitiatedCancellation: this.userInitiatedCancellation?.toJson(),
    };
  }
}

/**
 * TODO: Need to check each state context further...
 */
class DeveloperInitiatedCancellation {
  constructor() {}

  static fromJson(_json: any): DeveloperInitiatedCancellation {
    // Here you would implement the conversion from JSON to DeveloperInitiatedCancellation instance
    return new DeveloperInitiatedCancellation();
  }

  toJson(): Record<string, unknown> {
    // Here you would implement the conversion from DeveloperInitiatedCancellation instance to JSON
    return {};
  }
}

class ReplacementCancellation {
  constructor() {}

  static fromJson(_json: any): ReplacementCancellation {
    // Here you would implement the conversion from JSON to ReplacementCancellation instance
    return new ReplacementCancellation();
  }

  toJson(): Record<string, unknown> {
    return {};
  }
}

class SystemInitiatedCancellation {
  constructor() {}

  static fromJson(_json: any): SystemInitiatedCancellation {
    // Here you would implement the conversion from JSON to SystemInitiatedCancellation instance
    return new SystemInitiatedCancellation();
  }

  toJson(): Record<string, unknown> {
    // Here you would implement the conversion from SystemInitiatedCancellation instance to JSON
    return {};
  }
}

class UserInitiatedCancellation {
  cancelSurveyResult?: CancelSurveyResult; // Made optional as per Dart's CancelSurveyResult? declaration
  cancelTime: string;

  constructor(
    cancelSurveyResult: CancelSurveyResult | undefined,
    cancelTime: string
  ) {
    this.cancelSurveyResult = cancelSurveyResult;
    this.cancelTime = cancelTime;
  }

  static fromJson(json: any): UserInitiatedCancellation {
    return new UserInitiatedCancellation(
      json.cancelSurveyResult != null
        ? CancelSurveyResult.fromJson(json.cancelSurveyResult)
        : undefined,
      json.cancelTime
    );
  }

  toJson(): Record<string, unknown> {
    return {
      cancelSurveyResult: this.cancelSurveyResult?.toJson(),
      cancelTime: this.cancelTime,
    };
  }
}

class CancelSurveyResult {
  reason: string;
  reasonUserInput: string;

  constructor(reason: string, reasonUserInput: string) {
    this.reason = reason;
    this.reasonUserInput = reasonUserInput;
  }

  static fromJson(json: any): CancelSurveyResult {
    return new CancelSurveyResult(json.reason, json.reasonUserInput);
  }

  toJson(): Record<string, string> {
    return {
      reason: this.reason,
      reasonUserInput: this.reasonUserInput,
    };
  }
}
