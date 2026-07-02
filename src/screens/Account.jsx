import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Account({ navigation }) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const quickActions = [
    { icon: 'bookmark-outline', label: 'Saved Providers', count: 12 },
    { icon: 'calendar-outline', label: 'My Bookings', count: 8 },
    { icon: 'card-outline', label: 'Payments', count: 24 },
    { icon: 'location-outline', label: 'Addresses', count: 3 },
    { icon: 'star-outline', label: 'My Reviews', count: 15 },
  ];

  const accountSettings = [
    { icon: 'person-outline', title: 'Personal Information', desc: 'Name, phone, email, profile photo' },
    { icon: 'shield-checkmark-outline', title: 'Security', desc: 'PIN, biometrics, device management' },
    { icon: 'wallet-outline', title: 'Payment Methods', desc: 'Mobile money, bank accounts, cards' },
    { icon: 'location-outline', title: 'Addresses', desc: 'Home, work, saved locations' },
    { icon: 'notifications-outline', title: 'Notification Preferences', desc: 'Push, SMS, email alerts' },
    { icon: 'language-outline', title: 'Language', desc: 'English, Luganda, Swahili' },
    { icon: 'color-palette-outline', title: 'Theme', desc: 'Light, dark, system default' },
  ];

  const moreOptions = [
    { icon: 'help-circle-outline', title: 'Help Center', desc: 'FAQ, contact support, report issue' },
    { icon: 'gift-outline', title: 'Invite Friends', desc: 'Earn UGX 500 per referral' },
    { icon: 'information-circle-outline', title: 'About Munolink', desc: 'Version 1.0, terms, privacy' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Account</Text>
          <Text style={styles.headerSubtitle}>Manage your profile and preferences.</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('MyCart')}>
            <Ionicons name="cart-outline" size={24} color="#212121" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.headerProfilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileLeft}>
              <View style={styles.profilePhoto}>
                <Ionicons name="person" size={36} color="#FFFFFF" />
                <View style={styles.editPhotoBadge}>
                  <Ionicons name="camera" size={10} color="#FFFFFF" />
                </View>
              </View>
              <View>
                <Text style={styles.userName}>Junior Aijuka</Text>
                <Text style={styles.userUsername}>@junior_aijuka</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#006B3F" />
                  <Text style={styles.verifiedText}>Verified Account</Text>
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.userDetail}>
                    <Ionicons name="call-outline" size={11} color="#888" />
                    <Text style={styles.userDetailText}>+256 700 123 456</Text>
                  </View>
                  <View style={styles.userDetail}>
                    <Ionicons name="mail-outline" size={11} color="#888" />
                    <Text style={styles.userDetailText}>junior@email.com</Text>
                  </View>
                  <View style={styles.userDetail}>
                    <Ionicons name="location-outline" size={11} color="#888" />
                    <Text style={styles.userDetailText}>Jinja City, Uganda</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Munolink Pay</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>
                  {balanceVisible ? 'UGX 56,000' : '****'}
                </Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  <Ionicons
                    name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addMoneyBtn}>
                <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Premium Banner */}
        <View style={styles.premiumBanner}>
          <View style={styles.premiumLeft}>
            <View style={styles.premiumIcon}>
              <Ionicons name="diamond-outline" size={24} color="#006B3F" />
            </View>
            <View>
              <View style={styles.premiumTitleRow}>
                <Text style={styles.premiumTitle}>Munolink Premium</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>
              <Text style={styles.premiumSubtitle}>Exclusive discounts & priority support</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewBenefitsBtn}>
            <Text style={styles.viewBenefitsText}>View Benefits</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={20} color="#006B3F" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <Text style={styles.quickActionCount}>{action.count}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.settingsCard}>
          {accountSettings.map((setting, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingRow,
                index < accountSettings.length - 1 && styles.settingRowBorder,
              ]}
            >
              <View style={styles.settingIcon}>
                <Ionicons name={setting.icon} size={20} color="#006B3F" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDesc}>{setting.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* More */}
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.settingsCard}>
          {moreOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingRow,
                index < moreOptions.length - 1 && styles.settingRowBorder,
              ]}
            >
              <View style={styles.settingIcon}>
                <Ionicons name={option.icon} size={20} color="#006B3F" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Text style={styles.settingDesc}>{option.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutCard}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
          </View>
          <View style={styles.logoutInfo}>
            <Text style={styles.logoutTitle}>Log Out</Text>
            <Text style={styles.logoutDesc}>Sign out of your Munolink account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payNavButton}
          onPress={() => navigation.navigate('PaymentConfirm')}
        >
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>My Shops</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  headerSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F',
  },
  headerProfilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between' },
  profileLeft: { flexDirection: 'row', flex: 1 },
  profilePhoto: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, position: 'relative',
  },
  editPhotoBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  userName: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 1 },
  userUsername: { fontSize: 12, color: '#888', marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  verifiedText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  userDetails: { gap: 2 },
  userDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userDetailText: { fontSize: 11, color: '#888' },
  balanceCard: {
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, alignItems: 'center',
    marginLeft: 10, width: 110,
  },
  balanceLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginBottom: 8 },
  balanceAmount: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  addMoneyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#006B3F', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 16, gap: 4,
  },
  addMoneyText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 14, marginBottom: 18,
  },
  premiumLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  premiumIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  premiumTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  premiumTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  activeBadge: {
    backgroundColor: '#006B3F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  activeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  premiumSubtitle: { fontSize: 11, color: '#666' },
  viewBenefitsBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
  },
  viewBenefitsText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  quickActionsRow: { flexDirection: 'row', marginBottom: 22, gap: 6 },
  quickActionItem: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, gap: 4,
  },
  quickActionIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  quickActionLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  quickActionCount: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 10 },
  settingsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 4, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, gap: 10,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 1 },
  settingDesc: { fontSize: 11, color: '#888' },
  logoutCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF5F5', borderRadius: 14, padding: 14, gap: 10,
  },
  logoutIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center',
  },
  logoutInfo: { flex: 1 },
  logoutTitle: { fontSize: 14, fontWeight: '700', color: '#D32F2F', marginBottom: 1 },
  logoutDesc: { fontSize: 11, color: '#888' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  payNavButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#006B3F',
    justifyContent: 'center', alignItems: 'center', marginTop: -20,
    shadowColor: '#006B3F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});