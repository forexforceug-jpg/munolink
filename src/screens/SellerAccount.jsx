import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function SellerAccount({ navigation }) {
  const { user, login, logout } = useAuth();
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, rating: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    const { data: shopData } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (shopData) {
      setShop(shopData);

      const { count: productCount } = await supabase
        .from('shop_products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopData.id);

      const { count: orderCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopData.id);

      const { count: customerCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopData.id);

      setStats({
        products: productCount || 0,
        orders: orderCount || 0,
        customers: customerCount || 0,
        rating: shopData.rating || 0,
        reviews: shopData.review_count || 0,
      });
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadAccount(); }, [loadAccount]);
  const onRefresh = () => { setRefreshing(true); loadAccount(); };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'Connections' }] });
        },
      },
    ]);
  };

  const accountSettings = [
    { icon: 'person-outline', title: 'Personal Information', desc: 'Manage your personal profile details' },
    { icon: 'storefront-outline', title: 'Shop Information', desc: 'Address, hours, and business details' },
    { icon: 'document-text-outline', title: 'Verification & Documents', desc: 'Business licenses and verification' },
    { icon: 'shield-checkmark-outline', title: 'Security', desc: 'Password, PIN, and account protection' },
    { icon: 'notifications-outline', title: 'Notifications', desc: 'Manage alerts and preferences' },
    { icon: 'card-outline', title: 'Payment Methods', desc: 'Bank accounts and payout methods' },
  ];

  const supportOptions = [
    { icon: 'help-circle-outline', title: 'Help Center', desc: 'Find answers and guides' },
    { icon: 'chatbubble-ellipses-outline', title: 'Contact Support', desc: 'Talk to our support team' },
    { icon: 'document-outline', title: 'Terms & Policies', desc: 'Legal documents and policies' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity><Ionicons name="menu-outline" size={26} color="#212121" /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color="#212121" /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ShopOwnerDashboard')}><View style={styles.profilePic}><Ionicons name="person" size={20} color="#FFFFFF" /><View style={styles.onlineDot} /></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}>
        <Text style={styles.pageTitle}>Account</Text>
        <Text style={styles.pageSubtitle}>Manage your profile, shop and account settings.</Text>

        {loading ? <Text style={styles.loadingText}>Loading...</Text> : !shop ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No shop found</Text>
            <Text style={styles.emptySubtitle}>Set up your shop first.</Text>
          </View>
        ) : (
          <>
            <View style={styles.businessCard}>
              <View style={styles.businessTop}>
                <View style={styles.shopPhoto}><Ionicons name="storefront" size={32} color="#006B3F" /><View style={styles.cameraBadge}><Ionicons name="camera" size={10} color="#FFFFFF" /></View></View>
                <View style={styles.businessInfo}>
                  <View style={styles.shopNameRow}><Text style={styles.shopName}>{shop.name}</Text><Ionicons name="checkmark-circle" size={16} color="#006B3F" /></View>
                  <View style={styles.badgesRow}><View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>Shop Owner</Text></View><View style={styles.verifiedBadge}><Ionicons name="shield-checkmark" size={10} color="#006B3F" /><Text style={styles.verifiedBadgeText}>Verified</Text></View></View>
                  <View style={styles.infoRows}>
                    <View style={styles.infoRow}><Ionicons name="location-outline" size={13} color="#888" /><Text style={styles.infoText}>{shop.address || 'Jinja City'}</Text></View>
                    <View style={styles.infoRow}><Ionicons name="call-outline" size={13} color="#888" /><Text style={styles.infoText}>{shop.phone || user?.phoneNumber || '+256 700 123 456'}</Text></View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}><View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}><Ionicons name="cube-outline" size={16} color="#006B3F" /></View><Text style={styles.statValue}>{stats.products}</Text><Text style={styles.statLabel}>Products</Text></View>
                <View style={styles.statItem}><View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}><Ionicons name="bag-handle-outline" size={16} color="#1976D2" /></View><Text style={styles.statValue}>{stats.orders}</Text><Text style={styles.statLabel}>Orders</Text></View>
                <View style={styles.statItem}><View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}><Ionicons name="people-outline" size={16} color="#9C27B0" /></View><Text style={styles.statValue}>{stats.customers}</Text><Text style={styles.statLabel}>Customers</Text></View>
                <View style={styles.statItem}><View style={[styles.statIcon, { backgroundColor: '#FFF8E1' }]}><Ionicons name="star-outline" size={16} color="#F59E0B" /></View><Text style={styles.statValue}>{stats.rating} ⭐</Text><Text style={styles.statLabel}>{stats.reviews} reviews</Text></View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Account Settings</Text>
            <View style={styles.settingsCard}>
              {accountSettings.map((setting, index) => (
                <TouchableOpacity key={index} style={[styles.settingRow, index < accountSettings.length - 1 && styles.settingRowBorder]}>
                  <View style={styles.settingIcon}><Ionicons name={setting.icon} size={20} color="#006B3F" /></View>
                  <View style={styles.settingInfo}><Text style={styles.settingTitle}>{setting.title}</Text><Text style={styles.settingDesc}>{setting.desc}</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Support & More</Text>
            <View style={styles.settingsCard}>
              {supportOptions.map((option, index) => (
                <TouchableOpacity key={index} style={[styles.settingRow, index < supportOptions.length - 1 && styles.settingRowBorder]}>
                  <View style={styles.settingIcon}><Ionicons name={option.icon} size={20} color="#006B3F" /></View>
                  <View style={styles.settingInfo}><Text style={styles.settingTitle}>{option.title}</Text><Text style={styles.settingDesc}>{option.desc}</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
                <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={20} color="#D32F2F" /></View>
                <View style={styles.settingInfo}><Text style={styles.logoutTitle}>Log Out</Text><Text style={styles.settingDesc}>Sign out of your business account</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>
            </View>

            <View style={styles.growBanner}>
              <View style={styles.growLeft}><View style={styles.growIcon}><Ionicons name="shield-checkmark" size={28} color="#006B3F" /></View><View style={styles.growInfo}><Text style={styles.growTitle}>Grow Your Business with Munolink</Text><Text style={styles.growSubtitle}>Access tools and insights to grow your shop.</Text></View></View>
              <TouchableOpacity style={styles.exploreBtn}><Text style={styles.exploreBtnText}>Explore Tools</Text></TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ShopOwnerDashboard')}><Ionicons name="grid-outline" size={22} color="#888" /><Text style={styles.navLabel}>Dashboard</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerProducts')}><Ionicons name="cube-outline" size={22} color="#888" /><Text style={styles.navLabel}>Products</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerOrders')}><Ionicons name="receipt-outline" size={22} color="#888" /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerWallet')}><Ionicons name="wallet-outline" size={22} color="#888" /><Text style={styles.navLabel}>Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => requireAuth(() => navigation.navigate('Messages'))}><Ionicons name="chatbubbles-outline" size={22} color="#888" /><View style={styles.navBadge}><Text style={styles.navBadgeText}>3</Text></View><Text style={[styles.navLabel, styles.navLabelActive]}>Messages</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  profilePic: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888' },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 18 },
  businessCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  businessTop: { flexDirection: 'row', alignItems: 'flex-start' },
  shopPhoto: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  cameraBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  businessInfo: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  shopName: { fontSize: 18, fontWeight: '800', color: '#212121' },
  badgesRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  ownerBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ownerBadgeText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  verifiedBadgeText: { fontSize: 10, fontWeight: '600', color: '#006B3F' },
  infoRows: { gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#888' },
  cardDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
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
  logoutTitle: { fontSize: 14, fontWeight: '700', color: '#D32F2F', marginBottom: 1 },
  growBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 4 },
  growLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  growIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  growInfo: { flex: 1 },
  growTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  growSubtitle: { fontSize: 11, color: '#666' },
  exploreBtn: { borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  exploreBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  navBadge: { position: 'absolute', top: -6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  
});