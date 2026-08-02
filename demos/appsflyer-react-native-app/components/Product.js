/* @flow weak */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Card, Button} from 'react-native-elements';

const Product = ({product, goToProductScreen, addToCart}) => (
  <Card containerStyle={styles.card}>
    <Card.Image
      containerStyle={styles.image}
      style={styles.image}
      resizeMode="cover"
      source={{uri: product.image}}
      onPress={() => goToProductScreen(product, addToCart)}
    />
    <View style={styles.body}>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.info} numberOfLines={1}>
        {product.info}
      </Text>
      <View style={styles.row}>
        <Text style={styles.price}>{`${product.price} USD`}</Text>
        <Button
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          title="Add to cart"
          onPress={() => addToCart(product)}
        />
      </View>
    </View>
  </Card>
);

export default React.memo(Product);

const styles = StyleSheet.create({
  card: {
    padding: 0,
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 190,
  },
  body: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
  },
  info: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: 'green',
  },
  buttonContainer: {
    borderRadius: 20,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 22,
    backgroundColor: '#2089dc',
  },
});
