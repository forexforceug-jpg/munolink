import { View, Text, StyleSheet, Animated, Image, ImageBackground, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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
        useNativeDriver: false,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();

    // Bottom icons appear slightly after the logo
    setTimeout(() => {
      Animated.timing(bottomFadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }, 400);

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/splash-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Transparent dark overlay */}
        <View style={styles.overlay} />

        {/* Logo and content */}
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
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
        </Animated.View>

        {/* Bottom Icons Row */}
        <Animated.View style={[styles.bottomRow, { opacity: bottomFadeIn }]}>
          {/* Find */}
          <View style={styles.iconItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.iconLabel}>Find</Text>
          </View>

          {/* Trust */}
          <View style={styles.iconItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.iconLabel}>Trust</Text>
          </View>

          {/* Save */}
          <View style={styles.iconItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="pricetag" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.iconLabel}>Save</Text>
          </View>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  background: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 24,
    resizeMode: 'contain',
    zIndex: 1,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '80%',
    zIndex: 1,
  },
  iconItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(21, 111, 185, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(10, 43, 87, 0.3)',
  },
  iconLabel: {
    fontSize: 14,
    color: '#1b72c4',
    fontWeight: '900',
    letterSpacing: 1,
  },
});