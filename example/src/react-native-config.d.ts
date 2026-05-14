declare module 'react-native-config' {
  interface NativeConfig {
    DEV_KEY?: string;
    APP_ID?: string;
    [key: string]: string | undefined;
  }
  const Config: NativeConfig;
  export default Config;
}
