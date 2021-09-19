/* @flow weak */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Button, Overlay, Text, Image } from 'react-native-elements';

const WelcomeModal = ({isFirstLaunch, dismissOverlay}) => (
  <Overlay style={styles.container} isVisible={isFirstLaunch} onBackdropPress={dismissOverlay}>
    <Text h3 style={styles.text}>Welcome To Our Shop!</Text>
    <Text style={styles.text}>This is you first time here, Enjoy!</Text>
    <View style={{alignSelf: 'center',}}>
    <Image source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTm4UweZLcHeCE_dMi9NksiN94kdl1XVaVeDMjgd9aaeE2g2SsOmv5hW967k3O8VZ2_7AI&usqp=CAU' }} style={styles.image}/>
    </View>
  </Overlay>
);

export default WelcomeModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    alignSelf: 'center',
    marginTop: 20
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 20
  }
});
