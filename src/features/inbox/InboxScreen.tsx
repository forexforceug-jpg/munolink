import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const conversations = [
  {
    id: '1',
    type: 'chat',
    title: 'TechWorld Kampala',
    lastMessage: 'Your Samsung S25 is ready for pickup!',
    time: '2 min ago',
    unread: 2,
    avatar: 'TW',
    status: 'Order Ready',
    statusColor: '#2ECC71',
    isVerified: true,
    messages: [
      { id: '1', sender: 'them', text: 'Hello! Your Samsung S25 order is being processed.', time: '10:30 AM' },
      { id: '2', sender: 'me', text: 'Great! When will it be ready?', time: '10:32 AM' },
      { id: '3', sender: 'them', text: 'Your Samsung S25 is ready for pickup!', time: '10:35 AM' },
    ],
  },
  {
    id: '2',
    type: 'chat',
    title: 'QuickFix Mobile',
    lastMessage: 'Your phone repair is complete!',
    time: '1 hour ago',
    unread: 1,
    avatar: 'QF',
    status: 'Completed',
    statusColor: '#4A7DFF',
    isVerified: true,
    messages: [
      { id: '1', sender: 'them', text: 'Your phone repair is scheduled for today at 2:00 PM.', time: 'Yesterday' },
      { id: '2', sender: 'me', text: 'Perfect, I\'ll be there.', time: 'Yesterday' },
      { id: '3', sender: 'them', text: 'Your phone repair is complete!', time: '1 hour ago' },
    ],
  },
  {
    id: '3',
    type: 'ai',
    title: 'Muno AI',
    lastMessage: '💡 The phone in your wishlist has reduced in price by UGX 50,000.',
    time: '3 hours ago',
    unread: 0,
    avatar: 'AI',
    status: 'Price Alert',
    statusColor: '#4A7DFF',
    isVerified: true,
    messages: [
      { id: '1', sender: 'ai', text: '💡 The phone in your wishlist has reduced in price by UGX 50,000.', time: '3 hours ago' },
      { id: '2', sender: 'ai', text: 'Would you like me to check for better alternatives?', time: '3 hours ago' },
    ],
  },
  {
    id: '4',
    type: 'order',
    title: 'Order #MN-2024-001',
    lastMessage: '✅ Your order has been delivered. Rate your experience!',
    time: '5 hours ago',
    unread: 0,
    avatar: '📦',
    status: 'Delivered',
    statusColor: '#2ECC71',
    isVerified: false,
    messages: [
      { id: '1', sender: 'system', text: '🔄 Your order has been confirmed.', time: '2 days ago' },
      { id: '2', sender: 'system', text: '📦 Your order has been shipped.', time: '1 day ago' },
      { id: '3', sender: 'system', text: '✅ Your order has been delivered. Rate your experience!', time: '5 hours ago' },
    ],
  },
  {
    id: '5',
    type: 'booking',
    title: 'Hotel Booking - Jinja Heights',
    lastMessage: '📅 Reminder: Your check-in is tomorrow at 3:00 PM.',
    time: '1 day ago',
    unread: 1,
    avatar: '🏨',
    status: 'Upcoming',
    statusColor: '#F1C40F',
    isVerified: false,
    messages: [
      { id: '1', sender: 'system', text: '✅ Your booking has been confirmed.', time: '3 days ago' },
      { id: '2', sender: 'system', text: '📅 Reminder: Your check-in is tomorrow at 3:00 PM.', time: '1 day ago' },
    ],
  },
  {
    id: '6',
    type: 'payment',
    title: 'Payment - UGX 2,850,000',
    lastMessage: '💳 Payment successful. Receipt attached.',
    time: '2 days ago',
    unread: 0,
    avatar: '💳',
    status: 'Completed',
    statusColor: '#2ECC71',
    isVerified: false,
    messages: [
      { id: '1', sender: 'system', text: '💳 Payment of UGX 2,850,000 initiated.', time: '2 days ago' },
      { id: '2', sender: 'system', text: '💳 Payment successful. Receipt attached.', time: '2 days ago' },
    ],
  },
  {
    id: '7',
    type: 'support',
    title: 'Support - Help Center',
    lastMessage: 'We\'ve received your inquiry and will respond within 24 hours.',
    time: '3 days ago',
    unread: 0,
    avatar: '🎧',
    status: 'Open',
    statusColor: '#4A7DFF',
    isVerified: false,
    messages: [
      { id: '1', sender: 'me', text: 'I need help with my order.', time: '3 days ago' },
      { id: '2', sender: 'them', text: 'We\'ve received your inquiry and will respond within 24 hours.', time: '3 days ago' },
    ],
  },
  {
    id: '8',
    type: 'chat',
    title: 'City Electronics',
    lastMessage: 'We have the iPhone 16 in stock now!',
    time: '4 days ago',
    unread: 0,
    avatar: 'CE',
    status: 'Active',
    statusColor: '#2ECC71',
    isVerified: true,
    messages: [
      { id: '1', sender: 'them', text: 'We have the iPhone 16 in stock now!', time: '4 days ago' },
      { id: '2', sender: 'me', text: 'Great! I\'ll come check it out.', time: '4 days ago' },
    ],
  },
];

