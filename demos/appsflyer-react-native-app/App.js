/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {Platform, LogBox, I18nManager} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import 'react-native-gesture-handler';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from './components/HomeScreen.js';
import Cart from './components/Cart.js';
import Item from './components/Item.js';
import {
  initConnection,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  finishInAppTransaction,
  flushFailedPurchasesCachedAsPendingAndroid,
  withIAPContext,
  getProducts,
  getSubscriptions,
  endConnection,
} from 'react-native-iap';
import {AppsFlyerPurchaseConnector} from 'react-native-appsflyer';


const Stack = createStackNavigator();

try {
  // Disable RTL alignments for this app
  I18nManager.allowRTL(false);
} catch (e) {
  console.log('Failed to disable RTL', e);
}

// Ignore certain warnings regarding navigation state
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Test items (hardcoded)
const items = Platform.select({
  ios: [
    'one1',
    'non.cons2',
    'auto.renew',
    'non.renew',
    'cons.test',
    'nonconsumable.purchase1',
    'autorenewable.purchase1',
    'nonrenewing.purchase1',
  ],
  android: ['noa_coin1', 'paz_test', 'btc'],
});

const subscriptions = ['cheap', 'intro'];

class App extends Component {
  purchaseUpdateSubscription = null;
  purchaseErrorSubscription = null;

  componentDidMount() {
    this.setupIAP();
  }

  setupIAP = async () => {
    try {
      await initConnection();
      if (Platform.OS == 'android') {
        await flushFailedPurchasesCachedAsPendingAndroid().catch(() => {
          console.warn(
            "there are pending purchases that are still pending (we can't consume a pending purchase)",
          );
        });
      }

      await getProducts({skus: items})
        .then(res => {
          console.log('[Products] >> ', res);
        })
        .catch(err => {
          console.log('[Error finding products] >> ', err);
        });
      await getSubscriptions({skus: subscriptions})
        .then(res => {
          console.log('[Subscriptions] >> ', res);
        })
        .catch((err) => {
         console.log('[Error finding Subscriptions] >> ', err);
       });
        this.purchaseUpdateSubscription = purchaseUpdatedListener(
         async purchase => {
           try {
             console.log('purchaseUpdatedListener', purchase);
             const receipt = purchase.transactionReceipt;
             if (receipt) {
               // Check if the purchased product is a subscription or a consumable item
               const isSubscription = subscriptions.includes(purchase.productId);
               const isConsumable = items.includes(purchase.productId);
       
               console.log('[Receipt] >> ', receipt);
               if (isSubscription || isConsumable) {
                 await finishTransaction({
                   purchase: purchase,
                   isConsumable: isConsumable, // true for consumables, false for subscriptions
                 }).catch(error => {
                   console.warn('Error finishing transaction:', error);
                 });
               } else {
                 // Handle the case where the purchase is non-consumable and not a subscription.
                 await finishTransaction({
                   purchase: purchase,
                   isConsumable: false,
                 }).catch(error => {
                   console.warn('Error finishing transaction:', error);
                 });
               }
             }
           } catch (error) {
             console.warn('Error in purchaseUpdatedListener', error);
           }
         },
       );

      this.purchaseErrorSubscription = purchaseErrorListener(error => {
        console.warn('purchaseErrorListener', error);
      });
    } catch (err) {
      console.warn('Failed to init IAP connection:', err);
    }
  };

  componentWillUnmount() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }

    endConnection();
  }

  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#52c41a',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'The AppsFlyer Shop!',
            }}
          />
          <Stack.Screen name="Cart" component={withIAPContext(Cart)} />
          <Stack.Screen
            name="Item"
            component={Item}
            options={({route}) => ({title: route.params.product.name})}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

export default withIAPContext(App);
