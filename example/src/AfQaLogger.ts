import {NativeModules, Platform} from 'react-native';

const LOG_TAG = '[AF_QA]';

// console.log doesn't reliably reach platform log collectors (os_log on iOS,
// logcat on Android) when running without Metro. Use the native module on both
// platforms so the scenario runner can always capture [AF_QA] markers.
const nativeLog = NativeModules.AfQaNativeLogger
  ? (msg: string) => {
      NativeModules.AfQaNativeLogger.log(msg);
      console.log(msg);
    }
  : (msg: string) => console.log(msg);

export function afLog(method: string, message: string): void {
  nativeLog(`${LOG_TAG}[${method}] ${message}`);
}

export function afCallbackLog(callbackName: string, payload: string): void {
  nativeLog(`${LOG_TAG}[CALLBACK][${callbackName}] received: ${payload}`);
}

export function afLifecycleLog(message: string): void {
  nativeLog(`${LOG_TAG}[AUTO_APIS] ${message}`);
}
