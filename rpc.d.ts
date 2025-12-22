/**
 * TypeScript definitions for AppsFlyer RPC Module
 * 
 * RPC-based AppsFlyer SDK integration for React Native using TurboModules
 * 
 * @module react-native-appsflyer/rpc
 */

export {
  // Main RPC class
  AppsFlyerRPC,
  
  // Error class
  AppsFlyerRPCError,
  
  // Type definitions
  InitializeOptions,
  WaitForATTOptions,
  StartOptions,
  LogEventOptions,
  ConversionCallbacks,
  DeepLinkCallback,
  AppOpenAttributionCallbacks,
} from './src/AppsFlyerRPC.d';

// Default export
import AppsFlyerRPC from './src/AppsFlyerRPC.d';
export default AppsFlyerRPC;

