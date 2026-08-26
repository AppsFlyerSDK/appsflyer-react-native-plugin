import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Single entry point — all SDK capabilities are dispatched by method name inside the JSON payload.
  executeRpc(requestJson: string): Promise<string>;

  // Required by NativeEventEmitter under TurboModules.
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNAppsFlyer');
