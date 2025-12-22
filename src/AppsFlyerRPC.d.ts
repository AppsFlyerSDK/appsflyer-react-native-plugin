export interface InitializeOptions {
  devKey: string;
  appId: string;
}

export interface WaitForATTOptions {
  timeout?: number;
}

export interface StartOptions {
  awaitResponse?: boolean;
}

export interface EventValues {
  [key: string]: string | number | boolean | null | undefined;
}

export interface LogEventOptions {
  eventValues?: EventValues;
  awaitResponse?: boolean;
}

export interface AttributionData {
  status: 'Non-organic' | 'Organic';
  type?: string;
  is_first_launch?: boolean;
  media_source?: string;
  campaign?: string;
  af_status?: string;
  af_message?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface DeepLinkData {
  deep_link_value?: string;
  campaign?: string;
  deep_link_sub1?: string;
  deep_link_sub2?: string;
  deep_link_sub3?: string;
  deep_link_sub4?: string;
  deep_link_sub5?: string;
  is_deferred?: boolean;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ConversionCallbacks {
  onSuccess?: (data: AttributionData) => void;
  onFail?: (error: { error: string }) => void;
}

export interface DeepLinkCallback {
  onDeepLink?: (data: DeepLinkData) => void;
}

export interface AppOpenAttributionCallbacks {
  onSuccess?: (data: Record<string, string>) => void;
  onFailure?: (error: { error: string }) => void;
}

export interface LogEventResult {
  statusCode?: number;
  message?: string;
  eventName: string;
  eventValues: EventValues;
  timestamp: string;
  [key: string]: string | number | boolean | null | undefined;
}

export class AppsFlyerRPCError extends Error {
  code: number;
  details: any;
  constructor(code: number, message: string, details: any);
  toString(): string;
}

declare class AppsFlyerRPC {
  static instance: AppsFlyerRPC;
  initialize(options: InitializeOptions): Promise<void>;
  setDebug(enabled: boolean): Promise<void>;
  waitForATT(options?: WaitForATTOptions): Promise<void>;
  registerConversionListener(): Promise<void>;
  setConversionCallbacks(callbacks: ConversionCallbacks): void;
  clearConversionCallbacks(): void;
  registerDeepLinkListener(): Promise<void>;
  setDeepLinkCallback(callback: DeepLinkCallback): void;
  clearDeepLinkCallback(): void;
  start(options?: StartOptions): Promise<AttributionData | null>;
  startWithCallback(): Promise<AttributionData | null>;
  logEvent(eventName: string, options?: LogEventOptions): Promise<LogEventResult | null>;
  logEventWithCallback(eventName: string, options?: LogEventOptions): Promise<LogEventResult | null>;
  setAppOpenAttributionCallbacks(callbacks: AppOpenAttributionCallbacks): void;
  clearAppOpenAttributionCallbacks(): void;
  cleanup(): void;
}

export default AppsFlyerRPC;

