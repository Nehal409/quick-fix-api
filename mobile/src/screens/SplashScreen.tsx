import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { Colors, Fonts } from '../theme';

type Props = {
  onDone: () => void;
};

export function SplashScreen({ onDone }: Props) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 100,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),
      // Tagline fades in
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 350,
        delay: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      // Hold
      Animated.delay(700),
      // Fade out whole screen
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Background decoration circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        {/* Icon badge */}
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>🔧</Text>
        </View>

        <Text style={styles.logoText}>Quickfix</Text>

        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Home services, on demand
        </Animated.Text>
      </Animated.View>

      <Animated.Text style={[styles.footer, { opacity: tagOpacity }]}>
        Built with care in Karachi
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  circle1: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -60,
    left: -60,
  },

  center: {
    alignItems: 'center',
  },

  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },

  logoText: {
    fontSize: 44,
    fontFamily: Fonts.latin.bold,
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },

  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 10,
    letterSpacing: 0.3,
    fontFamily: Fonts.latin.regular,
  },

  footer: {
    position: 'absolute',
    bottom: 48,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
});
