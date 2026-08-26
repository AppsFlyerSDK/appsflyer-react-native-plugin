/* @flow weak */

import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {Overlay} from 'react-native-elements';

const WelcomeModal = ({isFirstLaunch, dismissOverlay}) => (
  <Overlay
    isVisible={isFirstLaunch}
    onBackdropPress={dismissOverlay}
    overlayStyle={styles.overlay}>
    <View style={styles.badge}>
      <Text style={styles.emoji}>🛍️</Text>
    </View>
    <Text style={styles.title}>Welcome to the AppsFlyer Shop!</Text>
    <Text style={styles.subtitle}>
      Looks like it's your first time here. Browse fresh picks, add them to your
      cart, and check out — enjoy!
    </Text>
    <Pressable
      style={({pressed}) => [styles.button, pressed && styles.pressed]}
      onPress={dismissOverlay}>
      <Text style={styles.buttonText}>Start shopping</Text>
    </Pressable>
  </Overlay>
);

export default WelcomeModal;

const styles = StyleSheet.create({
  overlay: {
    width: '85%',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#eaf7e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },
  button: {
    marginTop: 24,
    alignSelf: 'stretch',
    backgroundColor: '#52c41a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
