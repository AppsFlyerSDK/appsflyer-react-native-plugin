// TypeScript class for IOS Error
export class IosError {
  localizedDescription: string;
  domain: string;
  code: number;

  constructor(localizedDescription: string, domain: string, code: number) {
    this.localizedDescription = localizedDescription;
    this.domain = domain;
    this.code = code;
  }

  // Converts the class instance to a JSON object
  toJson(): object {
    return {
      localizedDescription: this.localizedDescription,
      domain: this.domain,
      code: this.code,
    };
  }

  // Creates an instance of the class from a JSON object
  static fromJson(json: any): IosError {
    return new IosError(json.localizedDescription, json.domain, json.code);
  }
}

/**
 * Usage example:
 * // Creating an instance of IosError
 * const iosError = new IosError('An error occurred.', 'com.example.domain', 100);
 *
 * // Display information about the IOS error
 * console.log(iosError.localizedDescription); // Outputs: An error occurred.
 * console.log(iosError.domain);             // Outputs: com.example.domain
 * console.log(iosError.code);               // Outputs: 100
 *
 * // Serializing IosError instance to a JSON object
 * const iosErrorJson = iosError.toJson();
 * console.log(iosErrorJson); // Outputs: { localizedDescription: 'An error occurred.', domain: 'com.example.domain', code: 100 }
 *
 * // Sample JSON objects
 * const iosErrorData = {
 *    localizedDescription: 'A network error occurred.',
 *    domain: 'com.example.network',
 *    code: 404
 * };
 *
 * // Deserializing the parsed JSON into instance of IosError
 * const deserializedIosError = IosError.fromJson(iosErrorData);
 * console.log(deserializedIosError);
 */
