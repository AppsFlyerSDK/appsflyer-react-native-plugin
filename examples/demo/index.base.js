/**
 * Created by maxim on 11/13/16.
 */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import React, { Component } from 'react';


import appsFlyer from 'react-native-appsflyer';

import Button from 'react-native-button';



import {
    AppRegistry,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default class AfBase extends Component {

    constructor(props) {
        super(props);

        this.isDisabled = false;

        this.state = {
            trackEventResponse: {status: "NA"},
            setUserEmailsResponse: "not called yet",
            appsFlyerUID: "not called yet",
            setCustomerUserIdResponse: "not called yet"
        };

        this.onInstallConversionDataCanceller = appsFlyer.onInstallConversionData(
            (data) => {
                console.log(data);
                alert(JSON.stringify(data));
            }
        );

        this.trackEvent        = this.trackEvent.bind(this);
        this.getAppsFlyerUID   = this.getAppsFlyerUID.bind(this);
        this.setCustomerUserId = this.setCustomerUserId.bind(this);
        this.setUserEmails     = this.setUserEmails.bind(this);
    }

    componentWillUnmount() {
        if(this.onInstallConversionDataCanceller){
            this.onInstallConversionDataCanceller();
        }
    }


    trackEvent(){
        const eventName = "af_add_to_cart";
        const eventValues = {
            "af_content_id": "id123",
            "af_currency":"USD",
            "af_revenue": "2"
        };

        appsFlyer.trackEvent(eventName, eventValues,
            (result) => {
                this.setState( { ...this.state, trackEventResponse: result });
            },
            (error) => {
                console.error(error);
            })
    }

    setUserEmails(){

        const options = {
            "emailsCryptType": 2,// NONE - 0 (default), SHA1 - 1, MD5 - 2
            "emails":["user1@gmail.com", "user2@gmail.com"]
        };

        appsFlyer.setUserEmails(options,
            (response) => {
                this.setState( { ...this.state, setUserEmailsResponse: response });
            },
            (error) => {
                console.error(error);
            })
    }


    setCustomerUserId(){
        const  userId = "some_user_id";
        appsFlyer.setCustomerUserId(userId,
            (response) => {
                this.setState( { ...this.state, setCustomerUserIdResponse: response });
            })
    }

    getAppsFlyerUID(){
        appsFlyer.getAppsFlyerUID((error, appsFlyerUID) => {
            if (error) {
                console.error(error);
            } else {
                this.setState( { ...this.state, appsFlyerUID: appsFlyerUID });
            }
        })
    }


    render() {

        return (
                <View style={{
                    height:240,
                    flexDirection: 'column',
                    justifyContent: 'flex-start', // 'center'
                    alignItems: 'stretch' //'flex-start' //'center'
                }}>

                    <View style={styles.api_wrapper}>
                        <View style={{height: 60, width: 100, backgroundColor: 'powderblue'}}>
                            <Button
                                style={styles.sdk_button}
                                onPress={() => this.trackEvent()}>
                                TrackEvent
                            </Button>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                            <Text style={styles.json_wrap}>
                                { JSON.stringify(this.state.trackEventResponse, null) }
                            </Text>
                        </View>

                    </View>

                    <View style={styles.api_wrapper}>
                        <View style={{height: 60, width: 100, backgroundColor: 'powderblue'}}>
                            <Button
                                style={styles.sdk_button_font_mini}
                                onPress={() => this.getAppsFlyerUID()}>
                                getAppsFlyerUID
                            </Button>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                            <Text style={styles.json_wrap}>
                                { JSON.stringify(this.state.appsFlyerUID, null) }
                            </Text>
                        </View>
                    </View>

                    <View style={styles.api_wrapper}>
                        <View style={{height: 60, width: 100, backgroundColor: 'powderblue'}}>
                            <Button
                                style={styles.sdk_button_font_mini}
                                onPress={() => this.setCustomerUserId()}>
                                setCustomerUserId
                            </Button>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                            <Text style={styles.json_wrap}>
                                { JSON.stringify(this.state.setCustomerUserIdResponse, null) }
                            </Text>
                        </View>
                    </View>

                    <View style={styles.api_wrapper}>
                        <View style={{height: 60, width: 100, backgroundColor: 'powderblue'}}>
                            <Button
                                style={styles.sdk_button_font_mini}
                                onPress={() => this.setUserEmails()}>
                                setUserEmails
                            </Button>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch',  backgroundColor: 'skyblue'}}>
                            <Text style={styles.json_wrap}>
                                { JSON.stringify(this.state.setUserEmailsResponse, null) }
                            </Text>
                        </View>
                    </View>

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
        height: 60,
        lineHeight:60
    },
    api_wrapper:{
        height: 60,
        minHeight:60,
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

