/* @flow weak */

import React from 'react';
import {Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import {Overlay} from 'react-native-elements';

const ResultModal = ({result, onDismiss}) => (
  <Overlay
    isVisible={!!result}
    onBackdropPress={onDismiss}
    overlayStyle={styles.overlay}>
    <Text style={styles.title}>Callback Result</Text>
    <ScrollView style={styles.body}>
      <Text style={styles.json}>{JSON.stringify(result, null, 2)}</Text>
    </ScrollView>
    <Pressable
      style={({pressed}) => [styles.button, pressed && styles.pressed]}
      onPress={onDismiss}>
      <Text style={styles.buttonText}>Close</Text>
    </Pressable>
  </Overlay>
);

export default ResultModal;

const styles = StyleSheet.create({
  overlay: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  body: {
    marginTop: 14,
    alignSelf: 'stretch',
  },
  json: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 20,
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
