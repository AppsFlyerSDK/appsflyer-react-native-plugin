export class MissingConfigurationException extends Error {
  constructor() {
    super("Missing configuration for PurchaseConnector");
  }
}
