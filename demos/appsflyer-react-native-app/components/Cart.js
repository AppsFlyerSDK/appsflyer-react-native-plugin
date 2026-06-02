/* @flow weak */
import React, {useCallback, useMemo, useState} from 'react';
import {View, Text, StyleSheet, FlatList, Pressable, Platform} from 'react-native';
import {ListItem, Avatar, Button} from 'react-native-elements';
import {
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  RequestPurchase,
  finishTransaction,
} from 'react-native-iap';
import Confetti from './Confetti';

// Memoized row: re-renders only when its product or remove handler changes, so
// the per-row source object and press handler aren't rebuilt on every list pass.
const CartRow = React.memo(({group, onRemove}) => {
  const {product, quantity} = group;
  const imageSource = useMemo(() => ({uri: product.image}), [product.image]);
  const handlePress = useCallback(() => onRemove(product), [onRemove, product]);
  return (
    <ListItem.Swipeable
      bottomDivider
      containerStyle={styles.row}
      rightContent={
        <Button
          title="Delete"
          buttonStyle={styles.deleteButton}
          onPress={handlePress}
        />
      }>
      <Avatar
        source={imageSource}
        size={56}
        avatarStyle={styles.avatarImage}
        containerStyle={styles.avatar}
      />
      {quantity > 1 && (
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>{`×${quantity}`}</Text>
        </View>
      )}
      <ListItem.Content>
        <ListItem.Title style={styles.rowName}>{product.name}</ListItem.Title>
        {quantity > 1 && (
          <ListItem.Subtitle style={styles.rowUnit}>
            {`${formatPrice(product.price)} USD each`}
          </ListItem.Subtitle>
        )}
      </ListItem.Content>
      <Text style={styles.rowPrice}>
        {`${formatPrice(product.price * quantity)} USD`}
      </Text>
    </ListItem.Swipeable>
  );
});

// Collapse duplicate cart lines (same name + price) into one row with a quantity.
const groupCart = items => {
  const map = new Map();
  items.forEach(item => {
    const key = `${item.name}|${item.price}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      map.set(key, {key, product: item, quantity: 1});
    }
  });
  return Array.from(map.values());
};

const formatPrice = n => (Number.isInteger(n) ? n : n.toFixed(2));

const groupKeyExtractor = group => group.key;

const Cart = ({route, navigation}) => {
  const {productList, removeProductFromCart, checkout} = route.params;
  const [summary, setSummary] = useState(null);

  /*
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

  const total = useMemo(
    () => productList.reduce((sum, p) => sum + p.price, 0),
    [productList],
  );

  const groups = useMemo(() => groupCart(productList), [productList]);

  const handleRemove = useCallback(
    product => {
      removeProductFromCart(product);
      navigation.goBack();
    },
    [removeProductFromCart, navigation],
  );

  const renderItem = useCallback(
    ({item}) => <CartRow group={item} onRemove={handleRemove} />,
    [handleRemove],
  );

  const handleCheckout = () => {
    // Snapshot the cart for the summary before checkout() clears the source list.
    setSummary({groups: groupCart(productList), total, count: productList.length});
    checkout();
  };

  if (productList.length === 0 && !summary) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse the shop and add a few items to get started.
        </Text>
        <Pressable
          style={({pressed}) => [styles.browseBtn, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.browseBtnText}>Browse products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={groupKeyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{`${total} USD`}</Text>
        </View>
        <Pressable
          style={({pressed}) => [styles.checkout, pressed && styles.pressed]}
          onPress={handleCheckout}>
          <Text style={styles.checkoutText}>{`Checkout · ${total} USD`}</Text>
        </Pressable>
      </View>

      {summary && (
        <View style={styles.overlay}>
          <Confetti />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>🎉</Text>
            <Text style={styles.summaryTitle}>Purchase complete!</Text>
            <Text style={styles.summarySub}>
              {`${summary.count} item${summary.count === 1 ? '' : 's'} purchased`}
            </Text>
            <View style={styles.summaryList}>
              {summary.groups.map(g => (
                <View key={g.key} style={styles.summaryLine}>
                  <Text style={styles.summaryName} numberOfLines={1}>
                    {g.quantity > 1
                      ? `${g.product.name} × ${g.quantity}`
                      : g.product.name}
                  </Text>
                  <Text style={styles.summaryPrice}>
                    {`${formatPrice(g.product.price * g.quantity)} USD`}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total paid</Text>
              <Text style={styles.summaryTotalValue}>
                {`${summary.total} USD`}
              </Text>
            </View>
            <Pressable
              style={({pressed}) => [styles.doneBtn, pressed && styles.pressed]}
              onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 12,
  },
  row: {
    paddingVertical: 14,
  },
  avatar: {
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  avatarImage: {
    borderRadius: 10,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rowPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: 'green',
  },
  qtyBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 6,
    backgroundColor: '#52c41a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  qtyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  rowUnit: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  browseBtn: {
    marginTop: 24,
    backgroundColor: '#52c41a',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: 'green',
  },
  checkout: {
    backgroundColor: '#2089dc',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 52,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 8,
  },
  summarySub: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  summaryList: {
    alignSelf: 'stretch',
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  summaryName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  summaryPrice: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 14,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: 'green',
  },
  doneBtn: {
    alignSelf: 'stretch',
    marginTop: 20,
    backgroundColor: '#52c41a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    minHeight: '100%',
    backgroundColor: 'red',
  },
});
