/* @flow weak */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

const Item = ({route, navigation}) => {
  const {product, addToCart, deepLinkValues = null} = route.params;

  const discount = deepLinkValues
    ? parseFloat(deepLinkValues.data.af_discount)
    : 0;

  const calculateNewPrice = () => {
    const oldPrice = product.price;
    return oldPrice - oldPrice * (discount / 100);
  };

  // Discounted product is derived from the deep link during render — the price
  // never changes after mount, so no state or effect is needed.
  const updatedProduct = deepLinkValues
    ? {...product, price: calculateNewPrice()}
    : null;

  const handleClick = () => {
    addToCart(updatedProduct ? updatedProduct : product);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
          source={{uri: product.image}}
          style={styles.hero}
          resizeMode="cover"
        />
        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.info}>{product.info}</Text>

          <View style={styles.priceRow}>
            {deepLinkValues ? (
              <>
                <Text style={styles.oldPrice}>{`${product.price} USD`}</Text>
                <Text style={styles.price}>
                  {`${calculateNewPrice().toFixed(2)} USD`}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{`${discount}% OFF`}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>{`${product.price} USD`}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({pressed}) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={handleClick}>
          <Text style={styles.ctaText}>Add to cart</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Item;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingBottom: 24,
  },
  hero: {
    width: '100%',
    height: 300,
    backgroundColor: '#f2f2f2',
  },
  body: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  info: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: 'green',
  },
  oldPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  badge: {
    backgroundColor: '#e53935',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 12,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  footer: {
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  cta: {
    backgroundColor: '#2089dc',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
