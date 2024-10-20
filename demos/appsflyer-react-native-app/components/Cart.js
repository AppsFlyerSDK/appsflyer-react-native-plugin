/* @flow weak */
import React from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {ListItem, Avatar, Button} from 'react-native-elements';
import {
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  RequestPurchase,
  finishTransaction,
} from 'react-native-iap';

const Cart = ({route, navigation}) => {
  const {productList, removeProductFromCart, checkout} = route.params;

  // Test items (hardcoded)
  /*
  const items = Platform.select({
    ios: [
      'com.appsflyer.inapppurchase.non.cons',
      'com.appsflyer.inapppurchase.cons',
      'com.appsflyer.inapppurchase.two',
    ],
    android: ['noa_coin1', 'paz_test', 'btc'],
  });

  const subscriptions = Platform.select({
    ios: [
      'com.appsflyer.inapppurchase.non.renew',
      'com.appsflyer.inapppurchase.auto.renew',
    ],
    android: ['cheap', 'intro'],
  });

  // Added methods
  const purchase = async (sku: string) => {
    try {
      let purchaseParams: RequestPurchase = {
        sku,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      };
      if (Platform.OS === 'android') {
        purchaseParams = {skus: [sku]};
      }
      await requestPurchase(purchaseParams);
    } catch (err) {
      console.warn(err.code, err.message);
    }
  };

  const subscribe = async (sku, offerToken) => {
    try {
      const offerDetails = await getSubscriptions({skus: [sku]});
      const subscriptionOffer = offerDetails.find(
        offer => offer.productId === sku,
      );

      // Check if offer details exist for the sku
      if (Platform.OS == 'android') {
        if (
          !subscriptionOffer ||
          !subscriptionOffer.subscriptionOfferDetails ||
          subscriptionOffer.subscriptionOfferDetails.length === 0
        ) {
          throw new Error(
            'Subscription offer details not found for sku: ' + sku,
          );
        }
        const offerToken =
          subscriptionOffer.subscriptionOfferDetails[0].offerToken;
      }

      await requestSubscription({
        sku,
        ...(offerToken && {subscriptionOffers: [{sku, offerToken}]}),
      });
    } catch (err) {
      console.warn(err.code, err.message);
    }
  };
  */

  const handleRemove = product => {
    removeProductFromCart(product);
    navigation.goBack();
  };

  const handleCheckout = () => {
    if (productList.length !== 0) {
      checkout();
      //Handle purchase or subscription for testing AF-PC in-app validation
      //purchase(items[0]);
      //subscribe(subscriptions[0]);
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
