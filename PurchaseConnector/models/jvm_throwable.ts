// TypeScript class for JVM Throwable
export class JVMThrowable {
  type: string;
  message: string;
  stacktrace: string;
  cause: JVMThrowable | null;

  constructor(
    type: string,
    message: string,
    stacktrace: string,
    cause: JVMThrowable | null
  ) {
    this.type = type;
    this.message = message;
    this.stacktrace = stacktrace;
    this.cause = cause;
  }

  // Converts the class instance to a JSON object
  toJson(): object {
    return {
      type: this.type,
      message: this.message,
      stacktrace: this.stacktrace,
      cause: this.cause?.toJson(),
    };
  }

  // Creates an instance of the class from a JSON object
  static fromJson(json: any): JVMThrowable {
    return new JVMThrowable(
      json.type,
      json.message,
      json.stacktrace,
      json.cause ? JVMThrowable.fromJson(json.cause) : null
    );
  }
}

/**
 * Usage example:
 * // Creating an instance of JVMThrowable
 * const jvmThrowable = new JVMThrowable('ExceptionType', 'An exception occurred', 'stacktraceString', null);
 *
 * // Display information about the JVM throwable
 * console.log(jvmThrowable.type);          // Outputs: ExceptionType
 * console.log(jvmThrowable.message);       // Outputs: An exception occurred
 * console.log(jvmThrowable.stacktrace);    // Outputs: stacktraceString
 * console.log(jvmThrowable.cause);         // Outputs: null (since no cause is provided here)
 *
 * // Serializing JVMThrowable instance to a JSON object
 * const jvmThrowableJson = jvmThrowable.toJson();
 * console.log(jvmThrowableJson); // Outputs: { type: 'ExceptionType', message: 'An exception occurred', stacktrace: 'stacktraceString', cause: null }
 *
 * const jvmThrowableData = {
 *   type: 'RuntimeException',
 *   message: 'Failed to load resource',
 *   stacktrace: 'stacktrace info here',
 *   cause: null // Alternatively, you could nest another throwable here if there is one
 * };
 *
 * // Deserializing the parsed JSON into instance JVMThrowable
 * const deserializedJVMThrowable = JVMThrowable.fromJson(jvmThrowableData);
 * console.log(deserializedJVMThrowable);
 */
