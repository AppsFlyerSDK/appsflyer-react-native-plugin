/* @flow weak */

import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {Image, Button} from 'react-native-elements';

const Item = ({route, navigation}) => {
   const {
      product,
      addToCart,
      deepLinkValues = null
   } = route.params;

   const [updatedProduct, setUpdatedProduct] = useState(null);

   useEffect(() => {
     if(deepLinkValues){
       let updatedProduct = JSON.parse(JSON.stringify(product));
       updatedProduct['price'] = calculateNewPrice();
       setUpdatedProduct(updatedProduct);
     }
   }, []);

   const handleClick = product => {
      addToCart(updatedProduct ? updatedProduct : product);
      navigation.goBack();
   }

   const calculateNewPrice = () => {
      let discount = parseFloat(deepLinkValues.data.af_discount);
      let oldPrice = product.price;
      return oldPrice - (oldPrice * (discount / 100));
   }

   return (<View style={styles.container}>
      <Image source={{
            uri: product.image
         }} style={styles.productImage} PlaceholderContent={<ActivityIndicator />}/>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productInfo}>{product.info}</Text>
      <View>
         <Text style={styles.productPrice}>{`${product.price} USD`}</Text>
         {
            deepLinkValues
               ? <View style={styles.redLine}/>
               : null
         }
         {
            deepLinkValues
               ? <Text style={styles.productPrice}>{`${calculateNewPrice()} USD`}</Text>
               : null
         }
      </View>
      <Button buttonStyle={styles.button} title='Add to cart' onPress={() => handleClick(product)}/>
   </View>);
}

export default Item;

const styles = StyleSheet.create({
   container: {
      flex: 1,
      alignItems: 'center',
      padding: 20
   },
   productName: {
      paddingTop: 20,
      fontSize: 40,
      color: 'black'
   },
   productPrice: {
      paddingTop: 20,
      color: 'green',
      fontSize: 30
   },
   productImage: {
      width: 250,
      height: 200
   },
   productInfo: {
      paddingTop: 20,
      fontSize: 20
   },
   button: {
      borderRadius: 20,
      padding: 10,
      marginTop: 30
   },
   redLine: {
      width: 110,
      height: 3,
      backgroundColor: 'red',
      borderRadius: 10,
      position: 'absolute',
      top: 40,
      right: -5
   }
});
