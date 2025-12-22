import { NativeEventEmitter, NativeModules, TurboModuleRegistry } from 'react-native';

const PLUGIN_VERSION = '6.17.8';

/**
 * Cached native module reference.
 * Stores the detected native module (TurboModule or Bridge) to avoid repeated lookups.
 * This is a performance optimization - the module is detected once and reused.
 */
let cachedModule = null;

/**
 * Gets the native module (TurboModule or Bridge) for RPC communication.
 * Tries TurboModule first (New Architecture), falls back to Bridge (Legacy).
 * 
 * @returns {{ module: any, type: string | null }} Object with module and type ('turbomodule' | 'bridge' | null)
 * @private
 */
function getNativeModule() {
  if (cachedModule) {
    return cachedModule;
  }
  
  try {
    const turboModule = TurboModuleRegistry.get('RNAppsFlyerRPC');
    if (turboModule && typeof turboModule.executeJson === 'function') {
      cachedModule = { module: turboModule, type: 'turbomodule' };
      return cachedModule;
    }
  } catch (error) {
    console.log('[AppsFlyerRPC] TurboModuleRegistry error:', error);
  }
  
  try {
    const bridgeModule = NativeModules.RNAppsFlyerRPC;
    if (bridgeModule && typeof bridgeModule.executeJson === 'function') {
      cachedModule = { module: bridgeModule, type: 'bridge' };
      return cachedModule;
    }
  } catch (error) {
    console.log('[AppsFlyerRPC] NativeModules error:', error);
  }
  
  return { module: null, type: null };
}

class AppsFlyerRPC {
  static #instance = null;
  
  static get instance() {
    if (!AppsFlyerRPC.#instance) {
      AppsFlyerRPC.#instance = new AppsFlyerRPC();
    }
    return AppsFlyerRPC.#instance;
  }
  
  #onConversionDataSuccessCallback = null;
  #onConversionDataFailCallback = null;
  #onDeepLinkReceivedCallback = null;
  #onAppOpenAttributionCallback = null;
  #onAppOpenAttributionFailureCallback = null;
  
  #eventEmitter = null;
  #eventSubscription = null;
  #initialized = false;
  
  #ensureInitialized() {
    if (this.#initialized) {
      return;
    }
    
    this.#initialized = true;
    
