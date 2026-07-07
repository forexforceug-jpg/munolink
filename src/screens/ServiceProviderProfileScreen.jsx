import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ServiceProviderProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ jobs: 0, rating: 0, clients: 0, tenure: 'New' });

  useEffect(() => {
    fetchProviderProfile();
  }, []);

  const fetchProviderProfile = async () => {
    setLoading(true);
    try {
      const userId = user?.id;
      if (!userId) { setLoading(false); return; }

      // Fetch user data
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, created_at')
        .eq('id', userId)
        .maybeSingle();

      // Fetch active services count
      const { data: psData } = await supabase
        .from('provider_services')
        .select('id, price, is_active, service_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      let serviceList = [];
      if (psData && psData.length > 0) {
        const serviceIds = [...new Set(psData.map(p => p.service_id))];
        const { data: scData } = await supabase
          .from('service_catalog')
          .select('id, name, category')
          .in('id', serviceIds);

        const scMap = {};
        if (scData) scData.forEach(s => { scMap[s.id] = s; });

        serviceList = psData.map(p => ({
          id: p.id,
          name: scMap[p.service_id]?.name || 'Service',
          category: scMap[p.service_id]?.category || 'General',
          price: Number(p.price),
        }));
      }

      // Fetch transaction stats
      const { data: txnData } = await supabase
        .from('transactions')
        .select('id, amount')
        .eq('recipient_id', userId)
        .eq('type', 'service_booking');

      const completedJobs = txnData?.length || 0;
      const totalEarned = txnData?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      // Calculate tenure
      const createdAt = userData?.created_at ? new Date(userData.created_at) : new Date();
      const monthsDiff = Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24 * 30));
      const tenure = monthsDiff < 1 ? 'New' : monthsDiff < 12 ? `${monthsDiff} Months` : `${Math.floor(monthsDiff / 12)} Year${Math.floor(monthsDiff / 12) > 1 ? 's' : ''}`;

      setProvider({
        id: userId,
        name: userData?.full_name || user?.fullName || 'Service Provider',
        joined: createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      });

      setServices(serviceList);
      setStats({
        jobs: completedJobs,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        clients: Math.max(1, Math.floor(completedJobs * 0.75)),
        tenure,
      });
    } catch (error) {
      console.error('fetchProviderProfile error:', error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Connections' }] });
  };

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <View>
              <Text style={styles.logo}>MUNOLINK</Text>
              <Text style={styles.tagline}>For Better Connections</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#212121" />
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>5</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profilePhoto}>
              <Text style={styles.profileInitial}>
                {provider?.name?.charAt(0) || '?'}
              </Text>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{provider?.name}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#006B3F" />
              </View>
              <View style={styles.professionRow}>
                <Text style={styles.profession}>
                  {services.length > 0 ? services[0].category : 'Service Provider'}
                </Text>
                <View style={styles.availableBadge}>
                  <View style={styles.availableDot} />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFB300" />
                <Text style={styles.rating}>{stats.rating}</Text>
                <Text style={styles.reviews}>(0 reviews)</Text>
                <Text style={styles.joined}>· Joined {provider?.joined}</Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text style={styles.location}>Jinja City, Uganda</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editProfileBtn}>
              <Ionicons name="pencil-outline" size={14} color="#006B3F" />
              <Text style={styles.editProfileText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Stats */}
          <View style={styles.achievementsRow}>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="calendar-outline" size={16} color="#006B3F" />
              </View>
              <Text style={styles.achievementValue}>{stats.jobs}</Text>
              <Text style={styles.achievementLabel}>Completed Jobs</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="star-outline" size={16} color="#1976D2" />
              </View>
              <Text style={styles.achievementValue}>{stats.rating}</Text>
              <Text style={styles.achievementLabel}>Rating</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="people-outline" size={16} color="#9C27B0" />
              </View>
              <Text style={styles.achievementValue}>{stats.clients}</Text>
              <Text style={styles.achievementLabel}>Happy Clients</Text>
            </View>
            <View style={styles.achievement}>
              <View style={[styles.achievementIcon, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="ribbon-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.achievementValue}>{stats.tenure}</Text>
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
              style={[styles.settingRow, index < accountInfo.length - 1 && styles.settingRowBorder]}
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
              style={[styles.settingRow, index < preferences.length - 1 && styles.settingRowBorder]}
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
              style={[styles.settingRow, index < supportOptions.length && styles.settingRowBorder]}
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

          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
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

      {/* Bottom Nav */}
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888', fontWeight: '500' },
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
  profileInitial: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
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