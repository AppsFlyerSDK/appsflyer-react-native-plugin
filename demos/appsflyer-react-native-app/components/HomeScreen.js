/* @flow weak */
import { NativeEventEmitter, NativeModules } from "react-native";
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {Card, ListItem, Button, FAB, Badge} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  PCInit,
  AFInit,
  AFLogEvent,
  AF_clickOnItem,
  AF_addedToCart,
  AF_removedFromCart,
  AF_checkout,
  AF_viewCart,
} from './AppsFlyer.js';
import Product from './Product.js';
import WelcomeModal from './WelcomeModal.js';

const products = [
  {
    name: 'Water melon',
    image: 'https://images.unsplash.com/photo-1652031552021-50bcc01121a7',
    price: 15,
    info: 'Summer vibes!',
  },
  {
    name: 'Strawberry',
    image: 'https://images.unsplash.com/photo-1594282241894-4da286138f44',
    price: 11,
    info: 'Strawberry Fields Forever!',
  },
  {
    name: 'Peach',
    image: 'https://images.unsplash.com/photo-1532704868953-d85f24176d73',
    price: 12,
    info: 'Be a peach!',
  },
    {
    name: 'Banana',
    image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24',
    price: 10,
    info: 'Go bananas!',
  },
  {
    name: 'Melon',
    image: 'https://images.unsplash.com/photo-1638865553538-2434be4c62bd',
    price: 13,
    info: 'Summer vibes!',
  },
  {
    name: 'Apple',
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb',
    price: 14,
    info: '1 apple a day keeps the doctor away! :)',
  },

];

const getProductByName = productName => {
  for (let i = 0; i < products.length; i++) {
    if (products[i].name == productName) {
      return products[i];
    }
  }
};

const productKeyExtractor = item => item.name;

const HomeScreen = ({navigation}) => {
  const [cartSize, setCartSize] = useState(0);
  const [itemsInCart, setItemsInCart] = useState([]);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  const goToProductScreen = useCallback(
    (product, addToCart) => {
      AFLogEvent(AF_clickOnItem, product);
      navigation.navigate('Item', {
        product: product,
        addToCart: addToCart,
      });
    },
    [navigation],
  );

  const addProductToCart = useCallback(product => {
    AFLogEvent(AF_addedToCart, product);
    // Tag each cart line with a unique id so list keys stay stable even when the
    // same product is added more than once.
    setItemsInCart(prev => [
      ...prev,
      {...product, cartId: `${product.name}-${prev.length}-${Date.now()}`},
    ]);
  }, []);

  const renderProduct = useCallback(
    ({item}) => (
      <Product
        product={item}
        goToProductScreen={goToProductScreen}
        addToCart={addProductToCart}
      />
    ),
    [goToProductScreen, addProductToCart],
  );

  const removeProductFromCart = product => {
    AFLogEvent(AF_removedFromCart, product);
    // Remove every cart line matching this product (same name + price), so
    // deleting a grouped row clears the whole quantity.
    setItemsInCart(prev =>
      prev.filter(
        p => !(p.name === product.name && p.price === product.price),
      ),
    );
  };

  const goToCart = (productList, removeProductFromCart, checkout) => {
    let eventValues = {
      cart_size: productList.length,
    };
    AFLogEvent(AF_viewCart, eventValues);
    navigation.navigate('Cart', {
      productList: productList,
      removeProductFromCart: removeProductFromCart,
      checkout: checkout,
    });
  };

  const calculateTotalRevenue = () => {
    let totalRevenue = 0;
    for (var i = 0; i < itemsInCart.length; i++) {
      totalRevenue += itemsInCart[i].price;
    }
    return totalRevenue;
  };

  const checkout = () => {
    let totalRevenue = calculateTotalRevenue();
    let checkoutValues = {
      productList: itemsInCart,
      af_revenue: totalRevenue,
    };
    console.log(checkoutValues);
    AFLogEvent(AF_checkout, checkoutValues);
    setItemsInCart([]);
  };

  const handleConversionData = useCallback(res => {
    console.log(">> registerConversionListener: " , res);
    // Payload is flat (no `.data` wrapper) — verified against native source, see
    // index.ts's ConversionData type comment.
    const isFirstLaunch = res?.is_first_launch;
    if (!(isFirstLaunch && JSON.parse(isFirstLaunch) === true)) {
      console.log('Not first launch!');
      return;
    }

    // Deferred deep links (click happened before install) never reach registerDeepLinkListener —
    // the SDK resolves them server-side via GCD and delivers the match here instead,
    // with is_first_launch=true. See known-issues-kb.md § Deferred deep link not working.
    const productName = res?.af_productName;
    const product = getProductByName(productName);
    if (product) {
      navigation.navigate('Item', {
        product: product,
        addToCart: addProductToCart,
        deepLinkValues: res,
      });
    } else {
      setIsFirstLaunch(true);
    }
  }, [navigation, addProductToCart]);

  const handleDeepLink = useCallback(res => {
    console.log(">> registerDeepLinkListener: " , res);
    if (res?.status === 'found') {
      const productName = res?.deepLink?.af_productName;
      const product = getProductByName(productName);
      console.log(product);
      if (product) {
        navigation.navigate('Item', {
          product: product,
          addToCart: addProductToCart,
          deepLinkValues: res,
        });
      }
    }
  }, [navigation, addProductToCart]);

  useEffect(() => {
    const {unsubscribeConversion, unsubscribeDeepLink} = AFInit(
      handleConversionData,
      handleDeepLink,
    );

    return () => {
      unsubscribeConversion();
      unsubscribeDeepLink();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <WelcomeModal
        isFirstLaunch={isFirstLaunch}
        dismissOverlay={() => setIsFirstLaunch(false)}
      />
      <FlatList
        data={products}
        keyExtractor={productKeyExtractor}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.fab}>
        <FAB
          title="Your Cart"
          color={'#69c0ff'}
          onPress={() => goToCart(itemsInCart, removeProductFromCart, checkout)}
        />
        <Badge
          value={itemsInCart.length}
          status="error"
          containerStyle={{
            position: 'absolute',
            top: -2,
            right: -2,
          }}
        />
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Clear the floating "Your Cart" FAB so the last card isn't hidden under it.
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    margin: 20,
  },
});
