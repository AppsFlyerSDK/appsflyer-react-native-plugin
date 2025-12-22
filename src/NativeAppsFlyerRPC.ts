// Type imports - these are used by Codegen to generate native interfaces
// @ts-expect-error - TurboModule types may not be available in all RN versions
import type { TurboModule } from 'react-native';
// @ts-expect-error - TurboModuleRegistry may not be available in all RN versions
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  executeJson(jsonRequest: string): Promise<string>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('RNAppsFlyerRPC');

