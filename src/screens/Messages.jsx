import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Messages({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');

  const tabs = [
    { name: 'All', count: 12 },
    { name: 'Unread', count: 5 },
    { name: 'Groups', count: 2 },
  ];

  const conversations = [
    { id: 1, name: 'Bright Electricals', lastMessage: 'Perfect! See you on Friday at 10 AM.', time: '2:30 PM', unread: 3, online: true, verified: true, category: 'Electrical Services' },
    { id: 2, name: 'CoolFix Services', lastMessage: 'The repair is complete. Please check.', time: '1:15 PM', unread: 0, online: false, verified: true, category: 'Plumbing' },
    { id: 3, name: 'GreenLeaf Farms', lastMessage: 'Fresh vegetables available tomorrow.', time: '11:45 AM', unread: 1, online: true, verified: false, category: 'Groceries' },
    { id: 4, name: 'PharmaCare Pharmacy', lastMessage: 'Your prescription is ready for pickup.', time: 'Yesterday', unread: 0, online: true, verified: true, category: 'Pharmacy' },
    { id: 5, name: 'Cafe Jinja', lastMessage: 'Thank you for your order! 🎉', time: 'Yesterday', unread: 0, online: false, verified: false, category: 'Restaurant' },
    { id: 6, name: 'Muno Delivery', lastMessage: 'Your package is out for delivery.', time: 'Mon', unread: 1, online: true, verified: true, category: 'Delivery' },
    { id: 7, name: 'HomeStyle Furniture', lastMessage: 'New collection arriving next week.', time: 'Sun', unread: 0, online: false, verified: false, category: 'Furniture' },
    { id: 8, name: 'Events in Jinja', lastMessage: 'Booking confirmed for Saturday!', time: 'Sat', unread: 0, online: true, verified: false, category: 'Events' },
  ];

  const chatMessages = [
    { id: 1, from: 'them', text: 'Hello! Thank you for reaching out to Bright Electricals. How can we help you today?', time: '10:00 AM' },
    { id: 2, from: 'me', text: 'Hi! I need electrical installation for my new office in Jinja.', time: '10:02 AM' },
    { id: 3, from: 'them', text: 'Great! We specialize in office electrical installations. How many rooms need wiring?', time: '10:03 AM' },
    { id: 4, from: 'me', text: 'About 4 rooms and a reception area.', time: '10:05 AM' },
    { id: 5, from: 'them', text: 'That sounds like a standard setup. We can have it done in 2-3 days.', time: '10:06 AM' },
    { id: 6, from: 'them', text: 'Would you like us to come for a site inspection first?', time: '10:06 AM' },
    { id: 7, from: 'me', text: 'Yes, that would be great. When are you available?', time: '10:08 AM' },
    { id: 8, from: 'them', text: 'We can come this Friday at 10 AM. Does that work?', time: '10:10 AM' },
    { id: 9, from: 'them', text: '🎤 Voice note (0:32)', time: '10:11 AM', isVoice: true },
    { id: 10, from: 'me', text: 'Perfect! See you on Friday at 10 AM.', time: '10:12 AM' },
    { id: 11, from: 'them', text: 'Confirmed! Our address is Plot 24, Nile Avenue. See you then!', time: '10:13 AM' },
  ];

  if (selectedChat) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.chatAvatar}>
              <Ionicons name="person" size={20} color="#006B3F" />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <View style={styles.chatNameRow}>
                <Text style={styles.chatName}>{selectedChat.name}</Text>
                {selectedChat.verified && (
                  <Ionicons name="checkmark-circle" size={14} color="#006B3F" />
                )}
              </View>
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
          <View style={styles.chatHeaderActions}>
            <TouchableOpacity style={styles.chatActionBtn}>
              <Ionicons name="call-outline" size={22} color="#006B3F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatActionBtn}>
              <Ionicons name="ellipsis-vertical" size={22} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.securityBanner}>
          <Ionicons name="lock-closed" size={12} color="#92400E" />
          <Text style={styles.securityText}>Messages and calls are end-to-end encrypted.</Text>
        </View>

        <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
          <View style={styles.dateDivider}>
            <Text style={styles.dateText}>Today</Text>
          </View>
          {chatMessages.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, msg.from === 'me' ? styles.messageRowMe : styles.messageRowThem]}>
              <View style={[styles.messageBubble, msg.from === 'me' ? styles.messageBubbleMe : styles.messageBubbleThem]}>
                {msg.isVoice ? (
                  <View style={styles.voiceNote}>
                    <TouchableOpacity style={styles.playBtn}>
                      <Ionicons name="play" size={18} color="#006B3F" />
                    </TouchableOpacity>
                    <View style={styles.waveform}>
                      <View style={styles.waveBar} />
                      <View style={[styles.waveBar, { height: 12 }]} />
                      <View style={[styles.waveBar, { height: 18 }]} />
                      <View style={[styles.waveBar, { height: 10 }]} />
                      <View style={[styles.waveBar, { height: 14 }]} />
                      <View style={styles.waveBar} />
                    </View>
                    <Text style={styles.voiceDuration}>0:32</Text>
                  </View>
                ) : (
                  <Text style={[styles.messageText, msg.from === 'me' ? styles.messageTextMe : styles.messageTextThem]}>{msg.text}</Text>
                )}
                <Text style={[styles.messageTime, msg.from === 'me' && styles.messageTimeMe]}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.quickShare}>
          {[
            { icon: 'images-outline', label: 'Gallery' },
            { icon: 'camera-outline', label: 'Camera' },
            { icon: 'location-outline', label: 'Location' },
            { icon: 'document-outline', label: 'Document' },
            { icon: 'person-outline', label: 'Contact' },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.quickShareItem}>
              <Ionicons name={item.icon} size={20} color="#006B3F" />
              <Text style={styles.quickShareLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.composer}>
          <TouchableOpacity style={styles.composerBtn}>
            <Ionicons name="add-circle-outline" size={26} color="#006B3F" />
          </TouchableOpacity>
          <View style={styles.composerInput}>
            <TextInput
              style={styles.composerTextInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor="#CCC"
            />
          </View>
          <TouchableOpacity style={styles.composerBtn}>
            <Ionicons name="happy-outline" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.micBtn}>
            <Ionicons name="mic-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.pageTitle}>Messages</Text>
        <Text style={styles.pageSubtitle}>Stay connected with your businesses, services & people.</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search messages..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={18} color="#006B3F" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, activeTab === tab.name && styles.tabActive]}
              onPress={() => setActiveTab(tab.name)}
            >
              <Text style={[styles.tabText, activeTab === tab.name && styles.tabTextActive]}>
                {tab.name} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {conversations.map((convo) => (
          <TouchableOpacity
            key={convo.id}
            style={styles.convoCard}
            onPress={() => setSelectedChat(convo)}
          >
            <View style={styles.convoAvatar}>
              <Ionicons name="person" size={22} color="#006B3F" />
              {convo.online && <View style={styles.avatarOnlineDot} />}
            </View>
            <View style={styles.convoInfo}>
              <View style={styles.convoNameRow}>
                <Text style={styles.convoName}>{convo.name}</Text>
                {convo.verified && (
                  <Ionicons name="checkmark-circle" size={12} color="#006B3F" />
                )}
              </View>
              <Text style={styles.convoCategory}>{convo.category}</Text>
              <Text style={styles.convoLastMsg} numberOfLines={1}>{convo.lastMessage}</Text>
            </View>
            <View style={styles.convoRight}>
              <Text style={styles.convoTime}>{convo.time}</Text>
              {convo.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{convo.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.promoCard}>
          <View style={styles.promoLeft}>
            <Ionicons name="chatbubbles-outline" size={24} color="#006B3F" />
            <View>
              <Text style={styles.promoTitle}>Connect more, chat more</Text>
              <Text style={styles.promoSubtitle}>Find businesses and services near you.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>Find Connections</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity style={styles.composeFab}>
        <Ionicons name="create-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServicesHome')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyOrders')}>
           <Ionicons name="calendar-outline" size={22} color="#888" />
           <Text style={styles.navLabel}>Orders.</Text>
         </TouchableOpacity>
<TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}>
          <Ionicons name="people-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Connections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubbles" size={22} color="#006B3F" />
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>3</Text>
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Messages</Text>
        </TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Account')}>
           <Ionicons name="person-outline" size={22} color="#888" />
           <Text style={styles.navLabel}>Account</Text>
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
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#ECECEC',
  },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tabActive: { backgroundColor: '#006B3F' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  convoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  convoAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10, position: 'relative',
  },
  avatarOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF',
  },
  convoInfo: { flex: 1 },
  convoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  convoName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  convoCategory: { fontSize: 10, color: '#006B3F', fontWeight: '500', marginBottom: 2 },
  convoLastMsg: { fontSize: 12, color: '#888' },
  convoRight: { alignItems: 'flex-end', gap: 4 },
  convoTime: { fontSize: 10, color: '#AAA' },
  unreadBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  unreadText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  promoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 14, marginTop: 10,
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  promoTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  promoSubtitle: { fontSize: 11, color: '#666' },
  promoBtn: {
    backgroundColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18,
  },
  promoBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  composeFab: {
    position: 'absolute', bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  chatAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  onlineText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  chatHeaderActions: { flexDirection: 'row', gap: 12 },
  chatActionBtn: { padding: 4 },
  securityBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFBEB', paddingVertical: 6, gap: 6,
  },
  securityText: { fontSize: 10, color: '#92400E', fontWeight: '500' },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  dateDivider: { alignItems: 'center', marginVertical: 10 },
  dateText: {
    fontSize: 11, color: '#888', fontWeight: '500',
    backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
  },
  messageRow: { marginBottom: 8, flexDirection: 'row' },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowThem: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  messageBubbleMe: { backgroundColor: '#E8F5E9', borderBottomRightRadius: 4 },
  messageBubbleThem: { backgroundColor: '#F5F5F5', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageTextMe: { color: '#212121' },
  messageTextThem: { color: '#212121' },
  messageTime: { fontSize: 9, color: '#AAA', marginTop: 4, textAlign: 'right' },
  messageTimeMe: { color: '#006B3F' },
  voiceNote: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  playBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  waveform: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, flex: 1 },
  waveBar: { width: 3, height: 8, backgroundColor: '#006B3F', borderRadius: 2 },
  voiceDuration: { fontSize: 10, color: '#888' },
  quickShare: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  quickShareItem: { alignItems: 'center', gap: 2 },
  quickShareLabel: { fontSize: 9, color: '#888', fontWeight: '500' },
  composer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 8,
  },
  composerBtn: { padding: 4 },
  composerInput: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  composerTextInput: { fontSize: 14, color: '#212121' },
  micBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
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
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});