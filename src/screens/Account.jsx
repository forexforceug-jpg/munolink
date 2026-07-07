import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Account({ navigation }) {
  const { user, login, logout } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ orders: 0, reviews: 0, savedShops: 0, bookings: 0 });
  useEffect(() => { loadUserData(); }, []);
  const loadUserData = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setUserData(data);
      login({ ...user, walletBalance: data.wallet_balance, fullName: data.full_name });

      // Get counts
      const { count: orderCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats(prev => ({ ...prev, orders: orderCount || 0 }));
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); navigation.reset({ index: 0, routes: [{ name: 'Connections' }] }); } },
    ]);
  };

  const displayName = userData?.full_name || user?.fullName || 'User';
  const displayPhone = userData?.phone_number || user?.phoneNumber || '+256 700 123 456';
  const walletBalance = userData?.wallet_balance || user?.walletBalance || 0;

  const quickActions = [
    { icon: 'bookmark-outline', label: 'Saved Shops', count: 0, route: null },
    { icon: 'calendar-outline', label: 'My Bookings', count: 0, route: 'MyOrders' },
    { icon: 'card-outline', label: 'Payments', count: stats.orders, route: 'MyOrders' },
    { icon: 'location-outline', label: 'Addresses', count: 1, route: null },
    { icon: 'star-outline', label: 'My Reviews', count: 0, route: null },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Account</Text>
          <Text style={styles.headerSubtitle}>Manage your profile and preferences.</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileLeft}>
              <View style={styles.profilePhoto}>
                <Ionicons name="person" size={36} color="#FFFFFF" />
                <View style={styles.editPhotoBadge}><Ionicons name="camera" size={10} color="#FFFFFF" /></View>
              </View>
              <View>
                <Text style={styles.userName}>{displayName}</Text>
                <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={12} color="#006B3F" /><Text style={styles.verifiedText}>Verified Account</Text></View>
                <View style={styles.userDetail}><Ionicons name="call-outline" size={11} color="#888" /><Text style={styles.userDetailText}>{displayPhone}</Text></View>
                <View style={styles.userDetail}><Ionicons name="location-outline" size={11} color="#888" /><Text style={styles.userDetailText}>Jinja City, Uganda</Text></View>
              </View>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Munolink Pay</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>{balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}</Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}><Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={16} color="#888" /></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addMoneyBtn} onPress={() => navigation.navigate('TopUp')}><Ionicons name="add-circle-outline" size={14} color="#FFFFFF" /><Text style={styles.addMoneyText}>Add Money</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem} onPress={() => { if (action.route) navigation.navigate(action.route); }}>
              <View style={styles.quickActionIcon}><Ionicons name={action.icon} size={20} color="#006B3F" /></View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <Text style={styles.quickActionCount}>{action.count}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.settingsCard}>
          {[
            { icon: 'person-outline', title: 'Personal Information', desc: 'Name, phone, email, profile photo' },
            { icon: 'shield-checkmark-outline', title: 'Security', desc: 'PIN, biometrics, device management' },
            { icon: 'wallet-outline', title: 'Payment Methods', desc: 'Mobile money, bank accounts' },
            { icon: 'notifications-outline', title: 'Notifications', desc: 'Push, SMS, email alerts' },
            { icon: 'language-outline', title: 'Language', desc: 'English, Luganda, Swahili' },
          ].map((setting, index) => (
            <TouchableOpacity key={index} style={[styles.settingRow, index < 4 && styles.settingRowBorder]}>
              <View style={styles.settingIcon}><Ionicons name={setting.icon} size={20} color="#006B3F" /></View>
              <View style={styles.settingInfo}><Text style={styles.settingTitle}>{setting.title}</Text><Text style={styles.settingDesc}>{setting.desc}</Text></View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.settingsCard}>
          {[
            { icon: 'help-circle-outline', title: 'Help Center', desc: 'FAQ, contact support' },
            { icon: 'gift-outline', title: 'Invite Friends', desc: 'Earn UGX 500 per referral' },
            { icon: 'information-circle-outline', title: 'About Munolink', desc: 'Version 1.0, terms, privacy' },
          ].map((option, index) => (
            <TouchableOpacity key={index} style={[styles.settingRow, index < 2 && styles.settingRowBorder]}>
              <View style={styles.settingIcon}><Ionicons name={option.icon} size={20} color="#006B3F" /></View>
              <View style={styles.settingInfo}><Text style={styles.settingTitle}>{option.title}</Text><Text style={styles.settingDesc}>{option.desc}</Text></View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={22} color="#D32F2F" /></View>
            <View style={styles.logoutInfo}><Text style={styles.logoutTitle}>Log Out</Text><Text style={styles.logoutDesc}>Sign out of your Munolink account</Text></View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyWallet')}><Ionicons name="wallet-outline" size={22} color="#888" /><Text style={styles.navLabel}>Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyOrders')}><Ionicons name="calendar-outline" size={22} color="#888" /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}><Ionicons name="people-outline" size={22} color="#888" /><Text style={styles.navLabel}>Connections</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}><Ionicons name="chatbubbles-outline" size={22} color="#888" /><View style={styles.navBadge}><Text style={styles.navBadgeText}>3</Text></View><Text style={styles.navLabel}>Messages</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="person" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Account</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  headerSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between' },
  profileLeft: { flexDirection: 'row', flex: 1 },
  profilePhoto: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  editPhotoBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  userName: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  verifiedText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  userDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userDetailText: { fontSize: 11, color: '#888' },
  balanceCard: { backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, alignItems: 'center', marginLeft: 10, width: 110 },
  balanceLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginBottom: 8 },
  balanceAmount: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  addMoneyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#006B3F', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, gap: 4 },
  addMoneyText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  quickActionsRow: { flexDirection: 'row', marginBottom: 22, gap: 6 },
  quickActionItem: { flex: 1, alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, gap: 4 },
  quickActionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  quickActionCount: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 10 },
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 4, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, gap: 10 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 1 },
  settingDesc: { fontSize: 11, color: '#888' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, gap: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5', marginTop: 4 },
  logoutIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
  logoutInfo: { flex: 1 },
  logoutTitle: { fontSize: 14, fontWeight: '700', color: '#D32F2F', marginBottom: 1 },
  logoutDesc: { fontSize: 11, color: '#888' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  navBadge: { position: 'absolute', top: -6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
});