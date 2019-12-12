import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  AppState
} from 'react-native';
import appsFlyer from 'react-native-appsflyer';

this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
  (res) => {
    console.log(res);
    if (JSON.parse(res.data.is_first_launch) == true) {
      if (res.data.af_status === 'Non-organic') {
        var media_source = res.data.media_source;
        var campaign = res.data.campaign;
        console.log('This is first launch and a Non-Organic install. Media source: ' + media_source + ' Campaign: ' + campaign);
      } else if (res.data.af_status === 'Organic') {
        console.log('This is first launch and a Organic Install');
      }
    } else {
      console.log('This is not first launch');
    }
  }
);


this.onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
  console.log(res);
});

appsFlyer.initSdk(
  {
    devKey: 'K2***********99',
    isDebug: false,
    appId: '41*****44',
  },
  (result) => {
    console.log(result);
  },
  (error) => {
    console.error(error);
  }
);


const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

class App extends React.Component {

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




export default App;
