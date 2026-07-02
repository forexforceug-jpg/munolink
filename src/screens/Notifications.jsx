import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Notifications({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    { name: 'All', count: 32 },
    { name: 'Messages', count: 7 },
    { name: 'Bookings', count: 6 },
    { name: 'Orders', count: 8 },
    { name: 'Payments', count: 5 },
    { name: 'Promotions', count: 6 },
  ];

  const todayNotifications = [
    {
      id: 1,
      type: 'message',
      icon: 'chatbubble-outline',
      color: '#006B3F',
      bg: '#E8F5E9',
      title: 'New message from Bright Electricals',
      subtitle: 'Perfect! See you on Friday at 10 AM.',
      time: '2 min ago',
      unread: true,
      hasThumb: true,
    },
    {
      id: 2,
      type: 'booking',
      icon: 'calendar-outline',
      color: '#1976D2',
      bg: '#E3F2FD',
      title: 'Booking confirmed',
      subtitle: 'CoolFix Services · Friday, 10:00 AM',
      time: '15 min ago',
      unread: true,
      hasThumb: false,
    },
    {
      id: 3,
      type: 'order',
      icon: 'cube-outline',
      color: '#F57C00',
      bg: '#FFF3E0',
      title: 'Order is out for delivery',
      subtitle: 'Order #MUNO-0629-001 · Track your order',
      time: '1 hour ago',
      unread: true,
      hasThumb: false,
      action: 'Track',
    },
    {
      id: 4,
      type: 'payment',
      icon: 'card-outline',
      color: '#9C27B0',
      bg: '#F3E5F5',
      title: 'Payment received',
      subtitle: 'UGX 120,000 from Hardware World · Order #MUNO-0628-003',
      time: '2 hours ago',
      unread: false,
      hasThumb: false,
    },
  ];

  const yesterdayNotifications = [
    {
      id: 5,
      type: 'review',
      icon: 'star-outline',
      color: '#FFB300',
      bg: '#FFF8E1',
      title: 'GreenLeaf Farms left a 5-star review',
      subtitle: '⭐⭐⭐⭐⭐ "Great service and fresh products!"',
      time: 'Yesterday, 6:30 PM',
      unread: false,
      hasThumb: false,
    },
    {
      id: 6,
      type: 'promotion',
      icon: 'pricetag-outline',
      color: '#4CAF50',
      bg: '#E8F5E9',
      title: 'Special offer for you!',
      subtitle: 'Get 15% off all plumbing services this weekend.',
      time: 'Yesterday, 3:15 PM',
      unread: false,
      hasThumb: false,
      action: 'View Offer',
    },
    {
      id: 7,
      type: 'verification',
      icon: 'shield-checkmark-outline',
      color: '#00897B',
      bg: '#E0F2F1',
      title: 'Verification update',
      subtitle: 'Your business verification is under review.',
      time: 'Yesterday, 10:00 AM',
      unread: false,
      hasThumb: false,
      action: 'View Status',
    },
  ];

  const weekNotifications = [
    {
      id: 8,
      type: 'deal',
      icon: 'flash-outline',
      color: '#D32F2F',
      bg: '#FFEBEE',
      title: 'Flash Deal Alert!',
      subtitle: 'Don\'t miss amazing deals near you. Limited time offers!',
      time: 'Monday, 2:00 PM',
      unread: false,
      hasThumb: false,
      action: 'Explore Deals',
    },
    {
      id: 9,
      type: 'event',
      icon: 'calendar-outline',
      color: '#6D4C41',
      bg: '#EFEBE9',
      title: 'Event Reminder',
      subtitle: 'Jinja Trade Fair is happening this weekend!',
      time: 'Sunday, 9:00 AM',
      unread: false,
      hasThumb: false,
      action: 'View Event',
    },
  ];

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
          <TouchableOpacity style={styles.notifAction}>
            <Text style={[styles.notifActionText, { color: notification.color }]}>
              {notification.action}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.notifRight}>
        <Text style={styles.notifTime}>{notification.time}</Text>
        {notification.hasThumb && (
          <View style={styles.notifThumb}>
            <Ionicons name="flash-outline" size={16} color="#006B3F" />
          </View>
        )}
      </View>
    </View>
  );

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
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
              <View style={styles.onlineDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSubtitle}>Stay updated with everything that matters.</Text>
          </View>
          <TouchableOpacity style={styles.markAllBtn}>
            <Ionicons name="checkmark-done-outline" size={16} color="#006B3F" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Category Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={[styles.categoryCard, activeCategory === cat.name && styles.categoryCardActive]}
              onPress={() => setActiveCategory(cat.name)}
            >
              <Text style={[styles.categoryName, activeCategory === cat.name && styles.categoryNameActive]}>
                {cat.name}
              </Text>
              <View style={[styles.categoryBadge, activeCategory === cat.name && styles.categoryBadgeActive]}>
                <Text style={[styles.categoryBadgeText, activeCategory === cat.name && styles.categoryBadgeTextActive]}>
                  {cat.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today */}
        <Text style={styles.sectionTitle}>Today</Text>
        {todayNotifications.map(renderNotification)}

        {/* Yesterday */}
        <Text style={styles.sectionTitle}>Yesterday</Text>
        {yesterdayNotifications.map(renderNotification)}

        {/* This Week */}
        <Text style={styles.sectionTitle}>This Week</Text>
        {weekNotifications.map(renderNotification)}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Connections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}>
          <Ionicons name="chatbubbles-outline" size={22} color="#888" />
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>3</Text>
          </View>
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Profile</Text>
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
  profilePic: {
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
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, color: '#006B3F', fontWeight: '700' },
  categoriesScroll: { marginBottom: 20 },
  categoryCard: {
    alignItems: 'center', backgroundColor: '#F8F8F8',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginRight: 8,
    borderWidth: 1.5, borderColor: '#ECECEC', minWidth: 80,
  },
  categoryCardActive: { borderColor: '#006B3F', backgroundColor: '#FAFFFA' },
  categoryName: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 4 },
  categoryNameActive: { color: '#006B3F' },
  categoryBadge: {
    backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  categoryBadgeActive: { backgroundColor: '#006B3F' },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: '#888' },
  categoryBadgeTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#888', marginBottom: 10, marginTop: 4, letterSpacing: 1 },
  notifCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  notifIcon: {
    width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#212121', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006B3F' },
  notifSubtitle: { fontSize: 12, color: '#888', lineHeight: 17, marginBottom: 2 },
  notifAction: { marginTop: 4 },
  notifActionText: { fontSize: 12, fontWeight: '700' },
  notifRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  notifTime: { fontSize: 10, color: '#AAA' },
  notifThumb: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2, position: 'relative' },
  navBadge: {
    position: 'absolute', top: -6, right: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
});