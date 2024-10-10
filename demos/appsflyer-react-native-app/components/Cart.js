/* @flow weak */

import React from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {ListItem, Avatar, Button} from 'react-native-elements';
import { requestPurchase, requestSubscription, RequestPurchase } from 'react-native-iap';


const Cart = ({route, navigation}) => {
  const {productList, removeProductFromCart, checkout} = route.params;

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
    android: ['paz_test', 'btc'],
  });

  const subscriptions = ['cheap' , 'intro'];

  // Added methods
  const purchase = async (sku: string) => {
    try {
      let purchaseParams: RequestPurchase = {
        sku,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      };
      if (Platform.OS === 'android') {
        purchaseParams = { skus: [sku] };
      }
      await requestPurchase(purchaseParams);
    } catch (err) {
      console.warn(err.code, err.message);
    }
  };

  const subscribe = async (sku, offerToken) => {
    try {
      await requestSubscription({
        sku,
        ...(offerToken && {subscriptionOffers: [{sku, offerToken}]}),
      });
    } catch (err) {
      console.warn(err.code, err.message);
    }
  };

  const handleRemove = product => {
    removeProductFromCart(product);
    navigation.goBack();
  };

  const handleCheckout = () => {
    if (productList.length !== 0) {
      checkout();
      //purchase(items[1]);
      //subscribe(subscriptions[0]); // Hardcoded for testing. 
      navigation.goBack();
    } else {
      Alert.alert(
        'Cart Empty',
        'The cart is empty.',
        [
          {
            text: 'OK',
            onPress: () => console.log('OK Pressed'),
            style: 'cancel',
          },
        ],
        {
          cancelable: true,
          onDismiss: () => console.log('Alert dismissed'),
        },
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {productList.map((product, index) => (
          <ListItem.Swipeable
            key={index}
            bottomDivider
            rightContent={
              <Button
                title="Delete"
                buttonStyle={{minHeight: '100%', backgroundColor: 'red'}}
                onPress={() => handleRemove(product)}
              />
            }>
            <Avatar source={{uri: product.image}} />
            <ListItem.Content>
              <ListItem.Title>{product.name}</ListItem.Title>
              <ListItem.Subtitle>{`${product.price} USD`}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem.Swipeable>
        ))}
      </ScrollView>
      <Button
        buttonStyle={styles.checkoutButton}
        title="Checkout"
        onPress={handleCheckout}
      />
    </View>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  checkoutButton: {
    height: 75,
  },
});
