/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Node} from 'react';
import appsFlyer from 'react-native-appsflyer';

import {
  Button,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

// eslint-disable-next-line no-unused-vars
var onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
  (res) => {
    console.log('onInstallConversionData: ' + JSON.stringify(res));
    if (res.type === 'onInstallConversionSuccess') {
      if (JSON.parse(res.data.is_first_launch) === true) {
        if (res.data.af_status === 'Non-organic') {
          var media_source = res.data.media_source;
          var campaign = res.data.campaign;
          console.log(
            'This is first launch and a Non-Organic install. Media source: ' +
              media_source +
              ' Campaign: ' +
              campaign,
          );
        } else if (res.data.af_status === 'Organic') {
          console.log('This is first launch and a Organic Install');
        }
      } else {
        console.log('This is not first launch');
      }
    }
  },
);

// eslint-disable-next-line no-unused-vars
var onAppOpenAttributionCanceller = appsFlyer.onAppOpenAttribution((res) => {
  console.log(res);
});

appsFlyer.initSdk(
  {
    isDebug: true,
    devKey: '4UGrDF4vFvPLbHq5bXtCza',
    appId: '753258300',
    advertisingIdWaitInterval: 60,
  },
  (result) => {
    console.log('initSdk: ' + result);
  },
  (error) => {
    console.error('initSdk: ' + error);
  },
);

const App: () => React$Node = () => {
  const LogEventPressed = () => {
    const eventName = 'af_test_event';
    const eventValues = {
      af_event_param0: 'biz',
      af_event_param1: 'buz',
      af_event_param2: 'bizbuz',
    };
    appsFlyer.logEvent(
      eventName,
      eventValues,
      (result) => {
        console.log('logEvent: ' + result);
      },
      (error) => {
        console.error('logEvent: ' + error);
      },
    );
  };

  const LogLocationPressed = () => {
    appsFlyer.logLocation(32.0853, 34.781769, (result) => {
      console.log('logLocation: ' + result);
    });
  };

  const StopPressed = () => {
    appsFlyer.stop(true, (res) => {
      console.log('stop: ' + res);
    }),
      (err) => {
        console.log('stop: ' + err);
      };
  };

  const LogCrossPromotion = () => {
    appsFlyer.logCrossPromotionImpression('1192323960', 'test', {
      custom_param: 'custom_value',
    });
  };

  const LogAndOpenStore = () => {
    appsFlyer.logAndOpenStore('1192323960', 'test', {
      custom_param: 'custom_value',
    });
  };

  const setDeviceLoggingDisabled = () => {
    appsFlyer.setDeviceLoggingDisabled(true, (res) => {
      console.log('setDeviceLoggingDisabled: ' + res);
    });
  };

  const Header = (): Node => (
    <ImageBackground
      accessibilityRole={'image'}
      source={require('./logo.png')}
      style={styles.background}
      imageStyle={styles.logo}>
      <Text style={styles.text}>
        Welcome to the React Native AppsFlyer Test App!
      </Text>
    </ImageBackground>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          <View style={styles.body}>
            <Text style={styles.welcome}>Press to log event!</Text>
            <Button
              onPress={LogEventPressed}
              title="Log Event"
              color="#009688"
            />

            <Text style={styles.welcome}>Press to log location!</Text>
            <Button
              onPress={LogLocationPressed}
              title="Log Location"
              color="#009688"
            />

            <Text style={styles.welcome}>Press to stop AF SDK!</Text>
            <Button
              onPress={StopPressed}
              title="Stop SDK"
              color="#009688"
            />

            <Text style={styles.welcome}>Press to Log cross promotion impression!</Text>
            <Button
              onPress={LogCrossPromotion}
              title="Log cross promotion impression"
              color="#009688"
            />

            <Text style={styles.welcome}>Press to Log and open Store!</Text>
            <Button
              onPress={LogAndOpenStore}
              title="Log and open Store"
              color="#009688"
            />

            <Text style={styles.welcome}>
              Press to Set device logging disabled!
            </Text>
            <Button
              onPress={setDeviceLoggingDisabled}
              title="Set device logging disabled"
              color="#009688"
            />

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Step One</Text>
              <Text style={styles.sectionDescription}>
                Edit <Text style={styles.highlight}>App.js</Text> to change this
                screen and then come back to see your edits.
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>See Your Changes</Text>
              <Text style={styles.sectionDescription}>
                <ReloadInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Debug</Text>
              <Text style={styles.sectionDescription}>
                <DebugInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Learn More</Text>
              <Text style={styles.sectionDescription}>
                Read the docs to discover what to do next:
              </Text>
            </View>
            <LearnMoreLinks />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  background: {
    paddingBottom: 40,
    paddingTop: 96,
    paddingHorizontal: 32,
    backgroundColor: Colors.lighter,
  },
  logo: {
    opacity: 0.2,
    overflow: 'visible',
    resizeMode: 'cover',
    /*
     * These negative margins allow the image to be offset similarly across screen sizes and component sizes.
     *
     * The source logo.png image is 512x512px, so as such, these margins attempt to be relative to the
     * source image's size.
     */
    marginLeft: -128,
    marginBottom: -192,
  },
  text: {
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.black,
  },
});

export default App;
