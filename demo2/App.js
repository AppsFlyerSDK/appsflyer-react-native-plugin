/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  AppState
} from 'react-native';

import appsFlyer from 'react-native-appsflyer';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

let afOptions = {
  devKey: "uAX9meXuM6aCsh3Zb4Q9KW",
  isDebug: true,
  onInstallConversionDataListener: true
}; 

if (Platform.OS === 'ios') {
  afOptions.appId = "0546492998";
}

export default class App extends Component<{}> {

    constructor(props) {
    super(props);
    
    // Register Conversion Listener for Deferred / Regular Deep Link
    this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
      (data) => {
        console.log(data);
      }
    );

    // Initialize the SDK
    appsFlyer.initSdk(afOptions,
      (result) => {
        console.log(result);
      },
      (error) => {
        console.error(error);
      }
    )
    }
  
  // AppState Listeners for iOS session tracking and ConversionListener unregistration
  state = {
    appState: AppState.currentState
   }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState) => {
      if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
          console.log('App has come to the foreground!')

          if (Platform.OS === 'ios') {
            appsFlyer.trackAppLaunch();
          }
      }

      if (this.state.appState.match(/active|foreground/) && nextAppState === 'background') {
        if(this.onInstallConversionDataCanceller){
          this.onInstallConversionDataCanceller();
        }
      }
      this.setState({appState: nextAppState});
    }
  // }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit App.js
        </Text>
        <Text style={styles.instructions}>
          {instructions}
        </Text>
      </View>
    );
  }
}

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
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
