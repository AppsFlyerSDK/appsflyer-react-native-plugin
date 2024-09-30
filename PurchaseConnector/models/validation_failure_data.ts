export type ValidationFailureDataJson = {
  status: number;
  description: string;
};

export class ValidationFailureData {
  status: number;
  description: string;

  constructor(status: number, description: string) {
    this.status = status;
    this.description = description;
  }

  static fromJson(json: ValidationFailureDataJson): ValidationFailureData {
    return new ValidationFailureData(json.status, json.description);
  }

  toJson(): ValidationFailureDataJson {
    return {
      status: this.status,
      description: this.description,
    };
  }
}
