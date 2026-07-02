import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export default function Personalization({ navigation, route }) {
  const phoneNumber = route?.params?.phoneNumber;
  const role = route?.params?.role || 'customer';

  const [firstName, setFirstName] = useState('');
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Request location permission
  const handleLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setLocationAllowed(true);
        Alert.alert('Location Allowed', 'Munolink will show you nearby shops and deals.');
      } else {
        setLocationAllowed(false);
        Alert.alert(
          'Location Denied',
          'You can enable location later in your device settings to see nearby shops.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not request location permission.');
    }
  };

  // Request notification permission
  const handleNotificationPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        setNotificationsEnabled(true);
        Alert.alert('Notifications Enabled', 'You will receive payment receipts and price alerts.');
      } else {
        setNotificationsEnabled(false);
        Alert.alert(
          'Notifications Denied',
          'You can enable notifications later in your device settings.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not request notification permission.');
    }
  };

  // Toggle location
  const toggleLocation = () => {
    if (locationAllowed) {
      setLocationAllowed(false);
    } else {
      handleLocationPermission();
    }
  };

  // Toggle notifications
  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      handleNotificationPermission();
    }
  };

  const handleContinue = async () => {
    if (firstName.trim().length === 0) {
      Alert.alert('Name Required', 'Please enter your first name to continue.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('users')
      .update({
        full_name: firstName.trim(),
      })
      .eq('phone_number', phoneNumber);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to save your information. Please try again.');
      return;
    }

    // Route based on role
    if (role === 'customer') {
      navigation.navigate('Home', {
        phoneNumber: phoneNumber,
        firstName: firstName.trim(),
      });
    } else if (role === 'shop_owner') {
      navigation.navigate('ShopOwnerDashboard');
    } else if (role === 'service_provider') {
      navigation.navigate('ServiceProviderDashboard');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#212121" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.heading}>
          Almost{' '}
          <Text style={styles.highlight}>there!</Text>
        </Text>

        <Text style={styles.subtitle}>
          Let's personalize{' '}
          <Text style={styles.highlight}>Munolink</Text>
          {' '}for you.
        </Text>

        {/* Card 1: Location Access */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-outline" size={22} color="#006B3F" />
            </View>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardTitle}>Location Access</Text>
              <Text style={styles.cardDescription}>
                We use your location to show nearby shops, services, and better deals.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#006B3F" />
          </View>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              locationAllowed && styles.permissionButtonDone,
            ]}
            onPress={toggleLocation}
          >
            <Ionicons
              name={locationAllowed ? 'checkmark-circle' : 'location-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.permissionButtonText}>
              {locationAllowed ? 'Location Allowed' : 'Allow Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card 2: Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={22} color="#006B3F" />
            </View>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardTitle}>Notifications</Text>
              <Text style={styles.cardDescription}>
                Get payment receipts, price alerts, and exclusive offers.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#006B3F" />
          </View>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              notificationsEnabled && styles.permissionButtonDone,
            ]}
            onPress={toggleNotifications}
          >
            <Ionicons
              name={notificationsEnabled ? 'checkmark-circle' : 'notifications-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.permissionButtonText}>
              {notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card 3: Your Name */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={22} color="#006B3F" />
            </View>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardTitle}>Your Name</Text>
              <Text style={styles.cardDescription}>
                This helps us personalize your experience.
              </Text>
            </View>
          </View>
          <View style={styles.nameInputContainer}>
            <Text style={styles.nameLabel}>First Name</Text>
            <View style={styles.nameInputRow}>
              <TextInput
                style={styles.nameInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#CCCCCC"
              />
              <Ionicons name="person-circle-outline" size={22} color="#888888" />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.continueText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.securityMessage}>
          <Ionicons name="shield-checkmark" size={14} color="#006B3F" />
          <Text style={styles.securityText}>
            Your data is secure with{' '}
            <Text style={styles.highlight}>Munolink</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 24,
    paddingBottom: 160,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 6,
  },
  highlight: {
    color: '#006B3F',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '400',
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleArea: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
  },
  permissionButton: {
    flexDirection: 'row',
    backgroundColor: '#006B3F',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  permissionButtonDone: {
    backgroundColor: '#4CAF50',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameInputContainer: {
    marginTop: 4,
  },
  nameLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 8,
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    height: 50,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    height: '100%',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    backgroundColor: '#006B3F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  securityMessage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#888888',
  },
});