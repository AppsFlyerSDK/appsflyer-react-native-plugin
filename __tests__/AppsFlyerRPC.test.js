/**
 * AppsFlyerRPC Unit Tests
 * 
 * Tests for RPC client, error handling, and callback routing
 */

import { Platform } from 'react-native';
import AppsFlyerRPC, { AppsFlyerRPCError } from '../src/AppsFlyerRPC';

// Mock NativeAppsFlyerRPC
jest.mock('../src/NativeAppsFlyerRPC', () => ({
  __esModule: true,
  default: {
    executeJson: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// Mock react-native with TurboModuleRegistry and NativeModules
jest.mock('react-native', () => {
  const mockModule = {
    executeJson: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };
  
  return {
    Platform: {
      OS: 'ios',
    },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn((eventName, callback) => ({
        remove: jest.fn(),
      })),
    })),
    TurboModuleRegistry: {
      get: jest.fn((name) => {
        if (name === 'RNAppsFlyerRPC') {
          return mockModule;
        }
        return null;
      }),
    },
    NativeModules: {
      RNAppsFlyerRPC: mockModule,
    },
  };
});

import NativeAppsFlyerRPC from '../src/NativeAppsFlyerRPC';
import { NativeModules, TurboModuleRegistry } from 'react-native';

describe('AppsFlyerRPC', () => {
  // Get the mock native module for setting up expectations
  const getMockNativeModule = () => {
    return TurboModuleRegistry.get('RNAppsFlyerRPC') || NativeModules.RNAppsFlyerRPC;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock module's executeJson to return a default success response
    const mockModule = getMockNativeModule();
    if (mockModule) {
      mockModule.executeJson.mockResolvedValue(JSON.stringify({
        id: 'test-123',
        result: { success: true },
      }));
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AppsFlyerRPC.instance;
      const instance2 = AppsFlyerRPC.instance;
      expect(instance1).toBe(instance2);
    });

    it('should be an instance of AppsFlyerRPC', () => {
      expect(AppsFlyerRPC.instance).toBeInstanceOf(AppsFlyerRPC);
    });
  });

  describe('RPC Request/Response Handling', () => {
    it('should execute RPC request successfully', async () => {
      const mockModule = getMockNativeModule();
      const mockResponse = JSON.stringify({
        id: 'test-123',
        result: { success: true, message: 'OK' },
      });
      mockModule.executeJson.mockResolvedValue(mockResponse);

      const result = await AppsFlyerRPC.instance.initialize({
        devKey: 'test-key',
        appId: 'id123',
      });

      expect(mockModule.executeJson).toHaveBeenCalled();
      expect(result).toBeUndefined(); // initialize returns void
    });

    it('should handle RPC error response', async () => {
      const mockModule = getMockNativeModule();
      const mockErrorResponse = JSON.stringify({
        id: 'test-123',
        error: {
          code: 422,
          message: 'Missing required parameter',
          details: null,
        },
      });
      mockModule.executeJson.mockResolvedValue(mockErrorResponse);

      await expect(
        AppsFlyerRPC.instance.initialize({
          devKey: 'test-key',
          appId: 'id123',
        })
      ).rejects.toThrow(AppsFlyerRPCError);
    });

    it('should throw error for null response', async () => {
      const mockModule = getMockNativeModule();
      mockModule.executeJson.mockResolvedValue(null);

      await expect(
        AppsFlyerRPC.instance.setDebug(true)
      ).rejects.toThrow('Empty response from native');
    });

    it('should throw error for invalid JSON response', async () => {
      const mockModule = getMockNativeModule();
      mockModule.executeJson.mockResolvedValue('invalid json');

      await expect(
        AppsFlyerRPC.instance.setDebug(true)
      ).rejects.toThrow(AppsFlyerRPCError);
    });
  });

  describe('AppsFlyerRPCError', () => {
    it('should create error with code and message', () => {
      const error = new AppsFlyerRPCError(422, 'Test error', { detail: 'test' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppsFlyerRPCError);
      expect(error.code).toBe(422);
      expect(error.message).toBe('Test error');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('AppsFlyerRPCError');
    });

    it('should have proper toString', () => {
      const error = new AppsFlyerRPCError(500, 'Internal error', null);
      expect(error.toString()).toBe('AppsFlyerRPCError: [500] Internal error');
    });
  });

  describe('API Methods', () => {
    beforeEach(() => {
      const mockModule = getMockNativeModule();
      const mockSuccessResponse = JSON.stringify({
        id: 'test-123',
        result: { success: true },
      });
      mockModule.executeJson.mockResolvedValue(mockSuccessResponse);
    });

    describe('initialize', () => {
      it('should call setPluginInfo and init', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.initialize({
          devKey: 'test-key',
          appId: 'id123',
        });

        expect(mockModule.executeJson).toHaveBeenCalledTimes(2);
        
        // First call: setPluginInfo
        const firstCall = mockModule.executeJson.mock.calls[0][0];
        const firstRequest = JSON.parse(firstCall);
        expect(firstRequest.method).toBe('setPluginInfo');
        expect(firstRequest.params.plugin).toBe('react_native');

        // Second call: init
        const secondCall = mockModule.executeJson.mock.calls[1][0];
        const secondRequest = JSON.parse(secondCall);
        expect(secondRequest.method).toBe('init');
        expect(secondRequest.params.devKey).toBe('test-key');
        expect(secondRequest.params.appId).toBe('id123');
      });
    });

    describe('setDebug', () => {
      it('should call isDebug RPC method', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.setDebug(true);

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.method).toBe('isDebug');
        expect(request.params.isDebug).toBe(true);
      });
    });

    describe('waitForATT', () => {
      it('should call waitForATT with default timeout', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.waitForATT();

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.method).toBe('waitForATT');
        expect(request.params.timeout).toBe(60);
      });

      it('should call waitForATT with custom timeout', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.waitForATT({ timeout: 30 });

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.params.timeout).toBe(30);
      });
    });

    describe('start', () => {
      it('should call start without awaitResponse', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.start();

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.method).toBe('start');
        expect(request.params.awaitResponse).toBeUndefined();
      });

      it('should call start with awaitResponse', async () => {
        const mockModule = getMockNativeModule();
        const mockResponse = JSON.stringify({
          id: 'test-123',
          result: { data: { attribution: 'data' } },
        });
        mockModule.executeJson.mockResolvedValue(mockResponse);

        const result = await AppsFlyerRPC.instance.start({ awaitResponse: true });

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.params.awaitResponse).toBe(true);
        expect(result).toEqual({ attribution: 'data' });
      });

      it('startWithCallback should call start with awaitResponse', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.startWithCallback();

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.method).toBe('start');
        expect(request.params.awaitResponse).toBe(true);
      });
    });

    describe('logEvent', () => {
      it('should log event without values', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.logEvent('test_event');

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.method).toBe('logEvent');
        expect(request.params.eventName).toBe('test_event');
        expect(request.params.eventValues).toBeUndefined();
      });

      it('should log event with values', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.logEvent('test_event', {
          eventValues: { key: 'value' },
        });

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.params.eventValues).toEqual({ key: 'value' });
      });

      it('should log event with awaitResponse', async () => {
        const mockModule = getMockNativeModule();
        const mockResponse = JSON.stringify({
          id: 'test-123',
          result: { data: { statusCode: 200 } },
        });
        mockModule.executeJson.mockResolvedValue(mockResponse);

        const result = await AppsFlyerRPC.instance.logEvent('test_event', {
          eventValues: { key: 'value' },
          awaitResponse: true,
        });

        expect(result).toHaveProperty('statusCode', 200);
        expect(result).toHaveProperty('eventName', 'test_event');
        expect(result).toHaveProperty('timestamp');
      });

      it('logEventWithCallback should call logEvent with awaitResponse', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.logEventWithCallback('test_event', {
          eventValues: { key: 'value' },
        });

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.params.awaitResponse).toBe(true);
      });
    });

    describe('registerConversionListener', () => {
      it('should call registerConversionListener', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.registerConversionListener();

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.method).toBe('registerConversionListener');
        expect(request.params).toEqual({});
      });
    });

    describe('registerDeepLinkListener', () => {
      it('should call registerDeeplinkListener', async () => {
        const mockModule = getMockNativeModule();
        await AppsFlyerRPC.instance.registerDeepLinkListener();

        const call = mockModule.executeJson.mock.calls[0][0];
        const request = JSON.parse(call);
        expect(request.method).toBe('registerDeeplinkListener');
        expect(request.params).toEqual({});
      });
    });
  });

  describe('Callback Management', () => {
    it('should set and clear conversion callbacks', () => {
      const onSuccess = jest.fn();
      const onFail = jest.fn();

      AppsFlyerRPC.instance.setConversionCallbacks({ onSuccess, onFail });
      // Callbacks are private, can't test directly
      // But we can verify no errors are thrown

      AppsFlyerRPC.instance.clearConversionCallbacks();
      // Again, just verify no errors
    });

    it('should set and clear deep link callback', () => {
      const onDeepLink = jest.fn();

      AppsFlyerRPC.instance.setDeepLinkCallback({ onDeepLink });
      AppsFlyerRPC.instance.clearDeepLinkCallback();
    });

    it('should set and clear app open attribution callbacks', () => {
      const onSuccess = jest.fn();
      const onFailure = jest.fn();

      AppsFlyerRPC.instance.setAppOpenAttributionCallbacks({ onSuccess, onFailure });
      AppsFlyerRPC.instance.clearAppOpenAttributionCallbacks();
    });
  });

  describe('Platform Support', () => {
    it('should work on both iOS and Android', async () => {
      // Test iOS
      Platform.OS = 'ios';
      const mockModule = getMockNativeModule();
      const mockResponse = JSON.stringify({
        id: 'test-123',
        result: { success: true },
      });
      mockModule.executeJson.mockResolvedValue(mockResponse);

      await AppsFlyerRPC.instance.initialize({
        devKey: 'test-key',
        appId: 'id123',
      });

      expect(mockModule.executeJson).toHaveBeenCalled();

      // Test Android
      Platform.OS = 'android';
      jest.clearAllMocks();
      mockModule.executeJson.mockResolvedValue(mockResponse);

      await AppsFlyerRPC.instance.initialize({
        devKey: 'test-key',
        appId: 'com.test.app',
      });

      expect(mockModule.executeJson).toHaveBeenCalled();

      Platform.OS = 'ios'; // Reset
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => {
        AppsFlyerRPC.instance.cleanup();
      }).not.toThrow();
    });
  });
});

