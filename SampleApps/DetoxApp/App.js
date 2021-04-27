/**
 * Detox-testing app
 * https://github.com/facebook/react-native
 */

import React, {useState} from 'react';
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
} from 'react-native';

import {
    Colors,
} from 'react-native/Libraries/NewAppScreen';

const App: () => Node = () => {
    const [initResult, setInitResult] = useState('Not clicked yet');
    const [noDevKeyResult, setNoDevKeyResult] = useState('Not clicked yet');
    const successInit = () => {
        appsFlyer.initSdk({
            devKey: 'Us********ed',
            appId: '123456789',
            onInstallConversionDataListener: false,
        }, result => {
            setInitResult(result);
        }, error => {
        });
    };
    const noDevKeyInit = () => {
        appsFlyer.initSdk({devKey: '', appId: '123456789', onInstallConversionDataListener: false}, result => {
        }, error => {
            if (Platform.OS == 'ios') {
                setNoDevKeyResult(error['domain']);
            } else {
                setNoDevKeyResult(error);
            }

        });
    };

    return (
        <SafeAreaView>
            <StatusBar/>
            <ScrollView
                contentInsetAdjustmentBehavior="automatic">
                <View style={styles.body}>
                    <Button
                        testID='successInitButton'
                        onPress={successInit}
                        title="Success initSDK"
                        color="#009688"
                    />
                    <Text testID='successInitResult' style={styles.welcome}>{initResult}</Text>
                    <Button
                        testID='noDevKeyButton'
                        onPress={noDevKeyInit}
                        title="No devKey initSDK"
                        color="#009688"
                    />
                    <Text testID='noDevKeyInitResult' style={styles.welcome}>{noDevKeyResult}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
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
});

export default App;
