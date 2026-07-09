import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image,
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
  purple: '#9C27B0',
  lightBg: '#EEF3FF',
  greenBg: '#E8F5E9',
  orangeBg: '#FFF3E0',
  purpleBg: '#F3E5F5',
};

export default function Notifications({ navigation }) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['All', 'Messages', 'Bookings', 'Orders', 'Payments', 'Promotions'];

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([
        { id: 1, type: 'welcome', icon: 'hand-left-outline', color: C.accent, bg: C.lightBg, title: 'Welcome to Munolink!', subtitle: 'Discover shops, services, and great deals.', time: 'Just now', unread: true, section: 'today' },
        { id: 2, type: 'promotion', icon: 'pricetag-outline', color: C.success, bg: C.greenBg, title: 'Sign up to get started', subtitle: 'Create a free account to access all features.', time: 'Just now', unread: true, section: 'today', action: 'Sign Up', actionRoute: 'AccountType' },
      ]);
      setLoading(false); return;
    }
    const { data: txns } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (txns?.length) {
      const now = new Date();
      setNotifications(txns.map((txn, i) => {
        const d = new Date(txn.created_at); const diff = Math.floor((now - d) / 86400000);
        return { id: txn.id, type: txn.type === 'service_booking' ? 'booking' : 'order', icon: txn.type === 'service_booking' ? 'calendar-outline' : 'cube-outline', color: txn.type === 'service_booking' ? C.accent : C.warning, bg: txn.type === 'service_booking' ? C.lightBg : C.orangeBg, title: txn.type === 'service_booking' ? 'Booking made' : 'Order placed', subtitle: `UGX ${Number(txn.amount||0).toLocaleString()}`, time: diff===0?new Date(txn.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):diff===1?'Yesterday':`${diff}d ago`, unread: i<3, section: diff===0?'today':diff===1?'yesterday':diff<=7?'week':'older' };
      }));
    }
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);
  const onRefresh = () => { setRefreshing(true); loadNotifications(); };

  const filtered = activeCategory==='All' ? notifications : notifications.filter(n => n.type === activeCategory.toLowerCase() || (n.type==='payment'&&activeCategory==='Payments'));
  const sections = { today: filtered.filter(n=>n.section==='today'), yesterday: filtered.filter(n=>n.section==='yesterday'), week: filtered.filter(n=>n.section==='week'), older: filtered.filter(n=>n.section==='older') };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
        <View style={{width:24}}/>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} />}>
        <View style={styles.titleRow}><Text style={styles.pageSubtitle}>Stay updated with everything that matters.</Text><TouchableOpacity style={styles.markAllBtn}><Ionicons name="checkmark-done-outline" size={16} color={C.accent} /><Text style={styles.markAllText}>Mark all read</Text></TouchableOpacity></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map(cat => (<TouchableOpacity key={cat} style={[styles.categoryCard, activeCategory===cat&&styles.categoryCardActive]} onPress={()=>setActiveCategory(cat)}><Text style={[styles.categoryName, activeCategory===cat&&styles.categoryNameActive]}>{cat}</Text></TouchableOpacity>))}
        </ScrollView>

        {loading ? <Text style={styles.loadingText}>Loading...</Text> : filtered.length===0 ? (<View style={styles.emptyState}><Ionicons name="notifications-off-outline" size={48} color="#CCC" /><Text style={styles.emptyTitle}>No notifications</Text></View>) : (<>
          {sections.today.length>0 && <Text style={styles.sectionTitle}>Today</Text>}
          {sections.today.map(n=>(<View key={n.id} style={styles.notifCard}><View style={[styles.notifIcon,{backgroundColor:n.bg}]}><Ionicons name={n.icon} size={20} color={n.color}/></View><View style={styles.notifContent}><View style={styles.notifHeader}><Text style={styles.notifTitle}>{n.title}</Text>{n.unread&&<View style={styles.unreadDot}/>}</View><Text style={styles.notifSubtitle}>{n.subtitle}</Text>{n.action&&<TouchableOpacity style={styles.notifAction} onPress={()=>n.actionRoute&&navigation.navigate(n.actionRoute)}><Text style={[styles.notifActionText,{color:n.color}]}>{n.action}</Text></TouchableOpacity>}</View><View style={styles.notifRight}><Text style={styles.notifTime}>{n.time}</Text></View></View>))}
          {sections.yesterday.length>0 && <Text style={styles.sectionTitle}>Yesterday</Text>}{sections.yesterday.map(n=>(<View key={n.id} style={styles.notifCard}><View style={[styles.notifIcon,{backgroundColor:n.bg}]}><Ionicons name={n.icon} size={20} color={n.color}/></View><View style={styles.notifContent}><View style={styles.notifHeader}><Text style={styles.notifTitle}>{n.title}</Text>{n.unread&&<View style={styles.unreadDot}/>}</View><Text style={styles.notifSubtitle}>{n.subtitle}</Text></View><View style={styles.notifRight}><Text style={styles.notifTime}>{n.time}</Text></View></View>))}
          {sections.week.length>0 && <Text style={styles.sectionTitle}>This Week</Text>}{sections.week.map(n=>(<View key={n.id} style={styles.notifCard}><View style={[styles.notifIcon,{backgroundColor:n.bg}]}><Ionicons name={n.icon} size={20} color={n.color}/></View><View style={styles.notifContent}><Text style={styles.notifTitle}>{n.title}</Text></View><View style={styles.notifRight}><Text style={styles.notifTime}>{n.time}</Text></View></View>))}
        </>)}
        <View style={{height:30}}/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLogo: { width: 110, height: 28, resizeMode: 'contain' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  loadingText: { fontSize: 14, color: C.muted, textAlign: 'center', paddingVertical: 30 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.muted, marginTop: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageSubtitle: { fontSize: 13, color: C.muted },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, color: C.accent, fontWeight: '700' },
  categoriesScroll: { marginBottom: 20 },
  categoryCard: { alignItems: 'center', backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginRight: 8, borderWidth: 1.5, borderColor: C.border, minWidth: 70 },
  categoryCardActive: { borderColor: C.accent, backgroundColor: C.lightBg },
  categoryName: { fontSize: 12, fontWeight: '600', color: C.muted },
  categoryNameActive: { color: C.accent },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.muted, marginBottom: 10, marginTop: 4 },
  notifCard: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  notifIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: C.text, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  notifSubtitle: { fontSize: 12, color: C.muted, lineHeight: 17 },
  notifAction: { marginTop: 4 },
  notifActionText: { fontSize: 12, fontWeight: '700' },
  notifRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  notifTime: { fontSize: 10, color: C.muted },
});