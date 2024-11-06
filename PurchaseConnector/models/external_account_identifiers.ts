export type ExternalAccountIdentifiersJson = {
  externalAccountId: string;
  obfuscatedExternalAccountId: string;
  obfuscatedExternalProfileId: string;
};

export class ExternalAccountIdentifiers {
  externalAccountId: string;
  obfuscatedExternalAccountId: string;
  obfuscatedExternalProfileId: string;

  constructor(
    externalAccountId: string,
    obfuscatedExternalAccountId: string,
    obfuscatedExternalProfileId: string
  ) {
    this.externalAccountId = externalAccountId;
    this.obfuscatedExternalAccountId = obfuscatedExternalAccountId;
    this.obfuscatedExternalProfileId = obfuscatedExternalProfileId;
  }

  static fromJson(
    json: ExternalAccountIdentifiersJson
  ): ExternalAccountIdentifiers {
    return new ExternalAccountIdentifiers(
      json.externalAccountId,
      json.obfuscatedExternalAccountId,
      json.obfuscatedExternalProfileId
    );
  }

  toJson(): ExternalAccountIdentifiersJson {
    return {
      externalAccountId: this.externalAccountId,
      obfuscatedExternalAccountId: this.obfuscatedExternalAccountId,
      obfuscatedExternalProfileId: this.obfuscatedExternalProfileId,
    };
  }
}
