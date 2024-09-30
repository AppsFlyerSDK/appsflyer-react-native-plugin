/* @flow weak */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {Card, ListItem, Button, FAB, Badge} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import appsFlyer from 'react-native-appsflyer';
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

const HomeScreen = ({navigation}) => {
  const products = [
    {
      name: 'Banana',
      image:
        'https://cdn.mos.cms.futurecdn.net/42E9as7NaTaAi4A6JcuFwG-1200-80.jpg',
      price: 10,
      info: 'Go bananas!',
    },
    {
      name: 'Strawberry',
      image: 'https://images.unsplash.com/photo-1467825487722-2a7c4cd62e75',
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
      name: 'Melon',
      image: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50',
      price: 13,
      info: 'Summer vibes!',
    },
    {
      name: 'Apple',
      image: 'https://images.unsplash.com/photo-1601236007883-e8c3079bebe0',
      price: 14,
      info: '1 apple a day keeps the doctor away! :)',
    },
    {
      name: 'Water melon',
      image: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b',
      price: 15,
      info: 'Summer vibes!',
    },
  ];
  let AFGCDListener = null;
  let AFUDLListener = null;
  const [cartSize, setCartSize] = useState(0);
  const [itemsInCart, setItemsInCart] = useState([]);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  const goToProductScreen = (product, addToCart) => {
    AFLogEvent(AF_clickOnItem, product);
    navigation.navigate('Item', {
      product: product,
      addToCart: addToCart,
    });
  };

  const addProductToCart = product => {
    AFLogEvent(AF_addedToCart, product);
    setItemsInCart(prev => [...prev, product]);
  };

  const removeProductFromCart = product => {
    let tempList = [...itemsInCart];
    let index = tempList.indexOf(product);
    if (index !== -1) {
      AFLogEvent(AF_removedFromCart, product);
      tempList.splice(index, 1);
      setItemsInCart(tempList);
    }
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

  const getProductByName = productName => {
    for (let i = 0; i < products.length; i++) {
      if (products[i].name == productName) {
        return products[i];
      }
    }
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

  // AppsFlyer initialization!
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    AFGCDListener = appsFlyer.onInstallConversionData(res => {
      const isFirstLaunch = res?.data?.is_first_launch;

      if (isFirstLaunch && JSON.parse(isFirstLaunch) === true) {
        setIsFirstLaunch(true);
      } else {
        console.log('Not first launch!');
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    AFUDLListener = appsFlyer.onDeepLink(res => {
      if (res?.deepLinkStatus !== 'NOT_FOUND') {
        const productName = res?.data?.af_productName;
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
    });
    AFInit();
    PCInit();

    return () => {
      AFGCDListener();
      AFUDLListener();
    };
  }, []);

  useEffect(() => {}, [itemsInCart]);

  return (
    <View style={styles.container}>
      <WelcomeModal
        isFirstLaunch={isFirstLaunch}
        dismissOverlay={() => setIsFirstLaunch(false)}
      />
      <ScrollView>
        {products.map((product, index) => {
          return (
            <Product
              key={index}
              product={product}
              goToProductScreen={goToProductScreen}
              addToCart={addProductToCart}
            />
          );
        })}
      </ScrollView>
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
  container: {},
  fab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    margin: 20,
  },
});
