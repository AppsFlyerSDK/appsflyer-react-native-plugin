
import appsFlyer from 'react-native-appsflyer';
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  AppState,
  Button
} from 'react-native';


const options = {
  devKey: "AF_DEV_KEY",
  isDebug: true
};

if (Platform.OS === 'ios') {
  options.appId = "123456789";
}


this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
     (data) => {
       console.log(data);
     }
   );

   appsFlyer.initSdk(options,
     (result) => {
       console.log(result);
     },
     (error) => {
       console.error(error);
     }
   )

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

export default class App extends Component<{}> {

  constructor(props){
    super(props);

  }

  state = {
    appState: AppState.currentState
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    if(this.onInstallConversionDataCanceller){
      this.onInstallConversionDataCanceller();
    }
     AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {

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

     TrackEventPressed() {
      const eventName = "af_test_event";
      const eventValues = {
          "af_event_param0" : "biz",
          "af_event_param1" : "buz",
          "af_event_param2" : "bizbuz"
      };
      appsFlyer.trackEvent(eventName, eventValues,
        (result) => {
          console.log(result);
        },
        (error) => {
          console.error(error);
        }
      )
    }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to the React Native AppsFlyer Test App!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit App.js
        </Text>
        <Text style={styles.instructions}>
          {instructions}
        </Text>

        <Text style = {styles.welcome}> Press to Track a AppsFlyer Event!  </Text>
        <Button onPress={ this.TrackEventPressed } title="Track Event" color="#009688" />
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

// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  * @flow
//  */

// import React, { Component } from 'react';
// import {
//   Platform,
//   StyleSheet,
//   Text,
//   View
// } from 'react-native';

// const instructions = Platform.select({
//   ios: 'Press Cmd+R to reload,\n' +
//     'Cmd+D or shake for dev menu',
//   android: 'Double tap R on your keyboard to reload,\n' +
//     'Shake or press menu button for dev menu',
// });

// type Props = {};
// export default class App extends Component<Props> {
//   render() {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.welcome}>
//           Welcome to React Native!
//         </Text>
//         <Text style={styles.instructions}>
//           To get started, edit App.js
//         </Text>
//         <Text style={styles.instructions}>
//           {instructions}
//         </Text>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F5FCFF',
//   },
//   welcome: {
//     fontSize: 20,
//     textAlign: 'center',
//     margin: 10,
//   },
//   instructions: {
//     textAlign: 'center',
//     color: '#333333',
//     marginBottom: 5,
//   },
// });
