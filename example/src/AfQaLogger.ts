import {NativeModules, Platform} from 'react-native';

const LOG_TAG = '[AF_QA]';

// On iOS, console.log goes only to Metro (not os_log). Use a native module
// so logs appear in `simctl log show` for the scenario runner to capture.
const nativeLog =
  Platform.OS === 'ios' && NativeModules.AfQaNativeLogger
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
