import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceProviderProfileScreen({ navigation }) {
  const accountInfo = [
    { icon: 'person-outline', title: 'Personal Information', desc: 'Update your personal details', color: '#006B3F' },
    { icon: 'briefcase-outline', title: 'Business Information', desc: 'Manage service and work details', color: '#1976D2' },
    { icon: 'card-outline', title: 'Bank & Payout Information', desc: 'Configure bank and payment details', color: '#9C27B0' },
    { icon: 'document-text-outline', title: 'Documents & Verification', desc: 'Uploaded documents and status', color: '#F57C00' },
    { icon: 'lock-closed-outline', title: 'Change Password', desc: 'Update account security settings', color: '#D32F2F' },
  ];

  const preferences = [
    { icon: 'time-outline', title: 'Availability', desc: 'Working hours and schedule', value: 'Available' },
    { icon: 'notifications-outline', title: 'Notification Settings', desc: 'Manage how you receive alerts', value: null },
    { icon: 'eye-outline', title: 'Privacy Settings', desc: 'Profile visibility and privacy', value: null },
    { icon: 'language-outline', title: 'Language', desc: 'Choose your preferred language', value: 'English' },
  ];

  const supportOptions = [
    { icon: 'help-circle-outline', title: 'Help Center', desc: 'Guides and support articles' },
    { icon: 'chatbubble-ellipses-outline', title: 'Contact Support', desc: 'Chat with our team' },
    { icon: 'gift-outline', title: 'Invite & Earn', desc: 'Invite others and earn rewards' },
    { icon: 'document-outline', title: 'Terms & Policies', desc: 'Legal documents and policies' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={26} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.headerProfilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
              <View style={styles.onlineDot} />
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
            <View style={styles.profilePhoto}>
              <Ionicons name="person" size={40} color="#FFFFFF" />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>Alex Mukasa</Text>
                <Ionicons name="checkmark-circle" size={18} color="#006B3F" />
              </View>
              <View style={styles.professionRow}>
                <Text style={styles.profession}>Engineer</Text>
                <View style={styles.availableBadge}>
                  <View style={styles.availableDot} />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFB300" />
                <Text style={styles.rating}>4.8</Text>
                <Text style={styles.reviews}>(128 reviews)</Text>
                <Text style={styles.joined}>· Joined Feb 2024</Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text style={styles.location}>Jinja City, Uganda</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editProfileBtn}>
              <Ionicons name="pencil-outline" size={14} color="#006B3F" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Achievement Stats */}
          <View style={styles.achievementsRow}>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="calendar-outline" size={16} color="#006B3F" />
              </View>
              <Text style={styles.achievementValue}>128</Text>
              <Text style={styles.achievementLabel}>Completed Jobs</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="star-outline" size={16} color="#1976D2" />
              </View>
              <Text style={styles.achievementValue}>4.8</Text>
              <Text style={styles.achievementLabel}>Rating</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="people-outline" size={16} color="#9C27B0" />
              </View>
              <Text style={styles.achievementValue}>96</Text>
              <Text style={styles.achievementLabel}>Happy Clients</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="ribbon-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.achievementValue}>1 Year</Text>
              <Text style={styles.achievementLabel}>On Munolink</Text>
            </View>
          </View>
        </View>

        {/* Verified Banner */}
        <View style={styles.verifiedBanner}>
          <View style={styles.verifiedLeft}>
            <View style={styles.verifiedIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.verifiedTitle}>Verified Provider</Text>
              <Text style={styles.verifiedDesc}>You are a verified and trusted service provider.</Text>
              <TouchableOpacity>
                <Text style={styles.learnMore}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#006B3F" />
        </View>

        {/* Account Information */}
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.settingsCard}>
          {accountInfo.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingRow,
                index < accountInfo.length - 1 && styles.settingRowBorder,
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsCard}>
          {preferences.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingRow,
                index < preferences.length - 1 && styles.settingRowBorder,
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name={item.icon} size={20} color="#006B3F" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDesc}>{item.desc}</Text>
              </View>
              {item.value ? (
                <Text style={styles.settingValue}>{item.value}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Support & More */}
        <Text style={styles.sectionTitle}>Support & More</Text>
        <View style={styles.settingsCard}>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingRow,
                index < supportOptions.length && styles.settingRowBorder,
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name={option.icon} size={20} color="#006B3F" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Text style={styles.settingDesc}>{option.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.logoutTitle}>Log Out</Text>
              <Text style={styles.settingDesc}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Service Provider Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderDashboard')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderBookings')}>
          <Ionicons name="calendar-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderServices')}>
          <Ionicons name="briefcase-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderEarnings')}>
          <Ionicons name="wallet-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  headerProfilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  profileTop: { flexDirection: 'row', alignItems: 'flex-start' },
  profilePhoto: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, position: 'relative',
  },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#212121' },
  professionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  profession: { fontSize: 14, color: '#555', fontWeight: '600' },
  availableBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, gap: 4,
  },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 10, fontWeight: '700', color: '#4CAF50' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  rating: { fontSize: 13, fontWeight: '700', color: '#555' },
  reviews: { fontSize: 12, color: '#888' },
  joined: { fontSize: 12, color: '#888' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 12, color: '#888' },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, gap: 4,
  },
  editProfileText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  cardDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },
  achievementsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  achievement: { alignItems: 'center', flex: 1 },
  achievementIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  achievementValue: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 2 },
  achievementLabel: { fontSize: 9, color: '#888', fontWeight: '500', textAlign: 'center' },
  verifiedBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 14, marginBottom: 22,
  },
  verifiedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  verifiedIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  verifiedTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  verifiedDesc: { fontSize: 11, color: '#666', marginTop: 2, marginBottom: 4 },
  learnMore: { fontSize: 11, color: '#006B3F', fontWeight: '700' },
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
    justifyContent: 'center', alignItems: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 1 },
  settingDesc: { fontSize: 11, color: '#888' },
  settingValue: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  logoutRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: '#F5F5F5', marginTop: 4,
  },
  logoutTitle: { fontSize: 14, fontWeight: '700', color: '#D32F2F', marginBottom: 1 },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});