import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AccountType({ navigation }) {
  const [selectedType, setSelectedType] = useState('customer');

  const progressSteps = ['Account Type', 'Profile Setup', 'Verification'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.logoCenter}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.logoText}>Munolink</Text>
          <Text style={styles.logoTagline}>For Better Connections</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={20} color="#006B3F" />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          {progressSteps.map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                index === 0 && styles.progressDotActive,
              ]}>
                <Text style={[
                  styles.progressDotText,
                  index === 0 && styles.progressDotTextActive,
                ]}>{index + 1}</Text>
              </View>
              <Text style={[
                styles.progressLabel,
                index === 0 && styles.progressLabelActive,
              ]}>{step}</Text>
              {index < 2 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.mainTitle}>Let's get you started</Text>
        <Text style={styles.mainSubtitle}>Choose how you want to use Munolink</Text>

        {/* Customer Card */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedType === 'customer' && styles.roleCardActive,
          ]}
          onPress={() => setSelectedType('customer')}
        >
          <View style={styles.roleContent}>
            <View style={[styles.roleImageBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="person" size={32} color="#006B3F" />
              <View style={[styles.roleFloatingIcon, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="cart-outline" size={16} color="#006B3F" />
              </View>
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleTitle, { color: '#006B3F' }]}>Customer</Text>
              <Text style={styles.roleDesc}>
                Discover products and services nearby, compare prices, and make bookings with ease.
              </Text>
              <View style={styles.featureChips}>
                <View style={[styles.featureChip, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="search-outline" size={12} color="#006B3F" />
                  <Text style={[styles.featureChipText, { color: '#006B3F' }]}>Search</Text>
                </View>
                <View style={[styles.featureChip, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="calendar-outline" size={12} color="#006B3F" />
                  <Text style={[styles.featureChipText, { color: '#006B3F' }]}>Book</Text>
                </View>
                <View style={[styles.featureChip, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="card-outline" size={12} color="#006B3F" />
                  <Text style={[styles.featureChipText, { color: '#006B3F' }]}>Pay</Text>
                </View>
                <View style={[styles.featureChip, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="pricetag-outline" size={12} color="#006B3F" />
                  <Text style={[styles.featureChipText, { color: '#006B3F' }]}>Save</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.radio, selectedType === 'customer' && styles.radioActive]}>
            {selectedType === 'customer' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Shop Owner Card */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedType === 'shopOwner' && styles.roleCardActiveShop,
          ]}
          onPress={() => setSelectedType('shopOwner')}
        >
          <View style={styles.roleContent}>
            <View style={[styles.roleImageBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="person" size={32} color="#1976D2" />
              <View style={[styles.roleFloatingIcon, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="storefront-outline" size={16} color="#1976D2" />
              </View>
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleTitle, { color: '#1976D2' }]}>Shop Owner</Text>
              <Text style={styles.roleDesc}>
                Sell products, manage your shop, receive orders, and grow your business.
              </Text>
              <View style={styles.featureChips}>
                <View style={[styles.featureChip, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="list-outline" size={12} color="#1976D2" />
                  <Text style={[styles.featureChipText, { color: '#1976D2' }]}>List Products</Text>
                </View>
                <View style={[styles.featureChip, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="clipboard-outline" size={12} color="#1976D2" />
                  <Text style={[styles.featureChipText, { color: '#1976D2' }]}>Manage Orders</Text>
                </View>
                <View style={[styles.featureChip, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="trending-up-outline" size={12} color="#1976D2" />
                  <Text style={[styles.featureChipText, { color: '#1976D2' }]}>Track Sales</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.radio, selectedType === 'shopOwner' && styles.radioActiveShop]}>
            {selectedType === 'shopOwner' && <View style={styles.radioInnerShop} />}
          </View>
        </TouchableOpacity>

        {/* Service Provider Card */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedType === 'serviceProvider' && styles.roleCardActiveService,
          ]}
          onPress={() => setSelectedType('serviceProvider')}
        >
          <View style={styles.roleContent}>
            <View style={[styles.roleImageBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="person" size={32} color="#F57C00" />
              <View style={[styles.roleFloatingIcon, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="briefcase-outline" size={16} color="#F57C00" />
              </View>
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleTitle, { color: '#F57C00' }]}>Service Provider</Text>
              <Text style={styles.roleDesc}>
                Offer services, receive bookings, serve customers, and build your reputation.
              </Text>
              <View style={styles.featureChips}>
                <View style={[styles.featureChip, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="calendar-outline" size={12} color="#F57C00" />
                  <Text style={[styles.featureChipText, { color: '#F57C00' }]}>Get Bookings</Text>
                </View>
                <View style={[styles.featureChip, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="chatbubble-outline" size={12} color="#F57C00" />
                  <Text style={[styles.featureChipText, { color: '#F57C00' }]}>Chat</Text>
                </View>
                <View style={[styles.featureChip, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="star-outline" size={12} color="#F57C00" />
                  <Text style={[styles.featureChipText, { color: '#F57C00' }]}>Build Reputation</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.radio, selectedType === 'serviceProvider' && styles.radioActiveService]}>
            {selectedType === 'serviceProvider' && <View style={styles.radioInnerService} />}
          </View>
        </TouchableOpacity>

        {/* Trust Panel */}
        <View style={styles.trustPanel}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={20} color="#006B3F" />
            <Text style={styles.trustText}>Secure & Verified</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={20} color="#006B3F" />
            <Text style={styles.trustText}>Safe Payments</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="person-outline" size={20} color="#006B3F" />
            <Text style={styles.trustText}>One Account</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="headset-outline" size={20} color="#006B3F" />
            <Text style={styles.trustText}>24/7 Support</Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            const role = selectedType === 'customer' ? 'customer'
              : selectedType === 'shopOwner' ? 'shop_owner'
              : 'service_provider';

            navigation.navigate('PhoneLogin', { role: role });
          }}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  logoCenter: { alignItems: 'center' },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  logoLetter: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  logoText: { fontSize: 16, fontWeight: '800', color: '#212121' },
  logoTagline: { fontSize: 9, color: '#006B3F', fontWeight: '500' },
  helpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  helpText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  progressBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  progressDotActive: { backgroundColor: '#006B3F' },
  progressDotText: { fontSize: 11, fontWeight: '700', color: '#888' },
  progressDotTextActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginLeft: 4 },
  progressLabelActive: { color: '#006B3F', fontWeight: '700' },
  progressLine: { width: 40, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#212121', textAlign: 'center', marginBottom: 4 },
  mainSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 22 },
  roleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 2, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center',
  },
  roleCardActive: {
    borderColor: '#006B3F', backgroundColor: '#FAFFFA',
  },
  roleCardActiveShop: {
    borderColor: '#1976D2', backgroundColor: '#FAFAFF',
  },
  roleCardActiveService: {
    borderColor: '#F57C00', backgroundColor: '#FFFCF8',
  },
  roleContent: { flexDirection: 'row', flex: 1 },
  roleImageBox: {
    width: 70, height: 70, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative',
  },
  roleFloatingIcon: {
    position: 'absolute', bottom: -6, right: -6,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  roleDesc: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 10 },
  featureChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4,
  },
  featureChipText: { fontSize: 10, fontWeight: '600' },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  radioActive: { borderColor: '#006B3F' },
  radioActiveShop: { borderColor: '#1976D2' },
  radioActiveService: { borderColor: '#F57C00' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#006B3F' },
  radioInnerShop: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1976D2' },
  radioInnerService: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F57C00' },
  trustPanel: {
    flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 16, padding: 14,
    marginBottom: 22, justifyContent: 'space-between',
  },
  trustItem: { alignItems: 'center', gap: 4, flex: 1 },
  trustText: { fontSize: 9, color: '#006B3F', fontWeight: '600', textAlign: 'center' },
  continueBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#006B3F', paddingVertical: 16, borderRadius: 30, gap: 8,
    marginBottom: 16,
  },
  continueText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInText: { fontSize: 14, color: '#888' },
  signInLink: { fontSize: 14, fontWeight: '700', color: '#006B3F' },
});