/* @flow weak */

import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const COLORS = ['#52c41a', '#2089dc', '#e53935', '#fbc02d', '#ab47bc', '#26c6da'];
const PIECES = 90;

const ConfettiPiece = ({delay, startX, drift, color, size, duration, spin, fallTo}) => {
  // Lazy ref init — create the Animated.Value once, not on every render.
  const anim = useRef();
  if (!anim.current) {
    anim.current = new Animated.Value(0);
  }

  useEffect(() => {
    Animated.timing(anim.current, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [delay, duration]);

  const translateY = anim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, fallTo],
  });
  const translateX = anim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, startX + drift],
  });
  const rotate = anim.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${spin}deg`],
  });
  const opacity = anim.current.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          transform: [{translateY}, {translateX}, {rotate}],
          opacity,
        },
      ]}
    />
  );
};

// Lightweight, dependency-free confetti burst using the Animated API.
export default function Confetti() {
  const {width, height} = useWindowDimensions();

  // Lazy ref init — generate the piece set once for the component's lifetime.
  const piecesRef = useRef();
  if (!piecesRef.current) {
    piecesRef.current = Array.from({length: PIECES}).map((_, i) => ({
      key: i,
      delay: Math.random() * 450,
      startX: Math.random() * width,
      drift: (Math.random() - 0.5) * 160,
      color: COLORS[i % COLORS.length],
      size: 8 + Math.random() * 8,
      duration: 2600 + Math.random() * 1600,
      spin: 360 + Math.random() * 900,
    }));
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {piecesRef.current.map(p => (
        <ConfettiPiece
          key={p.key}
          delay={p.delay}
          startX={p.startX}
          drift={p.drift}
          color={p.color}
          size={p.size}
          duration={p.duration}
          spin={p.spin}
          fallTo={height + 60}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
