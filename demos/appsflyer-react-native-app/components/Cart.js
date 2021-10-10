/* @flow weak */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {ListItem, Avatar, Button} from 'react-native-elements'

const Cart = ({route, navigation}) => {
   const {productList, removeProductFromCart, checkout} = route.params;

   const handleRemove = product => {
      removeProductFromCart(product);
      navigation.goBack();
   }

   const handleCheckout = () => {
     if (productList.length !== 0) {
       checkout();
       navigation.goBack();
     }
   }

   return (<View style={styles.container}>
      <ScrollView>
         {
            productList.map((product, index) => {
               return (<ListItem.Swipeable key={index} bottomDivider="bottomDivider" rightContent={<Button title = "Delete" buttonStyle = {{ minHeight: '100%', backgroundColor: 'red' }}onPress = {
                     () => handleRemove(product)
                  }
                  />}>
                  <Avatar source={{
                        uri: product.image
                     }}/>
                  <ListItem.Content>
                     <ListItem.Title>{product.name}</ListItem.Title>
                     <ListItem.Subtitle>{`${product.price} USD`}</ListItem.Subtitle>
                  </ListItem.Content>
               </ListItem.Swipeable>)
            })
         }
      </ScrollView>
      <Button buttonStyle={styles.checkoutButton} title='Checkout'onPress={handleCheckout}/>
   </View>);
}
export default Cart;

const styles = StyleSheet.create({
   container: {
      flex: 1
   },
   checkoutButton: {
     marginBottom: 10
   }
});
