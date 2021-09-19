/* @flow weak */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Card, Button, Icon} from 'react-native-elements'

const Product = ({product, goToProductScreen, addToCart}) => (<Card containerStyle={styles.container}>
   <Card.Image style={styles.productImage} source={{
         uri: product.image
      }} onPress={() => goToProductScreen(product, addToCart)}/>
   <Text style={styles.productName}>{product.name}</Text>
   <Text style={styles.productPrice}>{`${product.price} USD`}</Text>
   <Button buttonStyle={styles.button} title='Add to cart' onPress={() => addToCart(product)}/>
</Card>);

export default Product;

const styles = StyleSheet.create({
   container: {
      alignItems: 'center',
      // width: '40%'
   },
   productName: {
      alignSelf: 'center',
      color: 'black'
   },
   productPrice: {
      color: 'green',
      alignSelf: 'center'
   },
   productImage: {
      alignSelf: 'center',
      width: 150,
      height: 100
   },
   button: {
      borderRadius: 20,
      marginBottom: 0
   }
});
