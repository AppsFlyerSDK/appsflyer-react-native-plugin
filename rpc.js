/**
 * AppsFlyer RPC Module
 * 
 * Separate entry point for the RPC-based AppsFlyer SDK integration.
 * This module uses React Native's New Architecture (TurboModules) and
 * provides a JSON-RPC interface to the AppsFlyer SDK.
 * 
 * @module react-native-appsflyer/rpc
 * 
 * @example
 * ```javascript
 * import { AppsFlyerRPC } from 'react-native-appsflyer/rpc';
 * 
 * // Initialize and use the RPC API
 * await AppsFlyerRPC.instance.initialize({
 *   devKey: 'YOUR_DEV_KEY',
 *   appId: 'id123456789',
 * });
 * 
 * await AppsFlyerRPC.instance.start();
 * ```
 * 
 * @see {@link https://github.com/AppsFlyerSDK/react-native-appsflyer/blob/master/Docs/RN_RPC_POC.md|RPC Documentation} for setup instructions and API reference
 */

// Import and re-export the RPC implementation
import AppsFlyerRPCClass, { AppsFlyerRPCError as RpcError } from './src/AppsFlyerRPC';

// Named exports
export const AppsFlyerRPC = AppsFlyerRPCClass;
export const AppsFlyerRPCError = RpcError;

// Default export
export default AppsFlyerRPCClass;