// --- Filter Options ---
const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'chats', label: 'Chats' },
  { key: 'orders', label: 'Orders' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'payments', label: 'Payments' },
  { key: 'ai', label: 'AI' },
  { key: 'support', label: 'Support' },
  { key: 'unread', label: 'Unread' },
];

// --- Sub-components ---

// Conversation Card
const ConversationCard = ({ item, onPress, onLongPress }: any) => {
  const statusColors: Record<string, string> = {
    'Order Ready': '#2ECC71',
    'Completed': '#4A7DFF',
    'Price Alert': '#4A7DFF',
    'Delivered': '#2ECC71',
    'Upcoming': '#F1C40F',
    'Open': '#4A7DFF',
    'Active': '#2ECC71',
  };

  const statusColor = statusColors[item.status] || '#8A8AAE';

  return (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.conversationAvatar}>
        {item.type === 'ai' ? (
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            style={styles.aiAvatarGradient}
          >
            <Text style={styles.aiAvatarText}>AI</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.avatarCircle, { backgroundColor: item.type === 'chat' ? 'rgba(74, 125, 255, 0.1)' : '#F5F7FA' }]}>
            <Text style={[styles.avatarText, item.type !== 'chat' && styles.avatarTextSystem]}>
              {item.avatar}
            </Text>
          </View>
        )}
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unread}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <View style={styles.conversationTitleRow}>
            <Text style={styles.conversationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.conversationTime}>{item.time}</Text>
        </View>

        <View style={styles.conversationFooter}>
          <Text style={[styles.conversationMessage, item.unread > 0 && styles.conversationMessageUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Message Bubble
const MessageBubble = ({ message, isMe }: any) => (
  <View style={[styles.messageWrapper, isMe ? styles.messageMeWrapper : styles.messageThemWrapper]}>
    {!isMe && (
      <View style={styles.messageAvatar}>
        <Text style={styles.messageAvatarText}>AI</Text>
      </View>
    )}
    <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageThem]}>
      <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
        {message.text}
      </Text>
      <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeThem]}>
        {message.time}
      </Text>
    </View>
  </View>
);

