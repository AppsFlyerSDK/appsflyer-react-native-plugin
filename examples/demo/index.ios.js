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
    View
} from 'react-native';



export default class demo extends Component {

  constructor(props) {
    super(props);

    //this.isDisabled = false;

    this.state = {
      initSdkResponse: "not initialized yet",
      trackLocation: []
    };

    this.initSdk         = this.initSdk.bind(this);
    this.trackLocation   = this.trackLocation.bind(this);
  }




  initSdk(){

     let options = {
       devKey:  'WdpTVAcYwmxsaQ4WeTspmh',
       appId: "975313579",
       isDebug: true
     };

    appsFlyer.initSdk(options,
        (result) => {
          this.setState( { ...this.state, initSdkResponse: result });
        },
        (error) => {
          console.error(error);
        }
        )
  }


  trackLocation(){

    const  latitude = -18.406655;
    const  longitude = 46.406250;

    appsFlyer.trackLocation(longitude, latitude, (error, coords) => {
      if (error) {
        console.error(error);
      } else {
        this.setState( { ...this.state, trackLocation: coords });
      }
    })
  }


  render() {
    return (
        <View style={{
          flex: 1,
          marginTop:40,
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
                    onPress={() => this.trackLocation()}>
                  TrackLocation
                </Button>
              </View>
              <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                <Text style={styles.json_wrap}>
                  { JSON.stringify(this.state.trackLocation, null) }
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