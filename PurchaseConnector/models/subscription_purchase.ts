import { CanceledStateContext } from "./canceled_state_context";
import { ExternalAccountIdentifiers } from "./external_account_identifiers";
import { PausedStateContext } from "./paused_state_context";
import { SubscribeWithGoogleInfo } from "./subscribe_with_google_info";
import { SubscriptionPurchaseLineItem } from "./subscription_purchase_line_item";
import { TestPurchase } from "./test_purchase";

type SubscriptionPurchaseArgs = {
  acknowledgementState: string;
  canceledStateContext?: CanceledStateContext;
  externalAccountIdentifiers?: ExternalAccountIdentifiers;
  kind: string;
  latestOrderId: string;
  lineItems: SubscriptionPurchaseLineItem[];
  linkedPurchaseToken?: string;
  pausedStateContext?: PausedStateContext;
  regionCode: string;
  startTime: string;
  subscribeWithGoogleInfo?: SubscribeWithGoogleInfo;
  subscriptionState: string;
  testPurchase?: TestPurchase;
};

export class SubscriptionPurchase {
  acknowledgementState: string;
  canceledStateContext?: CanceledStateContext;
  externalAccountIdentifiers?: ExternalAccountIdentifiers;
  kind: string;
  latestOrderId: string;
  lineItems: SubscriptionPurchaseLineItem[];
  linkedPurchaseToken?: string;
  pausedStateContext?: PausedStateContext;
  regionCode: string;
  startTime: string;
  subscribeWithGoogleInfo?: SubscribeWithGoogleInfo;
  subscriptionState: string;
  testPurchase?: TestPurchase;

  constructor(args: SubscriptionPurchaseArgs) {
    this.acknowledgementState = args.acknowledgementState;
    this.canceledStateContext = args.canceledStateContext;
    this.externalAccountIdentifiers = args.externalAccountIdentifiers;
    this.kind = args.kind;
    this.latestOrderId = args.latestOrderId;
    this.lineItems = args.lineItems;
    this.linkedPurchaseToken = args.linkedPurchaseToken;
    this.pausedStateContext = args.pausedStateContext;
    this.regionCode = args.regionCode;
    this.startTime = args.startTime;
    this.subscribeWithGoogleInfo = args.subscribeWithGoogleInfo;
    this.subscriptionState = args.subscriptionState;
    this.testPurchase = args.testPurchase;
  }

  static fromJson(json: any): SubscriptionPurchase {
    return new SubscriptionPurchase({
      acknowledgementState: json.acknowledgementState as string,
      canceledStateContext: json.canceledStateContext,
      externalAccountIdentifiers: json.externalAccountIdentifiers,
      kind: json.kind as string,
      latestOrderId: json.latestOrderId as string,
      lineItems: json.lineItems,
      linkedPurchaseToken: json.linkedPurchaseToken as string,
      pausedStateContext: json.pausedStateContext,
      regionCode: json.regionCode as string,
      startTime: json.startTime as string,
      subscribeWithGoogleInfo: json.subscribeWithGoogleInfo,
      subscriptionState: json.subscriptionState as string,
      testPurchase: json.testPurchase,
    });
  }

  toJson(): Record<string, any> {
    return {
      acknowledgementState: this.acknowledgementState,
      canceledStateContext: this.canceledStateContext,
      externalAccountIdentifiers: this.externalAccountIdentifiers,
      kind: this.kind,
      latestOrderId: this.latestOrderId,
      lineItems: this.lineItems,
      linkedPurchaseToken: this.linkedPurchaseToken,
      pausedStateContext: this.pausedStateContext,
      regionCode: this.regionCode,
      startTime: this.startTime,
      subscribeWithGoogleInfo: this.subscribeWithGoogleInfo,
      subscriptionState: this.subscriptionState,
      testPurchase: this.testPurchase,
    };
  }
}

