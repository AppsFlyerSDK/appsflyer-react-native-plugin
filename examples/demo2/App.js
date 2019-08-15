/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */
import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';

import appsFlyer from 'react-native-appsflyer';

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: true,
    appId: '41*****44',
  },
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
);


function trackEvent(eventName, eventValues) {
  appsFlyer.trackEvent(
    eventName,
    eventValues,
    (result) => {
      console.log(result);
    },
    (error) => {
      console.error(error);
    }
  );
}

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome To AppsFlyer Test App.</Text>
      <Text style={styles.welcome}> Press to Track a AppsFlyer Event! </Text>
      <Button
        onPress={() => {
          trackEvent('test_event', { eventvalue1: 'test1' });
        }}
        title="Track Event"
        color="#009688"
      />
      <Text style={styles.welcome}> Press to Get AppsFlyer UID! </Text>
      <Button
        onPress={() => {
          appsFlyer.getAppsFlyerUID((error, appsFlyerUID) => {
            alert(appsFlyerUID);
          });
        }}
        title="Get AppsFlyer UID"
        color="#009688"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});

export default App;
