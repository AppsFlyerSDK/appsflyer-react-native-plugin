/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import React, { Component } from 'react';


import appsFlyer from 'react-native-appsflyer';

import Button from 'react-native-button';

import AfBase from './index.base';

import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    Linking
} from 'react-native';

export default class demo extends Component {

  constructor(props) {
    super(props);

     this.state = {
      initSdkResponse: "not initialized yet",
      gcmProjectNumberResponse: "not called yet",
      tokenResponse: "not called yet"
    };

    this.initSdk                    = this.initSdk.bind(this);
    this.enableUninstallTracking    = this.enableUninstallTracking.bind(this);
    this.updateServerUninstallToken = this.updateServerUninstallToken.bind(this);
  }


   // Handle DeepLink URL
  componentDidMount() {
     Linking.getInitialURL().then((url) => {
      if (appsFlyer) {
        appsFlyer.sendDeepLinkData(url); // Report Deep Link to AppsFlyer
      }
  }).catch(err => console.error('An error occurred', err));
  }


  initSdk(){

    let options = {
      devKey:  'WdpTVAcYwmxsaQ4WeTspmh',
      isDebug: true
    };

    appsFlyer.initSdk(options,
        (result) => {
           this.setState( { ...this.state, initSdkResponse: result });
         },
        (error) => {
          console.error(error);
        })
  }

  enableUninstallTracking(){

    const  gcmProjectNumber = "997186475229";

    appsFlyer.enableUninstallTracking(gcmProjectNumber,
        (gcmProjectID) => {
           this.setState( { ...this.state, gcmProjectNumberResponse: gcmProjectID });
        })
  }

  updateServerUninstallToken(){

    const  token = "xxxxxxxxxxxxx";

    appsFlyer.updateServerUninstallToken(token,
        (response) => {
          this.setState( { ...this.state, tokenResponse: response });
        })
  }


  render() {
    return (
        <View style={{
          flex: 1,
          marginTop:10,
          flexDirection: 'column',
          justifyContent: 'flex-start', // 'center'
          alignItems: 'stretch' //'flex-start' //'center'
        }}>


            <View style={styles.api_wrapper}>
              <View style={{height: 60, width: 100, backgroundColor: 'powderblue'}}>
                <Button
                    style={styles.sdk_button}
                    styleDisabled={{color: 'red'}}
                    disabled={this.isDisabled}
                    onPress={() => this.initSdk()}>
                  initSDK
                </Button>
              </View>
              <View style={{height: 60,  flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                <Text style={styles.json_wrap}>
                  {this.state.initSdkResponse}
                </Text>
              </View>
            </View>

            <AfBase></AfBase>

            <View style={styles.api_wrapper}>
              <View style={{height: 60, width: 100, backgroundColor: 'powderblue'}}>
                <Button
                    style={styles.sdk_button}
                    onPress={() => this.enableUninstallTracking()}>
                  setGCMProjectID
                </Button>
              </View>
              <View style={{height: 60,  flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                <Text style={styles.json_wrap}>
                  {this.state.gcmProjectNumberResponse}
                </Text>
              </View>
            </View>

            <View style={styles.api_wrapper}>
              <View style={{height: 60, width: 100, backgroundColor: 'powderblue'}}>
                <Button
                    style={styles.sdk_button}
                    onPress={() => this.updateServerUninstallToken()}>
                  update Uninstall Token
                </Button>
              </View>
              <View style={{height: 60,  flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                <Text style={styles.json_wrap}>
                  {this.state.tokenResponse}
                </Text>
              </View>
            </View>


        </View>


    );
  }
}

AppRegistry.registerComponent('demo', () => demo);


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
    height: 60,
    lineHeight:60
  },
  api_wrapper:{
    height: 60,
    maxHeight:60,
    flex: 1,
    flexDirection: 'row',
    borderStyle: 'solid',
    borderColor: 'black',
    borderTopWidth: 1
  },
  sdk_button:{
    fontSize: 14,
    color: 'green',
    marginTop: 20,
    marginBottom: 10,
    marginRight: 10,
    marginLeft: 10
  },

  sdk_button_font_mini:{
    fontSize: 12,
    color: 'green',
    marginTop: 20,
    marginBottom: 10,
    marginRight: 10,
    marginLeft: 10
  },

  json_wrap:{
    fontSize:9,
    marginTop: 3,
    marginBottom: 5,
    marginRight: 10,
    marginLeft: 10
  }
});