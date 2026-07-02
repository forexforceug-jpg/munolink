import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Onboarding({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <Text style={styles.headline}>
          Your{' '}
          <Text style={styles.highlight}>Partner</Text>
          {'\n'}in Every Purchase
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Find nearby shops, compare real prices, save money and pay instantly.
        </Text>

        {/* Illustration Area */}
        <View style={styles.illustrationArea}>
          {/* Feature Cards (Left Side) */}
          <View style={styles.cardsColumn}>
            {/* Card 1 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="location-outline" size={18} color="#7aa7fc" />
              </View>
              <Text style={styles.featureText}>Best Prices Nearby</Text>
            </View>

            {/* Card 2 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="pricetag-outline" size={18} color="#4171c9" />
              </View>
              <Text style={styles.featureText}>Real Discounts Every Time</Text>
            </View>

            {/* Card 3 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash-outline" size={18} color="#4171c9" />
              </View>
              <Text style={styles.featureText}>Pay Instantly & Save</Text>
            </View>
          </View>

          {/* Phone Mockup (Right Side) */}
          <View style={styles.phoneMockup}>
            {/* Placeholder map inside phone */}
            <View style={styles.phoneScreen}>
              <View style={styles.mapPlaceholder}>
                <View style={styles.mapPin1} />
                <View style={styles.mapPin2} />
                <View style={styles.mapPin3} />
              </View>
            </View>
          </View>
        </View>

        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </ScrollView>

      {/* Get Started Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('AccountType')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: '#212121',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  highlight: {
    color: '#5872e7',
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  illustrationArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  cardsColumn: {
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  phoneMockup: {
    width: 130,
    height: 240,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#3a3939',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e4edff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPin1: {
    position: 'absolute',
    top: '25%',
    left: '35%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#477fbe',
    opacity: 0.6,
  },
  mapPin2: {
    position: 'absolute',
    top: '45%',
    right: '30%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4171c9',
    opacity: 0.7,
  },
  mapPin3: {
    position: 'absolute',
    bottom: '30%',
    left: '40%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4171c9',
    opacity: 0.5,
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  dotActive: {
    backgroundColor: '#4171c9',
    width: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  getStartedButton: {
    backgroundColor: '#4171c9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});