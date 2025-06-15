import { IosError, JVMThrowable } from "../models";

// Type definition for a general-purpose listener.
export type PurchaseConnectorListener = (data: any) => void;

// Type definition for a listener which gets called when the `PurchaseConnectorImpl` receives purchase revenue validation info for iOS.
export type OnReceivePurchaseRevenueValidationInfo = (validationInfo?: Map<string, any>, error?: IosError) => void;

// Invoked when a 200 OK response is received from the server.
// Note: An INVALID purchase is considered to be a successful response and will also be returned by this callback.
export type OnResponse<T> = (result?: Map<string, T>) => void;

// Invoked when a network exception occurs or a non 200/OK response is received from the server.
export type OnFailure = (result: string, error?: JVMThrowable) => void;