// AI Quick Reply Suggestions
const AISuggestions = ({ onPress }: any) => {
  const suggestions = [
    'Ask about price',
    'Check availability',
    'Compare products',
    'Ask about warranty',
  ];

  return (
    <View style={styles.aiSuggestions}>
      {suggestions.map((suggestion, i) => (
        <TouchableOpacity key={i} style={styles.aiSuggestionChip} onPress={() => onPress(suggestion)}>
          <Ionicons name="sparkles" size={12} color="#4A7DFF" />
          <Text style={styles.aiSuggestionText}>{suggestion}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- Guest Mode Component ---
const GuestInboxView = ({ navigation }: any) => (
  <View style={styles.guestContainer}>
    <Text style={styles.guestIcon}>💬</Text>
    <Text style={styles.guestTitle}>Keep all conversations in one place</Text>
    <Text style={styles.guestSubtext}>
      After signing in you'll receive:{'\n'}
      • Chats{'\n'}
      • Booking updates{'\n'}
      • Delivery updates{'\n'}
      • AI notifications
    </Text>
    <TouchableOpacity 
      style={styles.guestButton} 
      onPress={() => navigation?.navigate('Join')}
    >
      <Text style={styles.guestButtonText}>Sign In</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation?.navigate('Discover')}>
      <Text style={styles.guestContinueText}>Continue Browsing</Text>
    </TouchableOpacity>
  </View>
);

// --- InboxContent Component (Extracted for reuse) ---
const InboxContent = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState(conversations);

  // If not authenticated, show guest view
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="search-outline" size={22} color="#1F2F5F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="options-outline" size={22} color="#1F2F5F" />
            </TouchableOpacity>
          </View>
        </View>
        <GuestInboxView navigation={navigation} />
      </SafeAreaView>
    );
  }

  // Filter conversations
  const applyFilter = (filterKey: string) => {
    setActiveFilter(filterKey);
    let filtered = [...conversations];

    switch (filterKey) {
      case 'chats':
        filtered = filtered.filter(c => c.type === 'chat');
        break;
      case 'orders':
        filtered = filtered.filter(c => c.type === 'order');
        break;
      case 'bookings':
        filtered = filtered.filter(c => c.type === 'booking');
        break;
      case 'payments':
        filtered = filtered.filter(c => c.type === 'payment');
        break;
      case 'ai':
        filtered = filtered.filter(c => c.type === 'ai');
        break;
      case 'support':
        filtered = filtered.filter(c => c.type === 'support');
        break;
      case 'unread':
        filtered = filtered.filter(c => c.unread > 0);
        break;
      default:
        break;
    }

    setFilteredConversations(filtered);
  };

  // Handle conversation press
  const handleConversationPress = (conversation: any) => {
    setSelectedConversation(conversation);
    setShowChat(true);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      sender: 'me',
      text: newMessage.trim(),
      time: 'Just now',
    };

    setSelectedConversation((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
    setNewMessage('');
  };

  // Handle AI suggestion press
  const handleAISuggestion = (suggestion: string) => {
    const message = {
      id: Date.now().toString(),
      sender: 'me',
      text: suggestion,
      time: 'Just now',
    };

    setSelectedConversation((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'them',
        text: `🤖 Let me help you with "${suggestion}". I'll find the best answer for you.`,
        time: 'Just now',
      };
      setSelectedConversation((prev: any) => ({
        ...prev,
        messages: [...prev.messages, aiResponse],
      }));
    }, 1000);
  };

  // Handle long press
  const handleLongPress = (conversation: any) => {
    Alert.alert(
      conversation.title,
      'Choose an action',
      [
        { text: 'Mark as Read', onPress: () => console.log('Mark as read') },
        { text: 'Mute', onPress: () => console.log('Mute') },
        { text: 'Archive', onPress: () => console.log('Archive') },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Render conversation list
  const renderConversation = ({ item }: any) => (
    <ConversationCard
      item={item}
      onPress={handleConversationPress}
      onLongPress={handleLongPress}
    />
  );

  // --- Chat View ---
  const renderChatView = () => {
    if (!selectedConversation) return null;

    return (
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChat(false)}
      >
        <SafeAreaView style={styles.chatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle}>{selectedConversation.title}</Text>
              <Text style={styles.chatHeaderStatus}>{selectedConversation.status}</Text>
            </View>
            <View style={styles.chatHeaderRight}>
              <TouchableOpacity style={styles.chatHeaderIcon}>
                <Ionicons name="call-outline" size={20} color="#4A7DFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatHeaderIcon}>
                <Ionicons name="ellipsis-vertical" size={20} color="#4A7DFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            data={selectedConversation.messages}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMe={item.sender === 'me'} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            inverted={false}
          />

          {/* AI Suggestions */}
          <AISuggestions onPress={handleAISuggestion} />

          {/* Input */}
          <View style={styles.chatInputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle-outline" size={24} color="#4A7DFF" />
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor="#8A8AAE"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity style={styles.aiChatButton}>
              <Ionicons name="sparkles" size={20} color="#4A7DFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={20} color={newMessage.trim() ? '#FFFFFF' : '#8A8AAE'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => setShowSearch(!showSearch)}>
            <Ionicons name={showSearch ? 'close-outline' : 'search-outline'} size={22} color="#1F2F5F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="options-outline" size={22} color="#1F2F5F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#8A8AAE" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#8A8AAE"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((filter) => {
            const count = filter.key === 'all'
              ? conversations.filter(c => c.unread > 0).length
              : filter.key === 'unread'
                ? conversations.filter(c => c.unread > 0).length
                : 0;

            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  activeFilter === filter.key && styles.filterChipActive,
                ]}
                onPress={() => applyFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === filter.key && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
                {count > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations</Text>
            <Text style={styles.emptySubtext}>Your messages and updates will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.conversationsList}
          />
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Chat Modal */}
      {renderChatView()}
    </SafeAreaView>
  );
};

// --- Main InboxScreen Component (Wrapped with ResponsiveLayout) ---
export const InboxScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Inbox" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true} // ← Full width on desktop
    >
      <InboxContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2F5F',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#1F2F5F',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  // Guest Mode
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FC',
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  guestTitle: {
    color: '#1F2F5F',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  guestButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  guestContinueText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  // Filter Chips
  filterContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginRight: 6,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    borderColor: '#4A7DFF',
  },
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#4A7DFF',
  },
  filterBadge: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
  },
  // Conversation List
  conversationsList: {
    paddingBottom: 8,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#4A7DFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarTextSystem: {
    color: '#1F2F5F',
  },
  aiAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  conversationTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  conversationTime: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationMessage: {
    flex: 1,
    color: '#8A8AAE',
    fontSize: 13,
    marginRight: 8,
  },
  conversationMessageUnread: {
    color: '#1F2F5F',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 20,
  },
  // Chat View
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderTitle: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderStatus: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  chatHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  chatHeaderIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageMeWrapper: {
    justifyContent: 'flex-end',
  },
  messageThemWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A7DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  messageAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageMe: {
    backgroundColor: '#4A7DFF',
    borderBottomRightRadius: 4,
  },
  messageThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextThem: {
    color: '#1F2F5F',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.6)',
  },
  messageTimeThem: {
    color: '#8A8AAE',
  },
  // AI Suggestions
  aiSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
    backgroundColor: '#FFFFFF',
  },
  aiSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.1)',
  },
  aiSuggestionText: {
    color: '#4A7DFF',
    fontSize: 11,
    fontWeight: '500',
  },
  // Chat Input
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
    gap: 8,
  },
  attachButton: {
    padding: 4,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#1F2F5F',
    fontSize: 14,
    maxHeight: 80,
  },
  aiChatButton: {
    padding: 4,
  },
  sendButton: {
    backgroundColor: '#4A7DFF',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E8ECF4',
  },
});