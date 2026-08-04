/**
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {Platform, LogBox, I18nManager} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import 'react-native-gesture-handler';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from './components/HomeScreen.js';
import Cart from './components/Cart.js';
import Item from './components/Item.js';

const Stack = createStackNavigator();

try {
  I18nManager.allowRTL(false);
} catch (e) {
  console.log('Failed to disable RTL', e);
}

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  // react-native-elements@3.4.3's ListItemBase/PadView injects an un-keyed
  // divider View internally (dist/list/ListItemBase.js) whenever ListItem
  // gets multiple children, as CartRow does — nothing in our JSX can key it.
  'Each child in a list should have a unique "key" prop',
]);

class App extends Component {
  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#52c41a',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'The AppsFlyer Shop!',
            }}
          />
          <Stack.Screen name="Cart" component={Cart} />
          <Stack.Screen
            name="Item"
            component={Item}
            options={({route}) => ({title: route.params.product.name})}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

export default App;
