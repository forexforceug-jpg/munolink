import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LogoImage from '../../assets/logo.png';

const C = {
  primary: '#1F2F5F',
  accent: '#4A7DFF',
  white: '#FFFFFF',
  background: '#F5F6FA',
  border: '#DCE5FF',
  muted: '#8E99B3',
  text: '#1F2F5F',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  lightBg: '#EEF3FF',
  greenBg: '#E8F5E9',
  redBg: '#FFEBEE',
};

export default function Account({ navigation }) {
  const { user, login, logout } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ orders: 0 });

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) {
      setUserData(data);
      login({ ...user, walletBalance: data.wallet_balance, fullName: data.full_name });
      const { count: orderCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setStats({ orders: orderCount || 0 });
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
    { icon: 'bookmark-outline', label: 'Saved', count: 0 },
    { icon: 'calendar-outline', label: 'Bookings', count: 0, route: 'MyOrders' },
    { icon: 'card-outline', label: 'Payments', count: stats.orders, route: 'MyOrders' },
    { icon: 'location-outline', label: 'Addresses', count: 1 },
    { icon: 'star-outline', label: 'Reviews', count: 0 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Account</Text>
        <Text style={styles.pageSubtitle}>Manage your profile and preferences.</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileLeft}>
              <View style={styles.profilePhoto}><Ionicons name="person" size={36} color={C.white} /><View style={styles.editPhotoBadge}><Ionicons name="camera" size={10} color={C.white} /></View></View>
              <View>
                <Text style={styles.userName}>{displayName}</Text>
                <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={12} color={C.accent} /><Text style={styles.verifiedText}>Verified</Text></View>
                <View style={styles.userDetail}><Ionicons name="call-outline" size={11} color={C.muted} /><Text style={styles.userDetailText}>{displayPhone}</Text></View>
                <View style={styles.userDetail}><Ionicons name="location-outline" size={11} color={C.muted} /><Text style={styles.userDetailText}>Jinja City, Uganda</Text></View>
              </View>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Munolink Pay</Text>
              <View style={styles.balanceRow}><Text style={styles.balanceAmount}>{balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}</Text><TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}><Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={16} color={C.muted} /></TouchableOpacity></View>
              <TouchableOpacity style={styles.addMoneyBtn} onPress={() => navigation.navigate('TopUp')}><Ionicons name="add-circle-outline" size={14} color={C.white} /><Text style={styles.addMoneyText}>Add Money</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem} onPress={() => { if (action.route) navigation.navigate(action.route); }}>
              <View style={styles.quickActionIcon}><Ionicons name={action.icon} size={20} color={C.accent} /></View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <Text style={styles.quickActionCount}>{action.count}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.settingsCard}>
          {[
            { icon: 'person-outline', title: 'Personal Information', desc: 'Name, phone, email, photo' },
            { icon: 'shield-checkmark-outline', title: 'Security', desc: 'PIN, biometrics, devices' },
            { icon: 'wallet-outline', title: 'Payment Methods', desc: 'Mobile money, bank accounts' },
            { icon: 'notifications-outline', title: 'Notifications', desc: 'Push, SMS, email alerts' },
            { icon: 'language-outline', title: 'Language', desc: 'English, Luganda, Swahili' },
          ].map((setting, index) => (
            <TouchableOpacity key={index} style={[styles.settingRow, index < 4 && styles.settingRowBorder]}>
              <View style={styles.settingIcon}><Ionicons name={setting.icon} size={20} color={C.accent} /></View>
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
              <View style={styles.settingIcon}><Ionicons name={option.icon} size={20} color={C.accent} /></View>
              <View style={styles.settingInfo}><Text style={styles.settingTitle}>{option.title}</Text><Text style={styles.settingDesc}>{option.desc}</Text></View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={22} color={C.danger} /></View>
            <View style={styles.logoutInfo}><Text style={styles.logoutTitle}>Log Out</Text><Text style={styles.logoutDesc}>Sign out of your Munolink account</Text></View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyWallet')}><Ionicons name="wallet-outline" size={22} color={C.muted} /><Text style={styles.navLabel}>Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyOrders')}><Ionicons name="calendar-outline" size={22} color={C.muted} /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}><Ionicons name="people-outline" size={22} color={C.muted} /><Text style={styles.navLabel}>Connections</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}><Ionicons name="chatbubbles-outline" size={22} color={C.muted} /><View style={styles.navBadge}><Text style={styles.navBadgeText}>3</Text></View><Text style={styles.navLabel}>Messages</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="person" size={22} color={C.accent} /><Text style={[styles.navLabel, styles.navLabelActive]}>Account</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLogo: { width: 120, height: 30, resizeMode: 'contain' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: C.muted, marginBottom: 16 },
  profileCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between' },
  profileLeft: { flexDirection: 'row', flex: 1 },
  profilePhoto: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  editPhotoBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: C.success, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.white },
  userName: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  verifiedText: { fontSize: 11, fontWeight: '600', color: C.accent },
  userDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userDetailText: { fontSize: 11, color: C.muted },
  balanceCard: { backgroundColor: C.background, borderRadius: 14, padding: 12, alignItems: 'center', marginLeft: 10, width: 110 },
  balanceLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginBottom: 8 },
  balanceAmount: { fontSize: 16, fontWeight: '800', color: C.primary },
  addMoneyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accent, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, gap: 4 },
  addMoneyText: { fontSize: 10, fontWeight: '700', color: C.white },
  quickActionsRow: { flexDirection: 'row', marginBottom: 22, gap: 6 },
  quickActionItem: { flex: 1, alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 12, gap: 4, borderWidth: 1, borderColor: C.border },
  quickActionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 9, fontWeight: '600', color: C.text, textAlign: 'center' },
  quickActionCount: { fontSize: 13, fontWeight: '800', color: C.accent },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 10 },
  settingsCard: { backgroundColor: C.white, borderRadius: 16, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: C.border },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, gap: 10 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 1 },
  settingDesc: { fontSize: 11, color: C.muted },
  logoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, gap: 10, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
  logoutIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.redBg, justifyContent: 'center', alignItems: 'center' },
  logoutInfo: { flex: 1 },
  logoutTitle: { fontSize: 14, fontWeight: '700', color: C.danger, marginBottom: 1 },
  logoutDesc: { fontSize: 11, color: C.muted },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: C.white, paddingVertical: 8, paddingBottom: 35, borderTopWidth: 1, borderTopColor: C.border, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  navLabelActive: { color: C.accent, fontWeight: '700' },
  navBadge: { position: 'absolute', top: -6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },
});