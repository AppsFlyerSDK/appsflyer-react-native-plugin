import { NativeEventEmitter, Platform } from 'react-native';
import NativeAppsFlyer from './NativeAppsFlyer';
import type { RpcTransport, RpcEvent, ListenerHandle } from '@appsflyer-sdk/js-core-plugin';

const RPC_EVENT_NAME = 'RNAppsFlyer_rpcEvent';

const appsFlyerEventEmitter = new NativeEventEmitter(NativeAppsFlyer as never);

/**
 * Adapts this plugin's existing TurboModule (executeRpc + the shared
 * RNAppsFlyer_rpcEvent event) to the RpcTransport interface
 * @appsflyer-sdk/js-core-plugin expects. This is the only framework-specific glue
 * this repo owns — all SDK method logic, including per-platform wire
 * method-name/param resolution, lives in @appsflyer-sdk/js-core-plugin's
 * AppsFlyerSDK (see its rpc-resolver.ts, which reads `platform` below).
 */
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
    // Both platforms send envelope.data as a native JSON object/array, never a
    // stringified string, so no re-parse of it is needed here.
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
