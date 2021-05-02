/**
 * Detox-testing app
 * https://github.com/facebook/react-native
 */

import React, {useEffect, useState} from 'react';
import type {Node} from 'react';
import appsFlyer from 'react-native-appsflyer';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    Button,
    View,
    Platform,
    Alert,
} from 'react-native';

import {
    Colors,
} from 'react-native/Libraries/NewAppScreen';
import Config from 'react-native-config';

const App: () => Node = () => {
    const [testResult, setTestResult] = useState('No test results');

    useEffect(() => {
        let gcdListener = appsFlyer.onInstallConversionData(res => {
            console.log(JSON.stringify(res));
            setTestResult(JSON.stringify(res));
        });
        let oaoaListener = appsFlyer.onAppOpenAttribution(res => {
            console.log(JSON.stringify(res));
            Alert.alert('Alert', JSON.stringify(res));
        });
        return (() => {
            gcdListener();
            oaoaListener();
        });
    }, []);

    const successOrganicGCD = () => {
        appsFlyer.initSdk({
            devKey: Config.DEV_KEY,
            appId: '741993991',
            onInstallConversionDataListener: true,
        }, result => {
        }, error => {
        });
    };
    const noDevKeyInit = () => {
        appsFlyer.initSdk({devKey: '', appId: '123456789', onInstallConversionDataListener: false}, result => {
        }, error => {
            if (Platform.OS == 'ios') {
                setTestResult(error['domain']);
            } else {
                setTestResult(error);
            }

        });
    };

    const logEventSuccess = () => {
        const eventName = 'test';
        const eventValues = {af_revenue: '10'};
        appsFlyer.logEvent(eventName, eventValues, result => {
            console.log(JSON.stringify(result));
            Alert.alert('Alert', result);
        }, error => console.log(error));
    };

    return (
        <SafeAreaView>
            <StatusBar/>
            <View style={styles.responseView}>
                <Text testID='testResult' style={styles.welcome}>{testResult}</Text>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
                <View style={styles.body}>
                    <Button
                        testID='noDevKeyButton'
                        onPress={noDevKeyInit}
                        title="No devKey initSDK"
                        color="#009688"
                    />
                    <Button
                        testID='successOrganicGCDButton'
                        onPress={successOrganicGCD}
                        title="Success initSDK"
                        color="#009688"
                    />
                    <Button
                        testID='logEventSuccessButton'
                        onPress={logEventSuccess}
                        title="Success logEvent"
                        color="#009688"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
        ;
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
    },
    highlight: {
        fontWeight: '700',
    },
    body: {
        backgroundColor: Colors.white,
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    responseView: {
        height: '40%',
        padding: 20,
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'black',
        margin: 20,

    },
});

export default App;
