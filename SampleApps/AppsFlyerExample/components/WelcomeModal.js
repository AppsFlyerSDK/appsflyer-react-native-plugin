/* @flow weak */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const WelcomeModal = ({}) => (
  <View style={styles.container}>
    <Text>I'm WelcomeModal
  </Text>
  </View>
);

export default WelcomeModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
