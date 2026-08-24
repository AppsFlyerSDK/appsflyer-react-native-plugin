import { NativeEventEmitter, Platform } from 'react-native';
import NativeAppsFlyer from './NativeAppsFlyer';
import type { RpcTransport, RpcEvent, ListenerHandle } from '@appsflyer-sdk/js-core-plugin';

const RPC_EVENT_NAME = 'RNAppsFlyer_rpcEvent';

const appsFlyerEventEmitter = new NativeEventEmitter(NativeAppsFlyer as never);

// Adapts executeRpc + the shared RNAppsFlyer_rpcEvent event to @appsflyer-sdk/js-core-plugin's RpcTransport interface — the only framework-specific glue this repo owns.
export class RNTransport implements RpcTransport {
  readonly platform = Platform.OS as 'ios' | 'android';

  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const requestJson = JSON.stringify({ method, params });
    const responseJson = await NativeAppsFlyer.executeRpc(requestJson);
    const response = JSON.parse(responseJson) as
      | { success: true; data: T }
      | { success: false; error: { code: number | string; message: string } };
    if (!response.success) {
      return Promise.reject(response.error);
    }
    return response.data;
  }

  subscribe(listener: (event: RpcEvent) => void): ListenerHandle {
    // envelope.data arrives as a native JSON object/array on both platforms, never a stringified string.
    const subscription = appsFlyerEventEmitter.addListener(RPC_EVENT_NAME, (envelopeRaw: unknown) => {
      let envelope: RpcEvent;
      try {
        envelope = typeof envelopeRaw === 'string' ? JSON.parse(envelopeRaw) : (envelopeRaw as RpcEvent);
      } catch (error) {
        console.error('AppsFlyer: failed to parse native RPC event envelope', error);
        return;
      }
      listener(envelope);
    });
    return {
      remove: () => subscription.remove(),
    };
  }
}
