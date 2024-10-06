/* @flow weak */

import React from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {ListItem, Avatar, Button} from 'react-native-elements';
//import {InAppPurchase} from 'react-native-iap';

const Cart = ({route, navigation}) => {
  const {productList, removeProductFromCart, checkout} = route.params;
  
  /*
  const productIds = [
    'one1',
    'non.cons2',
    'auto.renew',
    'non.renew',
    'cons.test',
    'nonconsumable.purchase1',
    'autorenewable.purchase1',
    'nonrenewing.purchase1',
  ];

  InAppPurchase.getProducts(productIds)
    .then(products => {
      console.log('Products:', products);
    })
    .catch(error => {
      console.log('Error fetching products:', error);
    });
  */

  const handleRemove = product => {
    removeProductFromCart(product);
    navigation.goBack();
  };

  const handleCheckout = () => {
    if (productList.length !== 0) {
      checkout();
      navigation.goBack();
    } else {
      Alert.alert(
        'Cart Empty', // Alert Title
        'The cart is empty.', // Alert Message
        [
          {
            text: 'OK',
            onPress: () => console.log('OK Pressed'),
            style: 'cancel',
          },
        ],
        {
          cancelable: true, // whether the alert can be dismissed by tapping outside of the alert box
          onDismiss: () => console.log('Alert dismissed'), // a callback that gets called when the alert is dismissed
        },
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {productList.map((product, index) => {
          return (
            <ListItem.Swipeable
              key={index}
              bottomDivider="bottomDivider"
              rightContent={
                <Button
                  title="Delete"
                  buttonStyle={{minHeight: '100%', backgroundColor: 'red'}}
                  onPress={() => handleRemove(product)}
                />
              }>
              <Avatar
                source={{
                  uri: product.image,
                }}
              />
              <ListItem.Content>
                <ListItem.Title>{product.name}</ListItem.Title>
                <ListItem.Subtitle>{`${product.price} USD`}</ListItem.Subtitle>
              </ListItem.Content>
            </ListItem.Swipeable>
          );
        })}
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
