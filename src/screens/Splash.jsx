import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Splash({ navigation }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const bottomFadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.timing(bottomFadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 400);

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeIn,
            transform: [
              { translateY: slideUp },
              { scale: scale },
            ],
          },
        ]}
      >
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />
      </Animated.View>

      <Animated.View style={[styles.bottomRow, { opacity: bottomFadeIn }]}>
        <View style={styles.iconItem}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔍</Text>
          </View>
          <Text style={styles.iconLabel}>Find</Text>
        </View>
        <View style={styles.iconItem}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🛡️</Text>
          </View>
          <Text style={styles.iconLabel}>Trust</Text>
        </View>
        <View style={styles.iconItem}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>💰</Text>
          </View>
          <Text style={styles.iconLabel}>Save</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  bottomRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '80%',
  },
  iconItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconText: {
    fontSize: 20,
  },
  iconLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 1,
  },
});