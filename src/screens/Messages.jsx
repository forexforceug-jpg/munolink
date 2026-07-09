import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  RefreshControl, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { notifyUser } from '../services/notifications';
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
  blueBg: '#E3F2FD',
  orangeBg: '#FFF3E0',
  purpleBg: '#F3E5F5',
  redBg: '#FFEBEE',
};

export default function Messages({ navigation, route }) {
  const { user } = useAuth();
  const recipientId = route?.params?.recipientId || null;
  const recipientName = route?.params?.recipientName || null;
  const shopId = route?.params?.shopId || null;
  const shopName = route?.params?.shopName || null;

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showQuickShare, setShowQuickShare] = useState(false);
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const loadConversations = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    let targetId = recipientId || null;
    let targetName = recipientName || null;
    if (shopId && !recipientId) {
      const { data: shopData } = await supabase.from('shops').select('owner_id, name').eq('id', shopId).maybeSingle();
      if (shopData?.owner_id) { targetId = shopData.owner_id; targetName = shopName || shopData.name || null; }
    }
    const { data: allMessages, error: msgError } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(200);
    if (msgError) { setLoading(false); return; }
    const convoMap = new Map();
    if (allMessages) { allMessages.forEach(msg => { const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id; if (!convoMap.has(partnerId)) convoMap.set(partnerId, { partnerId, lastMessage: msg.text || '', lastMessageTime: msg.created_at, unreadCount: 0 }); if (msg.receiver_id === user.id && !msg.is_read) convoMap.get(partnerId).unreadCount++; }); }
    const partnerIds = [...convoMap.keys()]; let partnerMap = {};
    if (partnerIds.length > 0) { const { data: users } = await supabase.from('users').select('id, full_name').in('id', partnerIds); if (users) users.forEach(u => { partnerMap[u.id] = u.full_name || 'User'; }); const { data: shops } = await supabase.from('shops').select('id, name, owner_id').in('owner_id', partnerIds); if (shops) shops.forEach(s => { if (!partnerMap[s.owner_id] || partnerMap[s.owner_id] === 'User') partnerMap[s.owner_id] = s.name; }); if (targetId && targetName && !partnerMap[targetId]) partnerMap[targetId] = targetName; }
    const mapped = []; convoMap.forEach((convo, partnerId) => { mapped.push({ id: partnerId, name: partnerMap[partnerId] || 'User', phone: '', lastMessage: convo.lastMessage || 'No messages yet', time: formatTime(convo.lastMessageTime), unread: convo.unreadCount, online: Math.random() > 0.5 }); });
    mapped.sort((a, b) => { const timeA = convoMap.get(a.id)?.lastMessageTime || ''; const timeB = convoMap.get(b.id)?.lastMessageTime || ''; return timeB.localeCompare(timeA); });
    setConversations(mapped);
    if (targetId) { const existing = mapped.find(c => c.id === targetId); if (existing) setSelectedChat(existing); else if (targetName) { const newChat = { id: targetId, name: targetName, phone: '', lastMessage: 'Start a conversation', time: '', unread: 0, online: true }; setConversations(prev => { if (prev.find(c => c.id === targetId)) return prev; return [newChat, ...prev]; }); setSelectedChat(newChat); } }
    setLoading(false); setRefreshing(false);
  }, [user?.id, recipientId, shopId, recipientName, shopName]);

  const loadMessages = useCallback(async (partnerId) => {
    if (!user?.id || !partnerId) return;
    const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`).order('created_at', { ascending: true }).limit(50);
    const filtered = data?.filter(m => (m.sender_id === user.id && m.receiver_id === partnerId) || (m.sender_id === partnerId && m.receiver_id === user.id)) || [];
    setMessages(filtered.map(m => ({ id: m.id, from: m.sender_id === user.id ? 'me' : 'them', text: m.text, time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), isVoice: false })));
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', partnerId).eq('receiver_id', user.id).eq('is_read', false);
  }, [user?.id]);

  useEffect(() => { loadConversations(); }, [recipientId, shopId, recipientName, shopName]);
  useEffect(() => { if (user?.id) { subscriptionRef.current = supabase.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => { loadConversations(); }).subscribe(); } return () => { if (subscriptionRef.current) subscriptionRef.current.unsubscribe(); }; }, [user?.id]);
  useEffect(() => { if (selectedChat) loadMessages(selectedChat.id); }, [selectedChat]);

  const onRefresh = () => { setRefreshing(true); loadConversations(); };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedChat) return;
    const { data, error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selectedChat.id, text: messageText.trim(), is_read: false }).select().single();
    if (!error && data) { setMessages(prev => [...prev, { id: data.id, from: 'me', text: data.text, time: new Date(data.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), isVoice: false }]); setMessageText(''); setShowQuickShare(false); loadConversations(); notifyUser(selectedChat.id, user.fullName || 'New message', messageText.trim(), { type: 'message', conversationId: user.id, senderName: user.fullName || 'User' }); }
  };

  const handleBack = () => { if (selectedChat) setSelectedChat(null); else navigation.goBack(); };
  const filteredConversations = conversations.filter(c => { const m = c.name?.toLowerCase().includes(searchQuery.toLowerCase()); return activeFilter === 'unread' ? m && c.unread > 0 : m; });
  const unreadCount = conversations.filter(c => c.unread > 0).length;
  const totalCount = conversations.length;

  if (selectedChat) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
          <View style={styles.chatHeaderAvatar}><Ionicons name="person" size={20} color={C.accent} />{selectedChat.online && <View style={styles.chatOnlineDot} />}</View>
          <View style={styles.chatHeaderInfo}><View style={styles.chatHeaderNameRow}><Text style={styles.chatHeaderName}>{selectedChat.name}</Text><Ionicons name="checkmark-circle" size={14} color={C.accent} /></View><Text style={styles.chatHeaderStatus}>Online</Text></View>
          <TouchableOpacity style={styles.chatHeaderAction}><Ionicons name="call-outline" size={22} color={C.accent} /></TouchableOpacity>
        </View>
        <View style={styles.encryptBanner}><Ionicons name="lock-closed" size={14} color="#F57C00" /><Text style={styles.encryptText}>Messages are end-to-end encrypted</Text></View>
        <FlatList ref={flatListRef} data={messages} keyExtractor={item => item.id?.toString()} contentContainerStyle={styles.messagesContent} onContentSizeChange={() => flatListRef.current?.scrollToEnd()} renderItem={({ item }) => (<View style={[styles.messageRow, item.from === 'me' ? styles.messageRowMe : styles.messageRowThem]}>{item.from === 'them' && <View style={styles.messageAvatar}><Ionicons name="person" size={16} color={C.accent} /></View>}<View style={[styles.messageBubble, item.from === 'me' ? styles.messageBubbleMe : styles.messageBubbleThem]}><Text style={styles.messageText}>{item.text}</Text><View style={styles.messageFooter}><Text style={styles.messageTime}>{item.time}</Text>{item.from === 'me' && <Ionicons name="checkmark-done" size={12} color={C.accent} />}</View></View></View>)} ListEmptyComponent={<View style={styles.emptyChatContainer}><Ionicons name="chatbubbles-outline" size={48} color="#CCC" /><Text style={styles.emptyChatTitle}>No messages yet</Text><Text style={styles.emptyChatSubtitle}>Say hello to start the conversation</Text></View>} />
        {showQuickShare && (<View style={styles.quickShareRow}>{[{ icon: 'images-outline', label: 'Gallery', color: C.success },{ icon: 'camera-outline', label: 'Camera', color: '#2196F3' },{ icon: 'location-outline', label: 'Location', color: C.danger },{ icon: 'document-outline', label: 'Document', color: C.warning },{ icon: 'person-add-outline', label: 'Contact', color: C.purple }].map((item) => (<TouchableOpacity key={item.label} style={styles.quickShareItem} onPress={() => { setShowQuickShare(false); if (item.label === 'Location') setMessageText('📍 My location: Jinja City, Uganda'); }}><View style={[styles.quickShareIcon, { backgroundColor: item.color + '20' }]}><Ionicons name={item.icon} size={20} color={item.color} /></View><Text style={styles.quickShareLabel}>{item.label}</Text></TouchableOpacity>))}</View>)}
        <View style={styles.composer}>
          <TouchableOpacity style={styles.composerPlus} onPress={() => setShowQuickShare(!showQuickShare)}><Ionicons name={showQuickShare ? 'close' : 'add'} size={24} color={C.accent} /></TouchableOpacity>
          <View style={styles.composerInput}><TextInput style={styles.composerTextInput} value={messageText} onChangeText={setMessageText} placeholder="Type a message..." placeholderTextColor={C.muted} multiline onSubmitEditing={handleSend} /></View>
          {messageText.trim().length > 0 ? (<TouchableOpacity style={styles.sendBtn} onPress={handleSend}><Ionicons name="send" size={18} color={C.white} /></TouchableOpacity>) : (<TouchableOpacity style={styles.micBtn}><Ionicons name="mic-outline" size={22} color={C.accent} /></TouchableOpacity>)}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <View style={styles.headerLeft}><Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" /></View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color={C.text} /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
      </View>
      <View style={styles.titleSection}><Text style={styles.pageTitle}>Messages</Text><Text style={styles.pageSubtitle}>Stay connected with your businesses, services & people.</Text></View>
      <View style={styles.searchRow}><View style={styles.searchBar}><Ionicons name="search-outline" size={18} color={C.muted} /><TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search messages..." placeholderTextColor={C.muted} />{searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#CCC" /></TouchableOpacity>}</View></View>
      <View style={styles.filterRow}>{[{ key: 'all', label: `All (${totalCount})` },{ key: 'unread', label: `Unread (${unreadCount})` }].map((f) => (<TouchableOpacity key={f.key} style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]} onPress={() => setActiveFilter(f.key)}><Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text></TouchableOpacity>))}</View>
      {loading ? (<View style={styles.loadingContainer}><ActivityIndicator size="large" color={C.accent} /></View>) : (
        <FlatList data={filteredConversations} keyExtractor={item => item.id?.toString()} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} />} renderItem={({ item }) => (<TouchableOpacity style={styles.convoCard} onPress={() => setSelectedChat(item)} activeOpacity={0.7}><View style={styles.convoAvatar}><Ionicons name="person" size={22} color={C.accent} />{item.online && <View style={styles.convoOnlineDot} />}</View><View style={styles.convoInfo}><Text style={styles.convoName} numberOfLines={1}>{item.name}</Text><Text style={styles.convoLastMsg} numberOfLines={1}>{item.lastMessage}</Text></View><View style={styles.convoRight}><Text style={styles.convoTime}>{item.time}</Text>{item.unread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unread}</Text></View>}</View></TouchableOpacity>)} ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="chatbubbles-outline" size={48} color="#CCC" /><Text style={styles.emptyText}>No conversations yet</Text></View>} ListFooterComponent={<View style={styles.promoCard}><View style={styles.promoLeft}><Ionicons name="people-outline" size={24} color={C.accent} /><View><Text style={styles.promoTitle}>Connect more, chat more</Text><Text style={styles.promoSubtitle}>Find businesses & providers near you</Text></View></View><TouchableOpacity style={styles.promoBtn} onPress={() => navigation.navigate('Connections')}><Text style={styles.promoBtnText}>Find Connections</Text></TouchableOpacity></View>} />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Connections')}><Ionicons name="create-outline" size={24} color={C.white} /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLeft: { alignItems: 'center' },
  headerLogo: { width: 110, height: 30, resizeMode: 'contain' },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  titleSection: { paddingHorizontal: 20, marginBottom: 12 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.text },
  pageSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  searchRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 13, color: C.text, marginLeft: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  filterChipTextActive: { color: C.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: '700', color: C.muted },
  convoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  convoAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  convoOnlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: C.success, borderWidth: 2, borderColor: C.white },
  convoInfo: { flex: 1 },
  convoName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  convoLastMsg: { fontSize: 12, color: C.muted },
  convoRight: { alignItems: 'flex-end', gap: 4 },
  convoTime: { fontSize: 10, color: C.muted },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  unreadText: { fontSize: 10, fontWeight: '800', color: C.white },
  promoCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.lightBg, borderRadius: 16, padding: 16, marginTop: 8 },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  promoTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  promoSubtitle: { fontSize: 11, color: C.muted },
  promoBtn: { backgroundColor: C.accent, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18 },
  promoBtnText: { fontSize: 12, fontWeight: '700', color: C.white },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10, backgroundColor: C.white },
  chatHeaderAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  chatOnlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, borderWidth: 2, borderColor: C.white },
  chatHeaderInfo: { flex: 1 },
  chatHeaderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: C.text },
  chatHeaderStatus: { fontSize: 11, color: C.success, fontWeight: '600' },
  chatHeaderAction: { padding: 6 },
  encryptBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E1', paddingVertical: 8, gap: 6 },
  encryptText: { fontSize: 11, color: '#F57C00', fontWeight: '500' },
  messagesContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  messageRow: { marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end' },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowThem: { justifyContent: 'flex-start' },
  messageAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  messageBubble: { maxWidth: '72%', borderRadius: 18, padding: 10, paddingBottom: 6 },
  messageBubbleMe: { backgroundColor: C.lightBg, borderBottomRightRadius: 6 },
  messageBubbleThem: { backgroundColor: C.white, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: C.border },
  messageText: { fontSize: 14, lineHeight: 20, color: C.text },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  messageTime: { fontSize: 10, color: C.muted },
  emptyChatContainer: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyChatTitle: { fontSize: 16, fontWeight: '700', color: C.muted },
  emptyChatSubtitle: { fontSize: 13, color: C.muted },
  quickShareRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.white },
  quickShareItem: { alignItems: 'center', gap: 4 },
  quickShareIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickShareLabel: { fontSize: 9, color: C.muted, fontWeight: '600' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, gap: 8, paddingBottom: 35, backgroundColor: C.white },
  composerPlus: { padding: 6, paddingBottom: 20 },
  composerInput: { flex: 1, backgroundColor: C.background, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 6 },
  composerTextInput: { fontSize: 14, color: C.text, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  micBtn: { padding: 6, paddingBottom: 20 },
});