    try {
      const { module } = getNativeModule();
      if (module) {
        this.#setupEventHandler();
      }
    } catch (error) {
      // Ignore
    }
  }
  
  #setupEventHandler() {
    try {
      const { module } = getNativeModule();
      if (!module) {
        return;
      }
      
      if (this.#eventSubscription) {
        try {
          this.#eventSubscription.remove();
        } catch (error) {
          // Ignore
        }
        this.#eventSubscription = null;
      }
      
      this.#eventEmitter = new NativeEventEmitter(module);
      this.#eventSubscription = this.#eventEmitter.addListener('onEvent', (eventData) => {
        this.#handleEvent(eventData);
      });
    } catch (error) {
      // Ignore
    }
  }
  
  #handleEvent(event) {
    const eventType = event.event;
    const eventData = event.data || event;
    
    switch (eventType) {
      case 'onConversionDataSuccess':
        this.#onConversionDataSuccessCallback?.(eventData);
        break;
      case 'onConversionDataFail':
        this.#onConversionDataFailCallback?.(eventData);
        break;
      case 'onDeepLinkReceived':
        this.#onDeepLinkReceivedCallback?.(eventData);
        break;
      case 'onAppOpenAttribution':
        this.#onAppOpenAttributionCallback?.(eventData);
        break;
      case 'onAppOpenAttributionFailure':
        this.#onAppOpenAttributionFailureCallback?.(eventData);
        break;
    }
  }
  
  #handleRPCResponse(jsonResponse, method) {
    if (!jsonResponse) {
      throw new AppsFlyerRPCError(500, 'Empty response from native', { type: 'INTERNAL_ERROR', method });
    }
    
    let response;
    try {
      response = JSON.parse(jsonResponse);
    } catch (parseError) {
      throw new AppsFlyerRPCError(500, 'Invalid JSON response from native', {
        type: 'INTERNAL_ERROR',
        method,
        parseError: parseError.message,
      });
    }
    
    if (!response || typeof response !== 'object') {
      throw new AppsFlyerRPCError(500, 'Response is not a valid object', { type: 'INTERNAL_ERROR', method });
    }
    
    if (response.error) {
      const { code, message, data, type } = response.error;
      throw new AppsFlyerRPCError(code || 500, message || 'Unknown error', {
        ...data,
        type: type || 'INTERNAL_ERROR',
        method,
      });
    }
    
    // Return result (can be null for VoidSuccess, or the actual result value)
    return response.result;
  }
  
  async #executeRPC(method, params) {
    this.#ensureInitialized();
    
    const { module, type } = getNativeModule();
    if (!module) {
      throw new AppsFlyerRPCError(503, 'RPC module not available', {
        type: 'SERVICE_UNAVAILABLE',
        method,
      });
    }
    
    if (typeof module.executeJson !== 'function') {
      throw new AppsFlyerRPCError(500, 'executeJson method not available', {
        type: 'INTERNAL_ERROR',
        method,
        moduleType: type,
      });
    }
    
    const request = {
      jsonrpc: '2.0',
      id: `${method}-${Date.now()}`,
      method,
      params: params || {},
    };
    
    try {
      const jsonResponse = await module.executeJson(JSON.stringify(request));
      const result = this.#handleRPCResponse(jsonResponse, method);
      return result;
    } catch (error) {
      if (error instanceof AppsFlyerRPCError) {
        throw error;
      }
      throw new AppsFlyerRPCError(500, `Unexpected error: ${error.message}`, {
        type: 'INTERNAL_ERROR',
        method,
        originalError: error.message,
      });
    }
  }
  
  async #setPluginInfo() {
    await this.#executeRPC('setPluginInfo', {
      plugin: 'react_native',
      pluginVersion: PLUGIN_VERSION,
    });
  }
  
  /**
   * Initialize the AppsFlyer SDK with dev key and app ID.
   * Must be called before any other methods.
   * 
   * @param {Object} options - Initialization options
   * @param {string} options.devKey - Your AppsFlyer developer key
   * @param {string} options.appId - Your iOS app ID (e.g., 'id123456789') or Android package name
   * @returns {Promise<void>} Resolves when initialization is complete
   * @throws {AppsFlyerRPCError} If initialization fails
   * 
   * @example
   * await AppsFlyerRPC.instance.initialize({
   *   devKey: 'YOUR_DEV_KEY',
   *   appId: 'id123456789'
   * });
   */
  async initialize({ devKey, appId }) {
    await this.#setPluginInfo();
    await this.#executeRPC('init', { devKey, appId });
  }
  
  /**
   * Enable or disable debug logging.
   * Should be called before `start()` for best results.
   * 
   * @param {boolean} enabled - true to enable debug logging, false to disable
   * @returns {Promise<void>} Resolves when debug mode is set
   * @throws {AppsFlyerRPCError} If setting debug mode fails
   * 
   * @example
   * await AppsFlyerRPC.instance.setDebug(__DEV__);
   */
  async setDebug(enabled) {
    await this.#executeRPC('isDebug', { isDebug: enabled });
  }
  
  /**
   * Wait for App Tracking Transparency (ATT) authorization.
   * iOS only. Must be called before `start()` if you want to wait for ATT.
   * 
   * @param {Object} [options={}] - Options
   * @param {number} [options.timeout=60] - Maximum time to wait in seconds
   * @returns {Promise<void>} Resolves when ATT is authorized or timeout occurs
   * @throws {AppsFlyerRPCError} If waiting fails
   * 
   * @example
   * await AppsFlyerRPC.instance.waitForATT({ timeout: 60 });
   */
  async waitForATT({ timeout = 60 } = {}) {
    await this.#executeRPC('waitForATT', { timeout });
  }
  
  /**
   * Register to receive conversion data (attribution) callbacks from the SDK.
   * Call `setConversionCallbacks()` BEFORE calling this method.
   * 
   * @returns {Promise<void>} Resolves when listener is registered
   * @throws {AppsFlyerRPCError} If registration fails
   * 
   * @example
   * AppsFlyerRPC.instance.setConversionCallbacks({
   *   onSuccess: (data) => console.log('Attribution:', data),
   *   onFail: (error) => console.error('Attribution failed:', error)
   * });
   * await AppsFlyerRPC.instance.registerConversionListener();
   */
  async registerConversionListener() {
    await this.#executeRPC('registerConversionListener', {});
  }
  
  /**
   * Set callbacks for conversion data (attribution) events.
   * Must be called BEFORE `registerConversionListener()`.
   * 
   * @param {Object} callbacks - Conversion data callbacks
   * @param {Function} [callbacks.onSuccess] - Called when attribution data is received
   * @param {Function} [callbacks.onFail] - Called when attribution fails
   * @returns {void}
   * 
   * @example
   * AppsFlyerRPC.instance.setConversionCallbacks({
   *   onSuccess: (data) => {
   *     console.log('Attribution status:', data.status);
   *   },
   *   onFail: (error) => {
   *     console.error('Attribution error:', error.error);
   *   }
   * });
   */
  setConversionCallbacks({ onSuccess, onFail }) {
    this.#onConversionDataSuccessCallback = onSuccess;
    this.#onConversionDataFailCallback = onFail;
  }
  
  /**
   * Clear conversion data callbacks.
   * 
   * @returns {void}
   */
  clearConversionCallbacks() {
    this.#onConversionDataSuccessCallback = null;
    this.#onConversionDataFailCallback = null;
  }
  
  /**
   * Register to receive deep link callbacks from the SDK.
   * Call `setDeepLinkCallback()` BEFORE calling this method.
   * 
   * @returns {Promise<void>} Resolves when listener is registered
   * @throws {AppsFlyerRPCError} If registration fails
   * 
   * @example
   * AppsFlyerRPC.instance.setDeepLinkCallback({
   *   onDeepLink: (data) => console.log('Deep link:', data)
   * });
   * await AppsFlyerRPC.instance.registerDeepLinkListener();
   */
  async registerDeepLinkListener() {
    await this.#executeRPC('registerDeeplinkListener', {});
  }
  
  /**
   * Set callback for deep link events.
   * Must be called BEFORE `registerDeepLinkListener()`.
   * 
   * @param {Object} callback - Deep link callback
   * @param {Function} [callback.onDeepLink] - Called when deep link is received
   * @returns {void}
   * 
   * @example
   * AppsFlyerRPC.instance.setDeepLinkCallback({
   *   onDeepLink: (data) => {
   *     console.log('Deep link value:', data.deep_link_value);
   *     // Navigate to deep link destination
   *   }
   * });
   */
  setDeepLinkCallback({ onDeepLink }) {
    this.#onDeepLinkReceivedCallback = onDeepLink;
  }
  
  /**
   * Clear deep link callback.
   * 
   * @returns {void}
   */
  clearDeepLinkCallback() {
    this.#onDeepLinkReceivedCallback = null;
  }
  
  /**
   * Start the SDK session and begin tracking.
   * 
   * @param {Object} [options={}] - Start options
   * @param {boolean} [options.awaitResponse=false] - If true, waits up to 5 seconds for attribution data
   * @returns {Promise<Object|null>} Attribution data if `awaitResponse` is true, otherwise null
   * @throws {AppsFlyerRPCError} If start fails
   * 
   * @example
   * // Fire and forget (default)
   * await AppsFlyerRPC.instance.start();
   * 
   * // Wait for attribution data
   * const attributionData = await AppsFlyerRPC.instance.start({ awaitResponse: true });
   */
  async start({ awaitResponse = false } = {}) {
    const params = awaitResponse ? { awaitResponse: true } : {};
    try {
      const result = await this.#executeRPC('start', params);
      // On Android, the result might be the data directly, or null for void success
      // On iOS, it might be wrapped in a data property
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data;
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Start the SDK and wait for attribution data.
   * Convenience method that calls `start({ awaitResponse: true })`.
   * 
   * @returns {Promise<Object|null>} Attribution data or null
   * @throws {AppsFlyerRPCError} If start fails
   * 
   * @example
   * const attributionData = await AppsFlyerRPC.instance.startWithCallback();
   * if (attributionData) {
   *   console.log('Attribution:', attributionData);
   * }
   */
  async startWithCallback() {
    return this.start({ awaitResponse: true });
  }
  
  /**
   * Log an in-app event.
   * 
   * @param {string} eventName - Event name (e.g., 'af_purchase', 'af_add_to_cart')
   * @param {Object} [options={}] - Event options
   * @param {Object} [options.eventValues] - Event parameters (e.g., { af_revenue: 9.99, af_currency: 'USD' })
   * @param {boolean} [options.awaitResponse=false] - If true, waits up to 5 seconds for server response
   * @returns {Promise<Object|null>} Event result with statusCode if `awaitResponse` is true, otherwise null
   * @throws {AppsFlyerRPCError} If logging fails
   * 
   * @example
   * // Fire and forget (default)
   * await AppsFlyerRPC.instance.logEvent('af_purchase', {
   *   eventValues: {
   *     af_revenue: 9.99,
   *     af_currency: 'USD'
   *   }
   * });
   * 
   * // Wait for server response
   * const result = await AppsFlyerRPC.instance.logEvent('af_purchase', {
   *   eventValues: { af_revenue: 9.99 },
   *   awaitResponse: true
   * });
   */
  async logEvent(eventName, { eventValues, awaitResponse = false } = {}) {
    const params = { eventName };
    if (eventValues) params.eventValues = eventValues;
    if (awaitResponse) params.awaitResponse = true;
    
    const result = await this.#executeRPC('logEvent', params);
    const serverData = result?.data;
    
    if (serverData) {
      return {
        ...serverData,
        eventName,
        eventValues: eventValues || {},
        timestamp: new Date().toISOString(),
      };
    }
    
    return null;
  }
  
  /**
   * Log an in-app event and wait for server response.
   * Convenience method that calls `logEvent()` with `awaitResponse: true`.
   * 
   * @param {string} eventName - Event name
   * @param {Object} [options={}] - Event options
   * @param {Object} [options.eventValues] - Event parameters
   * @returns {Promise<Object|null>} Event result with statusCode, message, etc.
   * @throws {AppsFlyerRPCError} If logging fails
   * 
   * @example
   * const result = await AppsFlyerRPC.instance.logEventWithCallback('af_purchase', {
   *   eventValues: {
   *     af_revenue: 9.99,
   *     af_currency: 'USD'
   *   }
   * });
   * 
   * if (result?.statusCode === 200) {
   *   console.log('Event logged successfully');
   * }
   */
  async logEventWithCallback(eventName, { eventValues } = {}) {
    return this.logEvent(eventName, { eventValues, awaitResponse: true });
  }
  
  /**
   * Set callbacks for app open attribution events.
   * 
   * @param {Object} callbacks - App open attribution callbacks
   * @param {Function} [callbacks.onSuccess] - Called on successful app open attribution
   * @param {Function} [callbacks.onFailure] - Called on failed app open attribution
   * @returns {void}
   * 
   * @example
   * AppsFlyerRPC.instance.setAppOpenAttributionCallbacks({
   *   onSuccess: (data) => console.log('App open attribution:', data),
   *   onFailure: (error) => console.error('App open attribution failed:', error)
   * });
   */
  setAppOpenAttributionCallbacks({ onSuccess, onFailure }) {
    this.#onAppOpenAttributionCallback = onSuccess;
    this.#onAppOpenAttributionFailureCallback = onFailure;
  }
  
  /**
   * Clear app open attribution callbacks.
   * 
   * @returns {void}
   */
  clearAppOpenAttributionCallbacks() {
    this.#onAppOpenAttributionCallback = null;
    this.#onAppOpenAttributionFailureCallback = null;
  }
  
  /**
   * Clean up event listeners and callbacks.
   * Call this when done using the SDK (e.g., component unmount).
   * 
   * @returns {void}
   * 
   * @example
   * useEffect(() => {
   *   // Setup AppsFlyer...
   *   
   *   return () => {
   *     AppsFlyerRPC.instance.cleanup();
   *   };
   * }, []);
   */
  cleanup() {
    if (this.#eventSubscription) {
      try {
        this.#eventSubscription.remove();
      } catch (error) {
        // Ignore
      }
      this.#eventSubscription = null;
    }
    
    this.#eventEmitter = null;
    this.clearConversionCallbacks();
    this.clearDeepLinkCallback();
    this.clearAppOpenAttributionCallbacks();
    this.#initialized = false;
  }
}

/**
 * Error class for AppsFlyer RPC errors.
 * 
 * @class AppsFlyerRPCError
 * @extends Error
 * 
 * @property {number} code - Error code (400, 422, 500, 503, etc.)
 * @property {string} message - Error message
 * @property {Object} details - Additional error details
 * 
 * @example
 * try {
 *   await AppsFlyerRPC.instance.initialize({ devKey: 'invalid' });
 * } catch (error) {
 *   if (error instanceof AppsFlyerRPCError) {
 *     console.error(`Error ${error.code}: ${error.message}`);
 *   }
 * }
 */
class AppsFlyerRPCError extends Error {
  /**
   * Creates an instance of AppsFlyerRPCError.
   * 
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(code, message, details) {
    super(message);
    this.name = 'AppsFlyerRPCError';
    this.code = code;
    this.details = details;
  }
  
  /**
   * Returns a string representation of the error.
   * 
   * @returns {string} Formatted error string
   */
  toString() {
    return `${this.name}: [${this.code}] ${this.message}`;
  }
}

export { AppsFlyerRPCError };
export default AppsFlyerRPC;

