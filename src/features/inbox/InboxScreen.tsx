// src/features/inbox/InboxScreen.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

interface PaymentRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  reason: string | null;
  status: 'pending' | 'accepted' | 'locked' | 'completed' | 'cancelled' | 'disputed';
  is_request: boolean;
  transaction_id: string | null;
  message_id: string | null;
  created_at: string;
  accepted_at: string | null;
  locked_at: string | null;
  completed_at: string | null;
  from_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  to_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
  payment_request_id?: string;
  payment?: PaymentRequest | null;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  avatar?: string;          // single letter fallback
  avatarUrl?: string | null; // real avatar URL from users.avatar_url
  isVerified?: boolean;
  type?: 'chat' | 'ai';
}

// ============================================================
// HELPERS
// ============================================================

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

/**
 * Build a proper avatar source object for <Image>.
 * Falls back to ui-avatars.com if no real avatar_url exists.
 */
const getAvatarSource = (name: string, avatarUrl?: string | null) => {
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return { uri: avatarUrl };
  }
  const safeName = encodeURIComponent(name || 'User');
  return {
    uri: `https://ui-avatars.com/api/?name=${safeName}&background=4A7DFF&color=fff&size=200&bold=true`,
  };
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const ConversationCard = ({ item, onPress, onLongPress }: any) => (
  <TouchableOpacity
    style={styles.conversationCard}
    onPress={() => onPress(item)}
    onLongPress={() => onLongPress(item)}
    activeOpacity={0.7}
  >
    <View style={styles.conversationAvatar}>
      <Image
        source={getAvatarSource(item.name, item.avatarUrl)}
        style={styles.avatarImage}
      />
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unread}</Text>
        </View>
      )}
    </View>

    <View style={styles.conversationContent}>
      <View style={styles.conversationHeader}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.name || 'User'}
        </Text>
        <Text style={styles.conversationTime}>{item.time}</Text>
      </View>

      <View style={styles.conversationFooter}>
        <Text
          style={[styles.conversationMessage, item.unread > 0 && styles.conversationMessageUnread]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ============================================================
// PAYMENT CARD
// ============================================================
//
// SENDER   = payment.from_user_id (initiator)
//            Sees: Edit + Cancel (pending), View Details (later)
//
// RECEIVER = payment.to_user_id (recipient)
//            Sees: Accept / Pay Now + Reject (pending),
//                  Confirm in Pay (locked), View Details (completed)
// ============================================================

const PaymentCard = ({
  payment,
  currentUserId,
  onAccept,
  onPay,
  onCancel,
  onEdit,
  onReject,
  onView,
}: any) => {
  const isRequest = payment.is_request;
  const isFromMe = payment.from_user_id === currentUserId;
  const isToMe = payment.to_user_id === currentUserId;

  const iAmSender = isFromMe;
  const iAmReceiver = isToMe;

  const getStatusDisplay = () => {
    switch (payment.status) {
      case 'pending':
        return isRequest ? '⏳ Awaiting Payment' : '⏳ Pending';
      case 'accepted':
        return '🔒 Payment Locked';
      case 'locked':
        return '🔒 Awaiting Confirmation';
      case 'completed':
        return '✅ Completed';
      case 'cancelled':
        return '❌ Cancelled';
      case 'disputed':
        return '⚠️ Disputed';
      default:
        return '⏳ Pending';
    }
  };

  const getStatusColor = () => {
    switch (payment.status) {
      case 'pending':
        return '#F1C40F';
      case 'accepted':
        return '#4A7DFF';
      case 'locked':
        return '#4A7DFF';
      case 'completed':
        return '#2ECC71';
      case 'cancelled':
        return '#E74C3C';
      case 'disputed':
        return '#E74C3C';
      default:
        return '#8A8AAE';
    }
  };

  const displayName = iAmSender
    ? payment.to_user?.full_name || 'User'
    : payment.from_user?.full_name || 'User';

  const isPending = payment.status === 'pending';
  const isLocked = payment.status === 'locked';
  const isCompleted = payment.status === 'completed';

  const showSenderEdit = iAmSender && isPending;
  const showSenderCancel = iAmSender && isPending;

  const showReceiverPay = iAmReceiver && isPending && isRequest;
  const showReceiverAccept = iAmReceiver && isPending && !isRequest;
  const showReceiverReject = iAmReceiver && isPending;

  const showConfirmInPay = isLocked && iAmReceiver;
  const showViewDetails = isCompleted || (isLocked && iAmSender);

  return (
    <View style={[styles.paymentCard, { borderLeftColor: getStatusColor() }]}>
      <View style={styles.paymentCardHeader}>
        <Text style={styles.paymentCardIcon}>{isRequest ? '💰' : '💳'}</Text>
        <Text style={styles.paymentCardTitle}>
          {isRequest ? 'Payment Request' : 'Payment Initiated'}
        </Text>
        <View
          style={[styles.paymentCardStatus, { backgroundColor: getStatusColor() + '20' }]}
        >
          <Text style={[styles.paymentCardStatusText, { color: getStatusColor() }]}>
            {getStatusDisplay()}
          </Text>
        </View>
      </View>

      <View style={styles.paymentCardBody}>
        <Text style={styles.paymentCardAmount}>
          UGX {payment.amount.toLocaleString()}
        </Text>
        {payment.reason && (
          <Text style={styles.paymentCardReason}>{payment.reason}</Text>
        )}
        <Text style={styles.paymentCardUser}>
          {iAmSender ? `To: ${displayName}` : `From: ${displayName}`}
        </Text>
        <Text style={styles.paymentCardDate}>{formatTime(payment.created_at)}</Text>
      </View>

      <View style={styles.paymentCardActions}>
        {showSenderEdit && (
          <TouchableOpacity
            style={[styles.paymentCardButton, styles.paymentCardEdit]}
            onPress={() => onEdit(payment)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F39C12', '#E67E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentCardButtonGradient}
            >
              <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
              <Text style={styles.paymentCardButtonText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showSenderCancel && (
          <TouchableOpacity
            style={[styles.paymentCardButton, styles.paymentCardCancel]}
            onPress={() => onCancel(payment)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#E74C3C', '#C0392B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentCardButtonGradient}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.paymentCardButtonText}>Cancel</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showReceiverAccept && (
          <TouchableOpacity
            style={[styles.paymentCardButton, styles.paymentCardAccept]}
            onPress={() => onAccept(payment)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentCardButtonGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.paymentCardButtonText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showReceiverPay && (
          <TouchableOpacity
            style={[styles.paymentCardButton, styles.paymentCardPay]}
            onPress={() => onPay(payment)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentCardButtonGradient}
            >
              <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
              <Text style={styles.paymentCardButtonText}>Pay Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showReceiverReject && (
          <TouchableOpacity
            style={[styles.paymentCardButton, styles.paymentCardReject]}
            onPress={() => onReject(payment)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#E74C3C', '#C0392B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentCardButtonGradient}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.paymentCardButtonText}>Reject</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showConfirmInPay && (
          <TouchableOpacity
            style={[styles.paymentCardButton, styles.paymentCardConfirm]}
            onPress={() => onView(payment)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentCardButtonGradient}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
              <Text style={styles.paymentCardButtonText}>Confirm in Pay</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showViewDetails && !showConfirmInPay && (
          <TouchableOpacity
            style={[styles.paymentCardButton, styles.paymentCardView]}
            onPress={() => onView(payment)}
            activeOpacity={0.7}
          >
            <Text style={styles.paymentCardViewText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#4A7DFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================================
// MESSAGE BUBBLE
// ============================================================

const MessageBubble = ({
  message,
  isMe,
  currentUserId,
  partnerName,
  partnerAvatarUrl,
  myName,
  myAvatarUrl,
  onPaymentAccept,
  onPaymentPay,
  onPaymentCancel,
  onPaymentEdit,
  onPaymentReject,
  onPaymentView,
}: any) => {
  const isPayment = message.payment_request_id;

  if (isPayment && message.payment) {
    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.messageMeWrapper : styles.messageThemWrapper,
        ]}
      >
        <PaymentCard
          payment={message.payment}
          currentUserId={currentUserId}
          onAccept={onPaymentAccept}
          onPay={onPaymentPay}
          onCancel={onPaymentCancel}
          onEdit={onPaymentEdit}
          onReject={onPaymentReject}
          onView={onPaymentView}
        />
      </View>
    );
  }

  const avatarSource = isMe
    ? getAvatarSource(myName, myAvatarUrl)
    : getAvatarSource(partnerName, partnerAvatarUrl);

  return (
    <View
      style={[
        styles.messageWrapper,
        isMe ? styles.messageMeWrapper : styles.messageThemWrapper,
      ]}
    >
      {!isMe && (
        <Image source={avatarSource} style={styles.messageAvatar} />
      )}

      <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageThem]}>
        <Text
          style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}
        >
          {message.text}
        </Text>
        <Text
          style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeThem]}
        >
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
};

// ============================================================
// GUEST MODE
// ============================================================

const GuestInboxView = ({ navigation }: any) => (
  <View style={styles.guestContainer}>
    <Text style={styles.guestIcon}>💬</Text>
    <Text style={styles.guestTitle}>Keep all conversations in one place</Text>
    <Text style={styles.guestSubtext}>
      After signing in you'll receive:{'\n'}
      • Chats{'\n'}
      • Payment updates{'\n'}
      • Notifications
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

// ============================================================
// MAIN INBOX CONTENT
// ============================================================

const InboxContent = ({ navigation, route, isDesktop = false }: any) => {
  const { isAuthenticated, user } = useAuth();

  const routeParams = route?.params || {};
  const directUserId = routeParams.userId || null;
  const directUserName = routeParams.userName || null;

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

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReason, setPaymentReason] = useState('');
  const [paymentIsRequest, setPaymentIsRequest] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRequest | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const selectedConversationIdRef = useRef<string | null>(null);
  selectedConversationIdRef.current = selectedConversation?.id ?? null;
  // ============================================================
  // ✅ Back-navigation / route-param guards
  // ============================================================
  // consumedDirectUserIdRef: remembers which route param we've already
  //   opened a chat for. Persists across back presses so we don't
  //   re-open the same chat after the user closes it.
  //
  // hasOpenedDirectChat: belt-and-braces flag used together with the ref.
  //
  // We deliberately do NOT reset either of these from closeChat().
  // ============================================================
  const consumedDirectUserIdRef = useRef<string | null>(null);
  const [hasOpenedDirectChat, setHasOpenedDirectChat] = useState(false);

  // Cache of user profile info for rendering chat header / bubbles
  const [partnerProfile, setPartnerProfile] = useState<{
    name: string;
    avatarUrl: string | null;
  } | null>(null);
  const [myProfile, setMyProfile] = useState<{
    name: string;
    avatarUrl: string | null;
  } | null>(null);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  const loadMyProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setMyProfile({
          name: (data as any).full_name || user.full_name || 'Me',
          avatarUrl: (data as any).avatar_url || null,
        });
      }
    } catch (err) {
      console.warn('Failed to load my profile:', err);
    }
  }, [user?.id, user?.full_name]);

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

      let convos: Conversation[] = [];

      if (allMessages && allMessages.length > 0) {
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

        let partnerMap: Record<string, { name: string; avatarUrl: string | null }> = {};

        if (partnerIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .in('id', partnerIds);

          if (usersError) {
            console.error('Error fetching partner users:', usersError);
          } else if (users) {
            users.forEach((u: any) => {
              partnerMap[u.id] = {
                name: u.full_name || 'User',
                avatarUrl: u.avatar_url || null,
              };
            });
          }
        }

        convoMap.forEach((convo: any, partnerId: string) => {
          const partnerInfo = partnerMap[partnerId];
          const name = partnerInfo?.name || 'Unknown User';
          const avatarUrl = partnerInfo?.avatarUrl || null;

          convos.push({
            id: partnerId,
            name,
            lastMessage: convo.lastMessage || 'No messages yet',
            time: formatTime(convo.lastMessageTime),
            unread: convo.unreadCount,
            online: false,
            avatar: name.charAt(0).toUpperCase(),
            avatarUrl,
            type: 'chat',
            isVerified: false,
          });
        });
      }

      convos.sort((a, b) => {
        const timeA = a.time === 'Just now' ? Date.now() : 0;
        const timeB = b.time === 'Just now' ? Date.now() : 0;
        return timeB - timeA;
      });

      if (isMounted.current) {
        setConversations(convos);
        setFilteredConversations(convos);
        setLoading(false);
        // ✅ NOTE: We deliberately do NOT call openDirectChatIfNeeded here.
        //    That was the source of the back-navigation loop. Opening the
        //    direct chat is handled by a dedicated effect below.
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  const loadMessages = useCallback(
    async (partnerId: string) => {
      if (!user?.id || !partnerId || !isMounted.current) return;

      try {
        const { data: partnerData } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', partnerId)
          .maybeSingle();

        if (partnerData && isMounted.current) {
          setPartnerProfile({
            name: (partnerData as any).full_name || 'User',
            avatarUrl: (partnerData as any).avatar_url || null,
          });
        }

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
          .order('created_at', { ascending: true })
          .limit(100);

        if (messagesError) {
          console.error('Error loading messages:', messagesError);
          return;
        }

        let filtered =
          messagesData?.filter(
            (m: any) =>
              (m.sender_id === user.id && m.receiver_id === partnerId) ||
              (m.sender_id === partnerId && m.receiver_id === user.id)
          ) || [];

        const messageIds = filtered.map((m: any) => m.id).filter(Boolean);
        let paymentRequests: PaymentRequest[] = [];

        if (messageIds.length > 0) {
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('payment_requests')
            .select('*')
            .in('message_id', messageIds);

          if (!paymentsError && paymentsData) {
            const userIds = paymentsData
              .flatMap((p: any) => [p.from_user_id, p.to_user_id])
              .filter(Boolean);
            let userMap: Record<
              string,
              { id: string; full_name: string; avatar_url: string | null }
            > = {};

            if (userIds.length > 0) {
              const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

              if (!usersError && users) {
                users.forEach((u: any) => {
                  userMap[u.id] = {
                    id: u.id,
                    full_name: u.full_name || 'User',
                    avatar_url: u.avatar_url || null,
                  };
                });
              }
            }

            paymentRequests = paymentsData.map((p: any) => {
              const fromId = p.from_user_id;
              const toId = p.to_user_id;

              return {
                ...p,
                created_at: p.created_at || new Date().toISOString(),
                from_user_id: fromId,
                to_user_id: toId,
                from_user: userMap[fromId] || {
                  id: fromId,
                  full_name: 'User',
                  avatar_url: null,
                },
                to_user: userMap[toId] || { id: toId, full_name: 'User', avatar_url: null },
              };
            });
          }
        }

        const mergedMessages = filtered.map((msg: any) => {
          const payment = paymentRequests.find((p) => p.message_id === msg.id);
          return {
            ...msg,
            payment: payment || null,
            payment_request_id: payment?.id || null,
          };
        });

        if (isMounted.current) {
          setMessages(mergedMessages);
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
    },
    [user?.id]
  );

  // ============================================================
  // closeChat
  // ============================================================
  // ✅ We do NOT reset consumedDirectUserIdRef or hasOpenedDirectChat here.
  //    Resetting them is what caused the chat to re-open on back press.
  //
  //    We DO clear the route params so nothing downstream can re-trigger
  //    an automatic open for this particular navigation.
  // ============================================================
  const closeChat = useCallback(() => {
    setShowChat(false);
    setSelectedConversation(null);
    setMessages([]);
    setPartnerProfile(null);

    // Clear the incoming route params for this screen.
    // Wrapped in try/catch because setParams can throw if the screen
    // has already been unmounted (e.g. very fast back-back).
    try {
      navigation?.setParams?.({ userId: undefined, userName: undefined });
    } catch {
      // ignore
    }

    if (isMounted.current) {
      loadConversations();
    }
  }, [loadConversations, navigation]);

  // ============================================================
  // openDirectChatIfNeeded
  // ============================================================
  // ✅ Guarded by consumedDirectUserIdRef so a given route param is only
  //    ever consumed once. If the user closes the chat and comes back
  //    to the inbox, this function will bail out immediately.
  // ============================================================
  const openDirectChatIfNeeded = useCallback(
    (currentConversations?: Conversation[]) => {
      if (!directUserId || !user?.id || directUserId === user.id) return;

      // Already consumed this exact route param → do nothing
      if (consumedDirectUserIdRef.current === directUserId) return;

      // Belt-and-braces: if the flag is already set, bail out
      if (hasOpenedDirectChat) return;

      const convos = currentConversations || conversations;
      const existingConvo = convos.find((c) => c.id === directUserId);

      // Mark as consumed BEFORE any async work so re-entrant calls bail out
      consumedDirectUserIdRef.current = directUserId;
      setHasOpenedDirectChat(true);

      if (existingConvo) {
        setSelectedConversation(existingConvo);
        setShowChat(true);
        loadMessages(directUserId);
        return;
      }

      const newConvo: Conversation = {
        id: directUserId,
        name: directUserName || 'User',
        lastMessage: 'Start chatting...',
        time: 'Just now',
        unread: 0,
        online: false,
        avatar: directUserName?.charAt(0).toUpperCase() || 'U',
        avatarUrl: null, // populated once loadMessages runs
        type: 'chat',
        isVerified: false,
      };

      setConversations((prev) =>
        prev.find((c) => c.id === directUserId) ? prev : [newConvo, ...prev]
      );
      setFilteredConversations((prev) =>
        prev.find((c) => c.id === directUserId) ? prev : [newConvo, ...prev]
      );

      setSelectedConversation(newConvo);
      setShowChat(true);
      loadMessages(directUserId);
    },
    [
      directUserId,
      directUserName,
      user?.id,
      hasOpenedDirectChat,
      conversations,
      loadMessages,
    ]
  );

  // ============================================================
  // PAYMENT FUNCTIONS
  // ============================================================

  const createPayment = useCallback(
    async (amount: number, reason: string, isRequest: boolean, receiverId: string) => {
      if (!user?.id || !receiverId) {
        Alert.alert('Error', 'Invalid user');
        return null;
      }

      try {
        const buyerId = isRequest ? receiverId : user.id;
        const sellerId = isRequest ? user.id : receiverId;

        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_requests')
          .insert({
            buyer_id: buyerId,
            seller_id: sellerId,
            from_user_id: user.id,
            to_user_id: receiverId,
            amount: amount,
            reason: reason || 'Payment',
            status: 'pending',
            is_request: isRequest,
            currency: 'UGX',
          } as any)
          .select('*')
          .single();

        if (paymentError) {
          console.error('Error creating payment:', paymentError);
          Alert.alert('Error', 'Failed to create payment: ' + paymentError.message);
          return null;
        }

        if (!paymentData) {
          Alert.alert('Error', 'Failed to create payment - no data returned');
          return null;
        }

        const paymentText = isRequest
          ? `💰 Payment Request: UGX ${amount.toLocaleString()}${reason ? ` - ${reason}` : ''}`
          : `💰 Payment Initiated: UGX ${amount.toLocaleString()}${reason ? ` - ${reason}` : ''}`;

        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            text: paymentText,
            is_read: false,
          })
          .select()
          .single();

        if (messageError) {
          console.error('Error sending payment message:', messageError);
          Alert.alert('Error', 'Failed to send payment message');
          return null;
        }

        if (paymentData && messageData) {
          await supabase
            .from('payment_requests')
            .update({ message_id: messageData.id })
            .eq('id', paymentData.id);
        }

        if (!isRequest) {
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              buyer_id: user.id,
              seller_id: receiverId,
              amount: amount,
              locked_amount: amount,
              type: 'payment',
              status: 'locked',
              reference: `PAY-${Date.now()}`,
            } as any)
            .select()
            .single();

          if (txError) {
            console.error('Error creating transaction:', txError);
            Alert.alert('Error', 'Failed to lock funds');
            return null;
          }

          await supabase
            .from('payment_requests')
            .update({
              status: 'locked',
              locked_at: new Date().toISOString(),
            })
            .eq('id', paymentData.id);

          const { data: userData } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('id', user.id)
            .single();

          if (userData) {
            await supabase
              .from('users')
              .update({
                wallet_balance: (userData.wallet_balance || 0) - amount,
              })
              .eq('id', user.id);
          }
        }

        const userIds = [paymentData.from_user_id, paymentData.to_user_id].filter(Boolean);
        let userMap: Record<
          string,
          { id: string; full_name: string; avatar_url: string | null }
        > = {};

        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          if (!usersError && users) {
            users.forEach((u: any) => {
              userMap[u.id] = {
                id: u.id,
                full_name: u.full_name || 'User',
                avatar_url: u.avatar_url || null,
              };
            });
          }
        }

        const fromId = paymentData.from_user_id;
        const toId = paymentData.to_user_id;

        return {
          ...paymentData,
          message_id: messageData?.id,
          created_at: paymentData.created_at || new Date().toISOString(),
          from_user_id: fromId,
          to_user_id: toId,
          from_user: userMap[fromId] || { id: fromId, full_name: 'User', avatar_url: null },
          to_user: userMap[toId] || { id: toId, full_name: 'User', avatar_url: null },
        };
      } catch (error) {
        console.error('Error creating payment:', error);
        Alert.alert('Error', 'Failed to create payment');
        return null;
      }
    },
    [user?.id]
  );

  const handleAcceptPayment = useCallback(
    async (payment: PaymentRequest) => {
      if (!user?.id) {
        Alert.alert('Error', 'Please login');
        return;
      }

      try {
        const { data: userData, error: balanceError } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', user.id)
          .single();

        if (balanceError) {
          console.error('Error checking balance:', balanceError);
          Alert.alert('Error', 'Failed to check balance');
          return;
        }

        if ((userData?.wallet_balance || 0) < payment.amount) {
          Alert.alert(
            'Insufficient Balance',
            `You need UGX ${payment.amount.toLocaleString()} but you have UGX ${(
              userData?.wallet_balance || 0
            ).toLocaleString()}`
          );
          return;
        }

        Alert.alert(
          'Accept Payment',
          `You are about to accept a payment of UGX ${payment.amount.toLocaleString()}\n\n` +
            `From: ${payment.from_user?.full_name || 'User'}\n` +
            `Reason: ${payment.reason || 'No reason provided'}\n\n` +
            `This amount will be locked from your wallet until you confirm the transaction.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Accept & Lock',
              onPress: async () => {
                try {
                  const { data: txData, error: txError } = await supabase
                    .from('transactions')
                    .insert({
                      buyer_id: user.id,
                      seller_id: payment.from_user_id,
                      amount: payment.amount,
                      locked_amount: payment.amount,
                      type: 'payment',
                      status: 'locked',
                      reference: `PAY-${Date.now()}`,
                    } as any)
                    .select()
                    .single();

                  if (txError) {
                    console.error('Error creating transaction:', txError);
                    Alert.alert('Error', 'Failed to lock funds');
                    return;
                  }

                  await supabase
                    .from('payment_requests')
                    .update({
                      status: 'locked',
                      locked_at: new Date().toISOString(),
                      accepted_at: new Date().toISOString(),
                      transaction_id: txData.id,
                      buyer_id: user.id,
                      seller_id: payment.from_user_id,
                    } as any)
                    .eq('id', payment.id);

                  const { data: userBalance } = await supabase
                    .from('users')
                    .select('wallet_balance')
                    .eq('id', user.id)
                    .single();

                  if (userBalance) {
                    await supabase
                      .from('users')
                      .update({
                        wallet_balance: (userBalance.wallet_balance || 0) - payment.amount,
                      })
                      .eq('id', user.id);
                  }

                  const { data: msgData } = await supabase
                    .from('messages')
                    .insert({
                      sender_id: user.id,
                      receiver_id: payment.from_user_id,
                      text: `✅ Payment accepted and locked: UGX ${payment.amount.toLocaleString()}${
                        payment.reason ? ` - ${payment.reason}` : ''
                      }`,
                      is_read: false,
                    })
                    .select()
                    .single();

                  if (msgData) {
                    setMessages((prev) => {
                      const newMsg = {
                        ...msgData,
                        payment: null,
                        payment_request_id: null,
                      };
                      return [...prev, newMsg];
                    });
                  }

                  if (selectedConversation?.id) {
                    loadMessages(selectedConversation.id);
                  }

                  Alert.alert(
                    '✅ Payment Locked',
                    `UGX ${payment.amount.toLocaleString()} has been locked from your wallet.\n\n` +
                      `The seller will deliver the product/service, and you can confirm the payment in the Pay Screen.`
                  );
                } catch (error) {
                  console.error('Error processing payment:', error);
                  Alert.alert('Error', 'Failed to process payment');
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to process payment');
      }
    },
    [user?.id, selectedConversation, loadMessages]
  );

  const handlePayNow = useCallback(
    async (payment: PaymentRequest) => {
      if (!user?.id) {
        Alert.alert('Error', 'Please login');
        return;
      }

      try {
        const { data: userData, error: balanceError } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', user.id)
          .single();

        if (balanceError) {
          console.error('Error checking balance:', balanceError);
          Alert.alert('Error', 'Failed to check balance');
          return;
        }

        if ((userData?.wallet_balance || 0) < payment.amount) {
          Alert.alert(
            'Insufficient Balance',
            `You need UGX ${payment.amount.toLocaleString()} but you have UGX ${(
              userData?.wallet_balance || 0
            ).toLocaleString()}`
          );
          return;
        }

        Alert.alert(
          'Pay Request',
          `You are about to pay UGX ${payment.amount.toLocaleString()}\n\n` +
            `To: ${payment.from_user?.full_name || 'User'}\n` +
            `Reason: ${payment.reason || 'No reason provided'}\n\n` +
            `This amount will be locked from your wallet until you confirm the transaction.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay Now',
              onPress: async () => {
                try {
                  const { data: txData, error: txError } = await supabase
                    .from('transactions')
                    .insert({
                      buyer_id: user.id,
                      seller_id: payment.from_user_id,
                      amount: payment.amount,
                      locked_amount: payment.amount,
                      type: 'payment',
                      status: 'locked',
                      reference: `PAY-${Date.now()}`,
                    } as any)
                    .select()
                    .single();

                  if (txError) {
                    console.error('Error creating transaction:', txError);
                    Alert.alert('Error', 'Failed to lock funds');
                    return;
                  }

                  await supabase
                    .from('payment_requests')
                    .update({
                      status: 'locked',
                      locked_at: new Date().toISOString(),
                      accepted_at: new Date().toISOString(),
                      transaction_id: txData.id,
                      buyer_id: user.id,
                      seller_id: payment.from_user_id,
                    } as any)
                    .eq('id', payment.id);

                  const { data: userBalance } = await supabase
                    .from('users')
                    .select('wallet_balance')
                    .eq('id', user.id)
                    .single();

                  if (userBalance) {
                    await supabase
                      .from('users')
                      .update({
                        wallet_balance: (userBalance.wallet_balance || 0) - payment.amount,
                      })
                      .eq('id', user.id);
                  }

                  const { data: msgData } = await supabase
                    .from('messages')
                    .insert({
                      sender_id: user.id,
                      receiver_id: payment.from_user_id,
                      text: `✅ Payment locked: UGX ${payment.amount.toLocaleString()}${
                        payment.reason ? ` - ${payment.reason}` : ''
                      }`,
                      is_read: false,
                    })
                    .select()
                    .single();

                  if (msgData) {
                    setMessages((prev) => {
                      const newMsg = {
                        ...msgData,
                        payment: null,
                        payment_request_id: null,
                      };
                      return [...prev, newMsg];
                    });
                  }

                  if (selectedConversation?.id) {
                    loadMessages(selectedConversation.id);
                  }

                  Alert.alert(
                    '✅ Payment Locked',
                    `UGX ${payment.amount.toLocaleString()} has been locked from your wallet.\n\n` +
                      `The seller will deliver the product/service, and you can confirm the payment in the Pay Screen.`
                  );
                } catch (error) {
                  console.error('Error processing payment:', error);
                  Alert.alert('Error', 'Failed to process payment');
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to process payment');
      }
    },
    [user?.id, selectedConversation, loadMessages]
  );

  const handleCancelPayment = useCallback(
    async (payment: PaymentRequest) => {
      Alert.alert(
        'Cancel Payment',
        `Are you sure you want to cancel this ${payment.is_request ? 'request' : 'payment'}?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                await supabase
                  .from('payment_requests')
                  .update({ status: 'cancelled' })
                  .eq('id', payment.id);

                const { data: msgData } = await supabase
                  .from('messages')
                  .insert({
                    sender_id: user?.id,
                    receiver_id: payment.is_request
                      ? payment.to_user_id
                      : payment.from_user_id,
                    text: `❌ Payment ${payment.is_request ? 'request' : ''} cancelled`,
                    is_read: false,
                  })
                  .select()
                  .single();

                if (msgData) {
                  setMessages((prev) => {
                    const newMsg = {
                      ...msgData,
                      payment: null,
                      payment_request_id: null,
                    };
                    return [...prev, newMsg];
                  });
                }

                if (selectedConversation?.id) {
                  loadMessages(selectedConversation.id);
                }

                Alert.alert('✅ Cancelled', 'Payment has been cancelled.');
              } catch (error) {
                console.error('Error cancelling payment:', error);
                Alert.alert('Error', 'Failed to cancel payment.');
              }
            },
          },
        ]
      );
    },
    [user?.id, selectedConversation, loadMessages]
  );

  const handleRejectPayment = useCallback(
    async (payment: PaymentRequest) => {
      Alert.alert(
        'Reject Payment',
        `Are you sure you want to reject this ${payment.is_request ? 'request' : 'payment'}?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Reject',
            style: 'destructive',
            onPress: async () => {
              try {
                await supabase
                  .from('payment_requests')
                  .update({ status: 'cancelled' })
                  .eq('id', payment.id);

                const { data: msgData } = await supabase
                  .from('messages')
                  .insert({
                    sender_id: user?.id,
                    receiver_id: payment.from_user_id,
                    text: `❌ ${
                      payment.is_request ? 'Payment request' : 'Payment'
                    } rejected`,
                    is_read: false,
                  })
                  .select()
                  .single();

                if (msgData) {
                  setMessages((prev) => {
                    const newMsg = {
                      ...msgData,
                      payment: null,
                      payment_request_id: null,
                    };
                    return [...prev, newMsg];
                  });
                }

                if (selectedConversation?.id) {
                  loadMessages(selectedConversation.id);
                }

                Alert.alert('✅ Rejected', 'Payment has been rejected.');
              } catch (error) {
                console.error('Error rejecting payment:', error);
                Alert.alert('Error', 'Failed to reject payment.');
              }
            },
          },
        ]
      );
    },
    [user?.id, selectedConversation, loadMessages]
  );

  const handleEditPayment = useCallback((payment: PaymentRequest) => {
    setEditingPayment(payment);
    setPaymentAmount(String(payment.amount));
    setPaymentReason(payment.reason || '');
    setPaymentIsRequest(payment.is_request);
    setShowPaymentModal(true);
  }, []);

  const handleViewInPay = useCallback(
    (payment: PaymentRequest) => {
      closeChat();
      navigation.navigate('Pay', {
        pendingPaymentId: payment.id,
      });
    },
    [navigation, closeChat]
  );

  // ============================================================
  // OTHER FUNCTIONS
  // ============================================================

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.id || !user?.id || !isMounted.current)
      return;

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
        const newMsg = {
          ...data,
          payment: null,
          payment_request_id: null,
        };
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage('');

        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === receiverId
              ? { ...c, lastMessage: data.text || 'No messages yet', time: 'Just now' }
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

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true);
    if (conversation.id) {
      loadMessages(conversation.id);
    }
  };

  // ============================================================
  // PAYMENT MODAL
  // ============================================================

  const handleSendPayment = useCallback(async () => {
    if (!selectedConversation?.id || !user?.id) {
      Alert.alert('Error', 'Please select a conversation');
      return;
    }

    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (editingPayment) {
      try {
        await supabase
          .from('payment_requests')
          .update({
            amount: amountNum,
            reason:
              paymentReason ||
              (editingPayment.is_request ? 'Payment Request' : 'Payment'),
          })
          .eq('id', editingPayment.id);

        if (selectedConversation?.id) {
          loadMessages(selectedConversation.id);
        }

        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentReason('');
        setEditingPayment(null);
        Alert.alert(
          '✅ Updated',
          editingPayment.is_request
            ? 'Payment request has been updated.'
            : 'Payment has been updated.'
        );
        return;
      } catch (error) {
        console.error('Error updating payment:', error);
        Alert.alert('Error', 'Failed to update payment.');
        return;
      }
    }

    const result = await createPayment(
      amountNum,
      paymentReason || (paymentIsRequest ? 'Payment Request' : 'Payment'),
      paymentIsRequest,
      selectedConversation.id
    );

    if (result) {
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReason('');
      setEditingPayment(null);

      Alert.alert(
        paymentIsRequest ? '💰 Payment Request Sent' : '💰 Payment Initiated',
        paymentIsRequest
          ? `UGX ${amountNum.toLocaleString()} payment request sent to ${
              selectedConversation.name
            }.`
          : `UGX ${amountNum.toLocaleString()} has been locked from your wallet.`
      );

      if (selectedConversation?.id) {
        loadMessages(selectedConversation.id);
      }
    }
  }, [
    selectedConversation,
    user?.id,
    paymentAmount,
    paymentReason,
    paymentIsRequest,
    editingPayment,
    createPayment,
    loadMessages,
  ]);

  // ============================================================
  // REAL-TIME SUBSCRIPTION
  // ============================================================

  // ============================================================
  // REAL-TIME SUBSCRIPTION
  // ============================================================
  //
  // ✅ Fix: cannot add `postgres_changes` callbacks after `subscribe()`.
  //
  //    - Unique channel name per effect run so Supabase never
  //      hands back a stale subscribed channel.
  //    - selectedConversation read via ref, NOT via deps, so
  //      tapping a chat doesn't re-run this effect.
  //    - subscribe() called last, after all .on() chains.
  //
  useEffect(() => {
    if (!user?.id || !isMounted.current) return;

    const channelName = `messages-channel-${user.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const channel = supabase.channel(channelName);

    // ✅ Build → attach listeners → subscribe, in that order.
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          if (!isMounted.current) return;
          loadConversations();
          const openId = selectedConversationIdRef.current;
          if (openId) loadMessages(openId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          if (!isMounted.current) return;
          loadConversations();
          const openId = selectedConversationIdRef.current;
          if (openId) loadMessages(openId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_requests',
        },
        () => {
          if (!isMounted.current) return;
          loadConversations();
          const openId = selectedConversationIdRef.current;
          if (openId) loadMessages(openId);
        }
      );

    // ✅ subscribe() LAST.
    channel.subscribe();
    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch {
          /* noop */
        }
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, loadConversations, loadMessages]);
  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    isMounted.current = true;
    loadMyProfile();
    loadConversations();

    return () => {
      isMounted.current = false;
    };
  }, [loadConversations, loadMyProfile]);

  useEffect(() => {
    if (selectedConversation && selectedConversation.id && isMounted.current) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  useEffect(() => {
    let filtered = [...conversations];

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === 'unread') {
      filtered = filtered.filter((c) => c.unread > 0);
    }

    setFilteredConversations(filtered);
  }, [searchQuery, activeFilter, conversations]);

  // ============================================================
  // ✅ ROUTE-PARAM CONSUMPTION EFFECTS
  // ============================================================
  // Two effects work together:
  //
  //  1. When the incoming directUserId changes to a NEW user we haven't
  //     consumed yet, reset the "already opened" flag so it can open.
  //
  //  2. Once the conversation list has loaded at least once, consume the
  //     route param exactly once via openDirectChatIfNeeded. That function
  //     is itself guarded by consumedDirectUserIdRef, so back-navigation
  //     (which does not change the route param) will not re-open the chat.
  // ============================================================

  // (1) New target user → allow opening again
  useEffect(() => {
    if (!directUserId) return;
    if (consumedDirectUserIdRef.current === directUserId) return;

    // New target — clear the belt-and-braces flag so the effect below can proceed
    setHasOpenedDirectChat(false);
  }, [directUserId]);

  // (2) Consume the route param exactly once per navigation
  useEffect(() => {
    if (!directUserId || !user?.id) return;
    if (directUserId === user.id) return;
    if (consumedDirectUserIdRef.current === directUserId) return;
    if (loading) return; // wait until the conversation list has loaded

    openDirectChatIfNeeded(conversations);
  }, [
    directUserId,
    user?.id,
    loading,
    conversations,
    openDirectChatIfNeeded,
  ]);

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const renderChatView = () => {
    if (!selectedConversation) return null;

    const headerAvatarSource = getAvatarSource(
      partnerProfile?.name || selectedConversation.name,
      partnerProfile?.avatarUrl ?? selectedConversation.avatarUrl
    );

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={isDesktop ? styles.desktopChatContainer : styles.chatContainerFull}>
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={closeChat}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Image source={headerAvatarSource} style={styles.chatHeaderAvatar} />

            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle}>
                {partnerProfile?.name || selectedConversation.name}
              </Text>
              <Text style={styles.chatHeaderStatus}>Online</Text>
            </View>
            <TouchableOpacity style={styles.chatHeaderIcon}>
              <Ionicons name="ellipsis-vertical" size={20} color="#4A7DFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMe={item.sender_id === user?.id}
                currentUserId={user?.id}
                partnerName={partnerProfile?.name || selectedConversation.name}
                partnerAvatarUrl={
                  partnerProfile?.avatarUrl ?? selectedConversation.avatarUrl ?? null
                }
                myName={myProfile?.name || user?.full_name || 'Me'}
                myAvatarUrl={myProfile?.avatarUrl || null}
                onPaymentAccept={handleAcceptPayment}
                onPaymentPay={handlePayNow}
                onPaymentCancel={handleCancelPayment}
                onPaymentEdit={handleEditPayment}
                onPaymentReject={handleRejectPayment}
                onPaymentView={handleViewInPay}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#8A8AAE" />
                <Text style={styles.emptyChatTitle}>No messages yet</Text>
                <Text style={styles.emptyChatSubtitle}>Say hello to start the conversation</Text>
              </View>
            }
          />

          <View style={styles.chatInputContainer}>
            <View style={styles.chatInputRow}>
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

              <TouchableOpacity
                style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newMessage.trim() ? '#FFFFFF' : '#8A8AAE'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentButtonsRow}>
              <TouchableOpacity
                style={styles.paymentChatButton}
                onPress={() => {
                  setPaymentIsRequest(false);
                  setPaymentAmount('');
                  setPaymentReason('');
                  setEditingPayment(null);
                  setShowPaymentModal(true);
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4A7DFF', '#6B94FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.paymentChatGradient}
                >
                  <Ionicons name="send-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.paymentChatButtonText}>Pay Now</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentChatButton, styles.requestPaymentChatButton]}
                onPress={() => {
                  setPaymentIsRequest(true);
                  setPaymentAmount('');
                  setPaymentReason('');
                  setEditingPayment(null);
                  setShowPaymentModal(true);
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F1C40F', '#F39C12']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.paymentChatGradient}
                >
                  <Ionicons name="cash-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.paymentChatButtonText}>Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentReason('');
        setEditingPayment(null);
      }}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            setShowPaymentModal(false);
            setPaymentAmount('');
            setPaymentReason('');
            setEditingPayment(null);
          }}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingPayment
                ? editingPayment.is_request
                  ? 'Edit Payment Request'
                  : 'Edit Payment'
                : paymentIsRequest
                ? 'Request Payment'
                : 'Pay Now'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowPaymentModal(false);
                setPaymentAmount('');
                setPaymentReason('');
                setEditingPayment(null);
              }}
            >
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalLabel}>Amount (UGX) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount"
              placeholderTextColor="#6A7A9E"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />

            <Text style={styles.modalLabel}>Reason (Optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="What is this for?"
              placeholderTextColor="#6A7A9E"
              multiline
              numberOfLines={3}
              value={paymentReason}
              onChangeText={setPaymentReason}
            />

            <Text style={styles.modalHelperText}>
              {editingPayment
                ? editingPayment.is_request
                  ? `✏️ Editing payment request to ${selectedConversation?.name}`
                  : `✏️ Editing payment to ${selectedConversation?.name}`
                : paymentIsRequest
                ? `💰 You are requesting payment from ${selectedConversation?.name}`
                : `💳 You are sending payment to ${selectedConversation?.name}`}
              {'\n\n'}⚠️ Funds will be locked when the recipient accepts.
            </Text>

            <TouchableOpacity
              style={styles.modalSendButton}
              onPress={handleSendPayment}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  editingPayment
                    ? ['#F39C12', '#E67E22']
                    : paymentIsRequest
                    ? ['#F1C40F', '#F39C12']
                    : ['#4A7DFF', '#6B94FF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSendGradient}
              >
                <Ionicons
                  name={
                    editingPayment
                      ? 'pencil-outline'
                      : paymentIsRequest
                      ? 'cash-outline'
                      : 'send-outline'
                  }
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.modalSendText}>
                  {editingPayment
                    ? editingPayment.is_request
                      ? 'Update Request'
                      : 'Update Payment'
                    : paymentIsRequest
                    ? 'Send Request'
                    : 'Send Payment'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (!isAuthenticated) {
    return <GuestInboxView navigation={navigation} />;
  }

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />

        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Inbox</Text>
          <Text style={styles.desktopHeaderSubtitle}>Your conversations and updates</Text>
        </View>

        <View style={styles.desktopGrid}>
          <View style={styles.desktopLeftColumn}>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
              ].map((filter) => {
                const count = conversations.filter((c) => c.unread > 0).length;

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
                      Alert.alert(convo.name, 'Choose an action', [
                        { text: 'Mark as Read', onPress: () => console.log('Mark as read') },
                        { text: 'Mute', onPress: () => console.log('Mute') },
                        { text: 'Archive', onPress: () => console.log('Archive') },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => console.log('Delete'),
                        },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
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
                    <Text style={styles.emptySubtext}>
                      Your messages and updates will appear here
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          <View style={styles.desktopRightColumn}>
            {selectedConversation ? (
              renderChatView()
            ) : (
              <View style={styles.desktopEmptyChat}>
                <Text style={styles.desktopEmptyChatIcon}>💬</Text>
                <Text style={styles.desktopEmptyChatTitle}>Select a conversation</Text>
                <Text style={styles.desktopEmptyChatSubtext}>
                  Choose a conversation from the list to start chatting
                </Text>
              </View>
            )}
          </View>
        </View>

        {renderPaymentModal()}
      </View>
    );
  }

  // Mobile View
  return (
    <SafeAreaView style={styles.mobileContainer} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />

      <View style={styles.mobileHeader}>
        <Text style={styles.mobileHeaderTitle}>Inbox</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons
              name={showSearch ? 'close-outline' : 'search-outline'}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
          ].map((filter) => {
            const count = conversations.filter((c) => c.unread > 0).length;

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
                onPress={handleConversationPress}
                onLongPress={(convo: Conversation) => {
                  Alert.alert(convo.name, 'Choose an action', [
                    { text: 'Mark as Read', onPress: () => console.log('Mark as read') },
                    { text: 'Mute', onPress: () => console.log('Mute') },
                    { text: 'Archive', onPress: () => console.log('Archive') },
                    { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete') },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
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

      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeChat}
      >
        <SafeAreaView style={styles.chatContainer} edges={['top']}>
          {renderChatView()}
        </SafeAreaView>
      </Modal>

      {renderPaymentModal()}
    </SafeAreaView>
  );
};

// ============================================================
// EXPORT
// ============================================================

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
      <InboxContent navigation={navigation} route={route} isDesktop={isDesktop} />
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // Mobile Container
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

  // Desktop Container
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

  // Shared Styles
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
  bottomSpacer: {
    height: 20,
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
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
  },
  avatarText: {
    color: '#4A7DFF',
    fontSize: 18,
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
  conversationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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

  // Chat View
  chatContainer: {
    flex: 1,
    backgroundColor: '#1A2A4F',
  },
  chatContainerFull: {
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
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 12,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 10,
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
  chatHeaderIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    marginRight: 6,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
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

  // Payment Card
  paymentCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4A7DFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    maxWidth: '85%',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  paymentCardIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  paymentCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  paymentCardStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  paymentCardStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  paymentCardBody: {
    marginBottom: 8,
  },
  paymentCardAmount: {
    color: '#4A7DFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentCardReason: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  paymentCardUser: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  paymentCardDate: {
    color: '#6A7A9E',
    fontSize: 10,
    marginTop: 2,
  },
  paymentCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  paymentCardButton: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    minWidth: '45%',
  },
  paymentCardButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  paymentCardButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  paymentCardAccept: { flex: 1 },
  paymentCardPay: { flex: 1 },
  paymentCardCancel: { flex: 1 },
  paymentCardEdit: { flex: 1 },
  paymentCardReject: { flex: 1 },
  paymentCardConfirm: { flex: 1 },
  paymentCardView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  paymentCardViewText: {
    color: '#4A7DFF',
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },

  // Chat Input
  chatInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  paymentButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    width: '100%',
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
    minHeight: 36,
  },
  paymentChatButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  requestPaymentChatButton: {
    marginLeft: 0,
  },
  paymentChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  paymentChatButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
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

  // Payment Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    paddingTop: 16,
  },
  modalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalHelperText: {
    color: '#8A8AAE',
    fontSize: 12,
    marginBottom: 16,
  },
  modalSendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalSendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});