import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Notifications({ navigation }) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { name: 'All', count: 0 },
    { name: 'Messages', count: 0 },
    { name: 'Bookings', count: 0 },
    { name: 'Orders', count: 0 },
    { name: 'Payments', count: 0 },
    { name: 'Promotions', count: 0 },
  ];

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      // Show demo notifications for unauthenticated users
      setNotifications([
        { id: 1, type: 'welcome', icon: 'hand-left-outline', color: '#006B3F', bg: '#E8F5E9', title: 'Welcome to Munolink!', subtitle: 'Discover shops, services, and great deals near you.', time: 'Just now', unread: true, section: 'today' },
        { id: 2, type: 'promotion', icon: 'pricetag-outline', color: '#4CAF50', bg: '#E8F5E9', title: 'Sign up to get started', subtitle: 'Create a free account to access wallet, orders, and messages.', time: 'Just now', unread: true, section: 'today', action: 'Sign Up', actionRoute: 'AccountType' },
      ]);
      setLoading(false);
      return;
    }

    // Get real transactions as notifications
    const { data: txns } = await supabase
      .from('transactions')
      .select('*, shops(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (txns && txns.length > 0) {
      const now = new Date();
      const formatted = txns.map((txn, index) => {
        const txnDate = new Date(txn.created_at);
        const diffDays = Math.floor((now - txnDate) / (1000 * 60 * 60 * 24));
        let section = 'today';
        if (diffDays === 1) section = 'yesterday';
        else if (diffDays > 1 && diffDays <= 7) section = 'week';
        else if (diffDays > 7) section = 'older';

        const timeStr = diffDays === 0
          ? new Date(txn.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : diffDays === 1 ? 'Yesterday'
          : `${diffDays}d ago`;

        return {
          id: txn.id,
          type: txn.type === 'payment' ? 'payment' : 'order',
          icon: txn.type === 'payment' ? 'card-outline' : 'cube-outline',
          color: txn.type === 'payment' ? '#9C27B0' : '#F57C00',
          bg: txn.type === 'payment' ? '#F3E5F5' : '#FFF3E0',
          title: txn.type === 'payment' ? 'Payment made' : 'Order placed',
          subtitle: `${txn.shops?.name || 'Shop'} · UGX ${(txn.amount || 0).toLocaleString()}`,
          time: timeStr,
          unread: index < 3,
          section: section,
        };
      });
      setNotifications(formatted);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);
  const onRefresh = () => { setRefreshing(true); loadNotifications(); };

  const filteredNotifications = activeCategory === 'All'
    ? notifications
    : notifications.filter(n => n.type === activeCategory.toLowerCase() || n.type === 'payment' && activeCategory === 'Payments');

  const sections = {
    today: filteredNotifications.filter(n => n.section === 'today'),
    yesterday: filteredNotifications.filter(n => n.section === 'yesterday'),
    week: filteredNotifications.filter(n => n.section === 'week'),
    older: filteredNotifications.filter(n => n.section === 'older'),
  };

  const renderNotification = (notification) => (
    <View key={notification.id} style={styles.notifCard}>
      <View style={[styles.notifIcon, { backgroundColor: notification.bg }]}>
        <Ionicons name={notification.icon} size={20} color={notification.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifTitle}>{notification.title}</Text>
          {notification.unread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifSubtitle}>{notification.subtitle}</Text>
        {notification.action && (
          <TouchableOpacity
            style={styles.notifAction}
            onPress={() => notification.actionRoute && navigation.navigate(notification.actionRoute)}
          >
            <Text style={[styles.notifActionText, { color: notification.color }]}>{notification.action}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.notifRight}>
        <Text style={styles.notifTime}>{notification.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}>
        <View style={styles.titleRow}>
          <Text style={styles.pageSubtitle}>Stay updated with everything that matters.</Text>
          <TouchableOpacity style={styles.markAllBtn}>
            <Ionicons name="checkmark-done-outline" size={16} color="#006B3F" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.name} style={[styles.categoryCard, activeCategory === cat.name && styles.categoryCardActive]} onPress={() => setActiveCategory(cat.name)}>
              <Text style={[styles.categoryName, activeCategory === cat.name && styles.categoryNameActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <Text style={styles.loadingText}>Loading notifications...</Text> : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
          </View>
        ) : (
          <>
            {sections.today.length > 0 && <Text style={styles.sectionTitle}>Today</Text>}
            {sections.today.map(renderNotification)}
            {sections.yesterday.length > 0 && <Text style={styles.sectionTitle}>Yesterday</Text>}
            {sections.yesterday.map(renderNotification)}
            {sections.week.length > 0 && <Text style={styles.sectionTitle}>This Week</Text>}
            {sections.week.map(renderNotification)}
            {sections.older.length > 0 && <Text style={styles.sectionTitle}>Earlier</Text>}
            {sections.older.map(renderNotification)}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 30 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageSubtitle: { fontSize: 13, color: '#888' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, color: '#006B3F', fontWeight: '700' },
  categoriesScroll: { marginBottom: 20 },
  categoryCard: { alignItems: 'center', backgroundColor: '#F8F8F8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginRight: 8, borderWidth: 1.5, borderColor: '#ECECEC', minWidth: 70 },
  categoryCardActive: { borderColor: '#006B3F', backgroundColor: '#FAFFFA' },
  categoryName: { fontSize: 12, fontWeight: '600', color: '#888' },
  categoryNameActive: { color: '#006B3F' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#888', marginBottom: 10, marginTop: 4, letterSpacing: 1 },
  notifCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  notifIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#212121', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006B3F' },
  notifSubtitle: { fontSize: 12, color: '#888', lineHeight: 17, marginBottom: 2 },
  notifAction: { marginTop: 4 },
  notifActionText: { fontSize: 12, fontWeight: '700' },
  notifRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  notifTime: { fontSize: 10, color: '#AAA' },
});