// src/features/inbox/InboxScreen.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

// --- Types ---
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  avatar?: string;
  isVerified?: boolean;
  status?: string;
  statusColor?: string;
  type?: 'chat' | 'ai' | 'order' | 'booking' | 'payment' | 'support';
}

// --- Helper Functions ---
const formatTime = (timestamp: string | null | undefined) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Yesterday';
  if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// --- Sub-components ---
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
          <View style={[styles.avatarCircle, { backgroundColor: item.type === 'chat' ? 'rgba(74, 125, 255, 0.15)' : 'rgba(255,255,255,0.05)' }]}>
            <Text style={[styles.avatarText, item.type !== 'chat' && styles.avatarTextSystem]}>
              {item.avatar || item.name?.charAt(0).toUpperCase() || 'U'}
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
              {item.name || item.title}
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
          {item.status && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          )}
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
        <Text style={styles.messageAvatarText}>U</Text>
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

// --- Desktop Inbox Content ---
const DesktopInboxContent = ({ navigation, route }: any) => {
  const { isAuthenticated, user } = useAuth();
  
  const routeParams = route?.params || {};
  const directUserId = routeParams.userId || null;
  const directUserName = routeParams.userName || null;
  const directShopId = routeParams.shopId || null;
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [hasOpenedDirectChat, setHasOpenedDirectChat] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);
  const isMounted = useRef(true);

  // --- Load Conversations ---
  const loadConversations = useCallback(async () => {
    if (!user?.id || !isMounted.current) {
      setLoading(false);
      return;
    }

    try {
      const { data: allMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (msgError) {
        console.error('Error loading messages:', msgError);
        setLoading(false);
        return;
      }

      if (!allMessages || allMessages.length === 0) {
        setLoading(false);
        setConversations([]);
        setFilteredConversations([]);
        openDirectChatIfNeeded([]);
        return;
      }

      // Group by partner
      const convoMap = new Map();
      allMessages.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convoMap.has(partnerId)) {
          convoMap.set(partnerId, {
            partnerId,
            lastMessage: msg.text || '',
            lastMessageTime: msg.created_at,
            unreadCount: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
          });
        } else {
          const existing = convoMap.get(partnerId);
          if (msg.receiver_id === user.id && !msg.is_read) {
            existing.unreadCount++;
          }
        }
      });

      // Get partner names
      const partnerIds = [...convoMap.keys()];
      let partnerMap: Record<string, string> = {};

      if (partnerIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', partnerIds);
        
        if (users) {
          users.forEach((u: any) => { 
            partnerMap[u.id] = u.full_name || 'User'; 
          });
        }

        // Try to get shop names for partners who are shop owners
        const { data: shops } = await supabase
          .from('shops')
          .select('id, name, owner_id')
          .in('owner_id', partnerIds);
        
        if (shops) {
          shops.forEach((s: any) => {
            if (!partnerMap[s.owner_id] || partnerMap[s.owner_id] === 'User') {
              partnerMap[s.owner_id] = s.name;
            }
          });
        }
      }

      // Build conversation list
      const convos: Conversation[] = [];
      convoMap.forEach((convo: any, partnerId: string) => {
        const name = partnerMap[partnerId] || 'Unknown User';
        convos.push({
          id: partnerId,
          name: name,
          lastMessage: convo.lastMessage || 'No messages yet',
          time: formatTime(convo.lastMessageTime),
          unread: convo.unreadCount,
          online: false,
          avatar: name.charAt(0).toUpperCase(),
          type: 'chat',
          isVerified: false,
        });
      });

      // Sort by last message time
      convos.sort((a, b) => {
        const timeA = convoMap.get(a.id)?.lastMessageTime || '';
        const timeB = convoMap.get(b.id)?.lastMessageTime || '';
        return timeB.localeCompare(timeA);
      });

      if (isMounted.current) {
        setConversations(convos);
        setFilteredConversations(convos);
        setLoading(false);
        openDirectChatIfNeeded(convos);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // --- Open Direct Chat ---
  const openDirectChatIfNeeded = useCallback((currentConversations?: Conversation[]) => {
    if (!directUserId || !user?.id || directUserId === user.id || hasOpenedDirectChat) {
      return;
    }

    console.log(`🔍 Opening direct chat with: ${directUserId} (${directUserName})`);
    
    const convos = currentConversations || conversations;
    const existingConvo = convos.find(c => c.id === directUserId);
    
    if (existingConvo) {
      setSelectedConversation(existingConvo);
      setShowChat(true);
      setHasOpenedDirectChat(true);
      loadMessages(directUserId);
    } else {
      const newConvo: Conversation = {
        id: directUserId,
        name: directUserName || 'User',
        lastMessage: 'Start chatting...',
        time: 'Just now',
        unread: 0,
        online: false,
        avatar: directUserName?.charAt(0).toUpperCase() || 'U',
        type: 'chat',
        isVerified: false,
      };
      
      setConversations(prev => {
        const exists = prev.find(c => c.id === directUserId);
        if (exists) {
          setSelectedConversation(exists);
          setShowChat(true);
          setHasOpenedDirectChat(true);
          return prev;
        }
        setSelectedConversation(newConvo);
        setShowChat(true);
        setHasOpenedDirectChat(true);
        return [newConvo, ...prev];
      });
      
      setFilteredConversations(prev => {
        const exists = prev.find(c => c.id === directUserId);
        if (exists) return prev;
        return [newConvo, ...prev];
      });
    }
  }, [directUserId, directUserName, user?.id, hasOpenedDirectChat, conversations]);

  // --- Load Messages for a Conversation ---
  const loadMessages = useCallback(async (partnerId: string) => {
    if (!user?.id || !partnerId || !isMounted.current) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const filtered = data?.filter((m: any) => 
        (m.sender_id === user.id && m.receiver_id === partnerId) || 
        (m.sender_id === partnerId && m.receiver_id === user.id)
      ) || [];

      if (isMounted.current) {
        setMessages(filtered.map((m: any) => ({
          id: m.id,
          from: m.sender_id === user.id ? 'me' : 'them',
          text: m.text,
          time: formatTime(m.created_at),
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          is_read: m.is_read,
        })));
      }

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // Update unread count in conversation list
      setConversations(prev => 
        prev.map(c => 
          c.id === partnerId ? { ...c, unread: 0 } : c
        )
      );
      setFilteredConversations(prev => 
        prev.map(c => 
          c.id === partnerId ? { ...c, unread: 0 } : c
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user?.id]);

  // --- Send Message ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.id || !user?.id || !isMounted.current) return;

    const receiverId = selectedConversation.id;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          text: newMessage.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }

      if (data && isMounted.current) {
        setMessages(prev => [...prev, {
          id: data.id,
          from: 'me',
          text: data.text,
          time: 'Just now',
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
          is_read: data.is_read,
        }]);

        setNewMessage('');

        const messageText = data.text || 'No messages yet';
        const messageTime = formatTime(data.created_at);
        
        setConversations(prev => {
          const updated = prev.map(c => 
            c.id === receiverId 
              ? { ...c, lastMessage: messageText, time: messageTime }
              : c
          );
          return updated.sort((a, b) => {
            const timeA = a.time === 'Just now' ? Date.now() : 0;
            const timeB = b.time === 'Just now' ? Date.now() : 0;
            return timeB - timeA;
          });
        });

        setFilteredConversations(prev => {
          const updated = prev.map(c => 
            c.id === receiverId 
              ? { ...c, lastMessage: messageText, time: messageTime }
              : c
          );
          return updated.sort((a, b) => {
            const timeA = a.time === 'Just now' ? Date.now() : 0;
            const timeB = b.time === 'Just now' ? Date.now() : 0;
            return timeB - timeA;
          });
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  // --- Setup Real-time Subscription ---
  useEffect(() => {
    if (!user?.id || !isMounted.current) return;

    const channel = supabase.channel('messages-channel');
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        if (isMounted.current) {
          loadConversations();
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`,
      }, () => {
        if (isMounted.current) {
          const chatId = selectedConversation?.id;
          if (chatId && typeof chatId === 'string') {
            loadMessages(chatId);
          }
          loadConversations();
        }
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, selectedConversation, loadConversations, loadMessages]);

  // --- Load data on mount ---
  useEffect(() => {
    isMounted.current = true;
    loadConversations();

    return () => {
      isMounted.current = false;
    };
  }, [loadConversations]);

  // --- Load messages when chat is selected ---
  useEffect(() => {
    if (selectedConversation && selectedConversation.id && isMounted.current) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  // --- Apply filters ---
  useEffect(() => {
    let filtered = [...conversations];

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === 'unread') {
      filtered = filtered.filter(c => c.unread > 0);
    }

    setFilteredConversations(filtered);
  }, [searchQuery, activeFilter, conversations]);

  // --- Handle conversation press ---
  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true);
    if (conversation.id) {
      loadMessages(conversation.id);
    }
  };

  // --- Filter options ---
  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
  ];

  if (!isAuthenticated) {
    return (
      <View style={styles.desktopContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />
        <GuestInboxView navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={styles.desktopContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />
      
      <View style={styles.desktopHeader}>
        <Text style={styles.desktopHeaderTitle}>Inbox</Text>
        <Text style={styles.desktopHeaderSubtitle}>Your conversations and updates</Text>
      </View>

      <View style={styles.desktopGrid}>
        {/* Left Column - Conversation List */}
        <View style={styles.desktopLeftColumn}>
          {/* Search */}
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
                  onPress={() => setActiveFilter(filter.key)}
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
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#4A7DFF" />
              <Text style={{ color: '#8A8AAE', marginTop: 10 }}>Loading conversations...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredConversations}
              renderItem={({ item }) => (
                <ConversationCard
                  item={item}
                  onPress={handleConversationPress}
                  onLongPress={(convo: Conversation) => {
                    Alert.alert(
                      convo.name,
                      'Choose an action',
                      [
                        { text: 'Mark as Read', onPress: () => console.log('Mark as read') },
                        { text: 'Mute', onPress: () => console.log('Mute') },
                        { text: 'Archive', onPress: () => console.log('Archive') },
                        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                />
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.conversationsList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyTitle}>No conversations</Text>
                  <Text style={styles.emptySubtext}>Your messages and updates will appear here</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Right Column - Chat View */}
        <View style={styles.desktopRightColumn}>
          {selectedConversation ? (
            <View style={styles.desktopChatContainer}>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderInfo}>
                  <Text style={styles.chatHeaderTitle}>{selectedConversation.name}</Text>
                  <Text style={styles.chatHeaderStatus}>Online</Text>
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

              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                  <MessageBubble message={item} isMe={item.from === 'me'} />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyChatContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#8A8AAE" />
                    <Text style={styles.emptyChatTitle}>No messages yet</Text>
                    <Text style={styles.emptyChatSubtitle}>Say hello to start the conversation</Text>
                  </View>
                }
              />

              <AISuggestions onPress={(suggestion: string) => {
                setNewMessage(suggestion);
                setTimeout(() => handleSendMessage(), 100);
              }} />

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
            </View>
          ) : (
            <View style={styles.desktopEmptyChat}>
              <Text style={styles.desktopEmptyChatIcon}>💬</Text>
              <Text style={styles.desktopEmptyChatTitle}>Select a conversation</Text>
              <Text style={styles.desktopEmptyChatSubtext}>Choose a conversation from the list to start chatting</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// --- Mobile Inbox Content ---
const MobileInboxContent = ({ navigation, route }: any) => {
  const { isAuthenticated, user } = useAuth();
  
  const routeParams = route?.params || {};
  const directUserId = routeParams.userId || null;
  const directUserName = routeParams.userName || null;
  const directShopId = routeParams.shopId || null;
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [hasOpenedDirectChat, setHasOpenedDirectChat] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);
  const isMounted = useRef(true);

  // --- Load Conversations ---
  const loadConversations = useCallback(async () => {
    if (!user?.id || !isMounted.current) {
      setLoading(false);
      return;
    }

    try {
      const { data: allMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (msgError) {
        console.error('Error loading messages:', msgError);
        setLoading(false);
        return;
      }

      if (!allMessages || allMessages.length === 0) {
        setLoading(false);
        setConversations([]);
        setFilteredConversations([]);
        openDirectChatIfNeeded([]);
        return;
      }

      const convoMap = new Map();
      allMessages.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convoMap.has(partnerId)) {
          convoMap.set(partnerId, {
            partnerId,
            lastMessage: msg.text || '',
            lastMessageTime: msg.created_at,
            unreadCount: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
          });
        } else {
          const existing = convoMap.get(partnerId);
          if (msg.receiver_id === user.id && !msg.is_read) {
            existing.unreadCount++;
          }
        }
      });

      const partnerIds = [...convoMap.keys()];
      let partnerMap: Record<string, string> = {};

      if (partnerIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', partnerIds);
        
        if (users) {
          users.forEach((u: any) => { 
            partnerMap[u.id] = u.full_name || 'User'; 
          });
        }

        const { data: shops } = await supabase
          .from('shops')
          .select('id, name, owner_id')
          .in('owner_id', partnerIds);
        
        if (shops) {
          shops.forEach((s: any) => {
            if (!partnerMap[s.owner_id] || partnerMap[s.owner_id] === 'User') {
              partnerMap[s.owner_id] = s.name;
            }
          });
        }
      }

      const convos: Conversation[] = [];
      convoMap.forEach((convo: any, partnerId: string) => {
        const name = partnerMap[partnerId] || 'Unknown User';
        convos.push({
          id: partnerId,
          name: name,
          lastMessage: convo.lastMessage || 'No messages yet',
          time: formatTime(convo.lastMessageTime),
          unread: convo.unreadCount,
          online: false,
          avatar: name.charAt(0).toUpperCase(),
          type: 'chat',
          isVerified: false,
        });
      });

      convos.sort((a, b) => {
        const timeA = convoMap.get(a.id)?.lastMessageTime || '';
        const timeB = convoMap.get(b.id)?.lastMessageTime || '';
        return timeB.localeCompare(timeA);
      });

      if (isMounted.current) {
        setConversations(convos);
        setFilteredConversations(convos);
        setLoading(false);
        openDirectChatIfNeeded(convos);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // --- Open Direct Chat ---
  const openDirectChatIfNeeded = useCallback((currentConversations?: Conversation[]) => {
    if (!directUserId || !user?.id || directUserId === user.id || hasOpenedDirectChat) {
      return;
    }

    console.log(`🔍 Opening direct chat with: ${directUserId} (${directUserName})`);
    
    const convos = currentConversations || conversations;
    const existingConvo = convos.find(c => c.id === directUserId);
    
    if (existingConvo) {
      setSelectedConversation(existingConvo);
      setShowChat(true);
      setHasOpenedDirectChat(true);
      loadMessages(directUserId);
    } else {
      const newConvo: Conversation = {
        id: directUserId,
        name: directUserName || 'User',
        lastMessage: 'Start chatting...',
        time: 'Just now',
        unread: 0,
        online: false,
        avatar: directUserName?.charAt(0).toUpperCase() || 'U',
        type: 'chat',
        isVerified: false,
      };
      
      setConversations(prev => {
        const exists = prev.find(c => c.id === directUserId);
        if (exists) {
          setSelectedConversation(exists);
          setShowChat(true);
          setHasOpenedDirectChat(true);
          return prev;
        }
        setSelectedConversation(newConvo);
        setShowChat(true);
        setHasOpenedDirectChat(true);
        return [newConvo, ...prev];
      });
      
      setFilteredConversations(prev => {
        const exists = prev.find(c => c.id === directUserId);
        if (exists) return prev;
        return [newConvo, ...prev];
      });
    }
  }, [directUserId, directUserName, user?.id, hasOpenedDirectChat, conversations]);

  // --- Load Messages for a Conversation ---
  const loadMessages = useCallback(async (partnerId: string) => {
    if (!user?.id || !partnerId || !isMounted.current) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const filtered = data?.filter((m: any) => 
        (m.sender_id === user.id && m.receiver_id === partnerId) || 
        (m.sender_id === partnerId && m.receiver_id === user.id)
      ) || [];

      if (isMounted.current) {
        setMessages(filtered.map((m: any) => ({
          id: m.id,
          from: m.sender_id === user.id ? 'me' : 'them',
          text: m.text,
          time: formatTime(m.created_at),
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          is_read: m.is_read,
        })));
      }

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user?.id]);

  // --- Send Message ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.id || !user?.id || !isMounted.current) return;

    const receiverId = selectedConversation.id;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          text: newMessage.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }

      if (data && isMounted.current) {
        setMessages(prev => [...prev, {
          id: data.id,
          from: 'me',
          text: data.text,
          time: 'Just now',
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
          is_read: data.is_read,
        }]);

        setNewMessage('');

        const messageText = data.text || 'No messages yet';
        const messageTime = formatTime(data.created_at);
        
        setConversations(prev => {
          const updated = prev.map(c => 
            c.id === receiverId 
              ? { ...c, lastMessage: messageText, time: messageTime }
              : c
          );
          return updated.sort((a, b) => {
            const timeA = a.time === 'Just now' ? Date.now() : 0;
            const timeB = b.time === 'Just now' ? Date.now() : 0;
            return timeB - timeA;
          });
        });

        setFilteredConversations(prev => {
          const updated = prev.map(c => 
            c.id === receiverId 
              ? { ...c, lastMessage: messageText, time: messageTime }
              : c
          );
          return updated.sort((a, b) => {
            const timeA = a.time === 'Just now' ? Date.now() : 0;
            const timeB = b.time === 'Just now' ? Date.now() : 0;
            return timeB - timeA;
          });
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  // --- Setup Real-time Subscription ---
  useEffect(() => {
    if (!user?.id || !isMounted.current) return;

    const channel = supabase.channel('messages-channel');
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        if (isMounted.current) {
          loadConversations();
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`,
      }, () => {
        if (isMounted.current) {
          const chatId = selectedConversation?.id;
          if (chatId && typeof chatId === 'string') {
            loadMessages(chatId);
          }
          loadConversations();
        }
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, selectedConversation, loadConversations, loadMessages]);

  // --- Load data on mount ---
  useEffect(() => {
    isMounted.current = true;
    loadConversations();

    return () => {
      isMounted.current = false;
    };
  }, [loadConversations]);

  // --- Load messages when chat is selected ---
  useEffect(() => {
    if (selectedConversation && selectedConversation.id && isMounted.current) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  // --- Apply filters ---
  useEffect(() => {
    let filtered = [...conversations];

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === 'unread') {
      filtered = filtered.filter(c => c.unread > 0);
    }

    setFilteredConversations(filtered);
  }, [searchQuery, activeFilter, conversations]);

  // --- Filter options ---
  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
  ];

  if (!isAuthenticated) {
    return <GuestInboxView navigation={navigation} />;
  }

  return (
    <SafeAreaView style={styles.mobileContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />

      {/* Header */}
      <View style={styles.mobileHeader}>
        <Text style={styles.mobileHeaderTitle}>Inbox</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => setShowSearch(!showSearch)}>
            <Ionicons name={showSearch ? 'close-outline' : 'search-outline'} size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
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
                onPress={() => setActiveFilter(filter.key)}
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
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4A7DFF" />
            <Text style={{ color: '#8A8AAE', marginTop: 10 }}>Loading conversations...</Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations</Text>
            <Text style={styles.emptySubtext}>Your messages and updates will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={({ item }) => (
              <ConversationCard
                item={item}
                onPress={(convo: Conversation) => {
                  setSelectedConversation(convo);
                  setShowChat(true);
                  if (convo.id) {
                    loadMessages(convo.id);
                  }
                }}
                onLongPress={(convo: Conversation) => {
                  Alert.alert(
                    convo.name,
                    'Choose an action',
                    [
                      { text: 'Mark as Read', onPress: () => console.log('Mark as read') },
                      { text: 'Mute', onPress: () => console.log('Mute') },
                      { text: 'Archive', onPress: () => console.log('Archive') },
                      { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete') },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              />
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.conversationsList}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowChat(false);
          setSelectedConversation(null);
          setMessages([]);
        }}
      >
        <SafeAreaView style={styles.chatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => {
              setShowChat(false);
              setSelectedConversation(null);
              setMessages([]);
              loadConversations();
            }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle}>{selectedConversation?.name || 'Chat'}</Text>
              <Text style={styles.chatHeaderStatus}>Online</Text>
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

          <View style={styles.encryptBanner}>
            <Ionicons name="lock-closed" size={14} color="#F57C00" />
            <Text style={styles.encryptText}>Messages are end-to-end encrypted</Text>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMe={item.from === 'me'} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#8A8AAE" />
                <Text style={styles.emptyChatTitle}>No messages yet</Text>
                <Text style={styles.emptyChatSubtitle}>Say hello to start the conversation</Text>
              </View>
            }
          />

          <AISuggestions onPress={(suggestion: string) => {
            setNewMessage(suggestion);
            setTimeout(handleSendMessage, 100);
          }} />

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
    </SafeAreaView>
  );
};

// --- Main InboxScreen Component ---
export const InboxScreen = ({ navigation, route }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Inbox" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      {isDesktop ? (
        <DesktopInboxContent navigation={navigation} route={route} />
      ) : (
        <MobileInboxContent navigation={navigation} route={route} />
      )}
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // ============================================================
  // DESKTOP STYLES - DARK THEME
  // ============================================================
  desktopContainer: {
    flex: 1,
    backgroundColor: '#1A2A4F',
    padding: 24,
  },
  desktopHeader: {
    marginBottom: 24,
  },
  desktopHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  desktopHeaderSubtitle: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 4,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  desktopLeftColumn: {
    flex: 1,
    minWidth: 350,
    maxWidth: 450,
  },
  desktopRightColumn: {
    flex: 2,
    minWidth: 400,
  },
  desktopChatContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  desktopEmptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 40,
  },
  desktopEmptyChatIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  desktopEmptyChatTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  desktopEmptyChatSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },

  // ============================================================
  // MOBILE STYLES - DARK THEME
  // ============================================================
  mobileContainer: {
    flex: 1,
    backgroundColor: '#1F2F5F',
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(31, 47, 95, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  mobileHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ============================================================
  // SHARED STYLES - DARK THEME
  // ============================================================
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#FFFFFF',
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
    backgroundColor: '#1F2F5F',
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  guestTitle: {
    color: '#FFFFFF',
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
    maxWidth: 300,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 6,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    backgroundColor: '#1A2A4F',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderTitle: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  encryptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    gap: 6,
  },
  encryptText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '500',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextThem: {
    color: '#FFFFFF',
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
  emptyChatContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A8AAE',
  },
  emptyChatSubtitle: {
    fontSize: 13,
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
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  aiSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
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
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  attachButton: {
    padding: 4,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});