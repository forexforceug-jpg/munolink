// src/features/feed/components/AIBottomSheet.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Opportunity } from '../../../services/feed.service';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AIBottomSheetProps {
  bottomSheetRef?: React.RefObject<BottomSheetModal | null>;
  opportunity: Opportunity | null;
  contextHint?: string;
  onClose: () => void;
  isDesktopView?: boolean;
  visible?: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

interface Suggestion {
  icon: string;
  text: string;
  query: string;
}

export const AIBottomSheet: React.FC<AIBottomSheetProps> = ({
  bottomSheetRef,
  opportunity,
  contextHint,
  onClose,
  isDesktopView = false,
  visible = false,
}) => {
  const { width, height } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation for typing dots
  const [dotAnimations] = useState(() => 
    [1, 2, 3].map(() => new Animated.Value(0))
  );

  // Animate typing dots
  useEffect(() => {
    if (isLoading) {
      const animations = dotAnimations.map((anim, index) => {
        return Animated.sequence([
          Animated.delay(index * 200),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          ),
        ]);
      });
      
      Animated.parallel(animations).start();
    } else {
      dotAnimations.forEach(anim => anim.setValue(0));
    }
    
    return () => {
      dotAnimations.forEach(anim => anim.stopAnimation());
    };
  }, [isLoading]);

  // Quick suggestion chips - responsive count
  const getSuggestions = (): Suggestion[] => {
    const allSuggestions: Suggestion[] = [
      { icon: '⚖️', text: 'Compare similar', query: 'Compare this with similar products' },
      { icon: '💰', text: 'Good deal?', query: 'Is this a good deal?' },
      { icon: '📋', text: 'Features', query: 'Tell me about the features' },
      { icon: '⭐', text: 'Reviews', query: 'What do customers say?' },
      { icon: '🚚', text: 'Delivery', query: 'Tell me about delivery' },
      { icon: '🛡️', text: 'Warranty', query: 'What warranty is offered?' },
    ];
    
    // Show fewer suggestions on small screens
    if (width < 380) return allSuggestions.slice(0, 3);
    if (width < 500) return allSuggestions.slice(0, 4);
    return allSuggestions;
  };

  const suggestions = getSuggestions();

  // Get AI response based on query
  const generateAIResponse = (query: string, opp: Opportunity): string => {
    const lowerQuery = query.toLowerCase();
    const productName = opp.title || 'this product';
    const price = opp.price || 0;
    const currency = opp.currency || 'UGX';
    const shopName = opp.shopName || 'the seller';
    const rating = opp.rating || 0;
    const reviewCount = opp.reviewCount || 0;
    const area = opp.area || 'nearby';
    const inStock = opp.inStock !== false;
    const category = opp.category || 'product';
    const specs = opp.specifications || {};
    const description = opp.description || '';
    
    // Compare similar
    if (lowerQuery.includes('compare') || lowerQuery.includes('similar')) {
      return `🔍 **Comparing ${productName}**\n\n` +
        `This ${category} is priced at ${currency} ${price.toLocaleString()}.\n\n` +
        `**Key Features:**\n${Object.entries(specs).map(([key, val]) => `• ${key}: ${val}`).join('\n') || '• No specifications listed'}\n\n` +
        `**Market Comparison:**\n` +
        `• Similar products typically range between ${currency} ${Math.round(price * 0.7).toLocaleString()} and ${currency} ${Math.round(price * 1.3).toLocaleString()}\n` +
        `• ${shopName} has a ${rating > 0 ? `${rating.toFixed(1)}⭐ rating` : 'good reputation'}\n` +
        `• Located in ${area}\n\n` +
        `💡 **Verdict:** ${rating > 4.0 ? 'Excellent' : 'Good'} value for money.`;
    }

    // Good deal / Worth it
    if (lowerQuery.includes('good deal') || lowerQuery.includes('worth') || lowerQuery.includes('value')) {
      return `💰 **Value Analysis: ${productName}**\n\n` +
        `**Price:** ${currency} ${price.toLocaleString()}\n` +
        `**Seller Rating:** ${rating > 0 ? `${rating.toFixed(1)}⭐ (${reviewCount} reviews)` : 'New seller'}\n` +
        `**Location:** ${area}\n` +
        `**Availability:** ${inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
        `**Value Score:** ${rating > 4.0 ? '🟢 Excellent' : rating > 3.0 ? '🟡 Good' : '🟠 Average'}\n\n` +
        `💡 **Recommendation:** ${rating > 4.0 ? 'This is a great deal! Highly recommended.' : rating > 3.0 ? 'This is a solid option.' : 'Consider comparing with other options.'}`;
    }

    // Features / Specifications
    if (lowerQuery.includes('feature') || lowerQuery.includes('spec') || lowerQuery.includes('detail')) {
      const specList = Object.entries(specs)
        .filter(([_, value]) => value)
        .map(([key, value]) => `• **${key}:** ${value}`)
        .join('\n');

      return `📋 **${productName} - Specifications**\n\n` +
        `${specList || 'No detailed specifications available.'}\n\n` +
        `${description ? `📝 **Description:**\n${description}\n\n` : ''}` +
        `🏷️ **Category:** ${category}\n` +
        `📍 **Location:** ${area}\n` +
        `📦 **Status:** ${inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
        `💡 Ask me about specific features or comparisons!`;
    }

    // Customer reviews
    if (lowerQuery.includes('review') || lowerQuery.includes('customer') || lowerQuery.includes('feedback')) {
      return `⭐ **Customer Feedback for ${productName}**\n\n` +
        `${rating > 0 ? `**Overall Rating:** ${rating.toFixed(1)} ⭐ (${reviewCount} reviews)\n\n` : '**No reviews yet**\n\n'}` +
        `**Seller Reputation:**\n` +
        `• ${shopName} has been rated by ${reviewCount > 0 ? reviewCount : 'no'} customers\n` +
        `• ${rating > 4.0 ? '✅ Highly trusted seller' : rating > 3.0 ? '✅ Reliable seller' : '⚠️ Consider reviewing feedback'}\n\n` +
        `💡 **Tip:** Click the "Reviews" button to see detailed customer feedback!`;
    }

    // Delivery / Shipping
    if (lowerQuery.includes('delivery') || lowerQuery.includes('shipping') || lowerQuery.includes('deliver')) {
      return `🚚 **Delivery Information for ${productName}**\n\n` +
        `📍 **Location:** ${area}\n` +
        `📦 **Status:** ${inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
        `**Estimated Delivery:**\n` +
        `• ${area === 'Kampala' || area === 'Jinja' ? '1-2 business days' : '2-4 business days'}\n\n` +
        `**Shipping Options:**\n` +
        `• Standard delivery available\n` +
        `• Express delivery (contact seller)\n\n` +
        `💡 Contact ${shopName} for specific delivery fees.`;
    }

    // Warranty / Guarantee
    if (lowerQuery.includes('warranty') || lowerQuery.includes('guarantee') || lowerQuery.includes('return')) {
      return `🛡️ **Warranty & Returns for ${productName}**\n\n` +
        `**Warranty:**\n` +
        `• Standard manufacturer warranty\n` +
        `• ${shopName} ${rating > 4.0 ? 'premium' : 'standard'} seller guarantee\n\n` +
        `**Returns Policy:**\n` +
        `• ${rating > 4.0 ? '30-day' : '14-day'} return window\n` +
        `• Must be in original packaging\n\n` +
        `💡 Ask ${shopName} for specific warranty terms.`;
    }

    // Price / Cost
    if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('expensive')) {
      return `💰 **Pricing Information for ${productName}**\n\n` +
        `**Current Price:** ${currency} ${price.toLocaleString()}\n` +
        `**Seller:** ${shopName}\n` +
        `**Category:** ${category}\n\n` +
        `**Price Comparison:**\n` +
        `• ${rating > 4.0 ? '✅ Competitive pricing' : '🟡 Average market price'}\n` +
        `• ${currency} ${Math.round(price * 0.8).toLocaleString()} - ${currency} ${Math.round(price * 1.2).toLocaleString()} (typical range)\n\n` +
        `💡 ${price > 500000 ? 'Premium product with higher value' : 'Affordable option with good value'}`;
    }

    // General / Unknown query
    return `🤔 **Here's what I know about ${productName}**\n\n` +
      `**Overview:**\n` +
      `• ${productName}\n` +
      `• Category: ${category}\n` +
      `• Price: ${currency} ${price.toLocaleString()}\n\n` +
      `**Seller:** ${shopName} ${rating > 0 ? `(${rating.toFixed(1)}⭐)` : ''}\n` +
      `**Location:** ${area}\n` +
      `**Status:** ${inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
      `${Object.keys(specs).length > 0 ? `**Key Features:**\n${Object.entries(specs).slice(0, 3).map(([k, v]) => `• ${k}: ${v}`).join('\n')}\n\n` : ''}` +
      `💡 **Try asking:**\n` +
      `• "Compare this with similar products"\n` +
      `• "Is this a good deal?"\n` +
      `• "Tell me about the features"\n` +
      `• "What do customers say?"\n` +
      `• "Tell me about delivery"`;
  };

  // Initialize messages when opportunity changes
  useEffect(() => {
    if (opportunity) {
      const initialMessage = getInitialMessage();
      setMessages([
        {
          id: '1',
          type: 'ai',
          text: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [opportunity]);

  const getInitialMessage = () => {
    const productName = opportunity?.title || 'this product';
    const category = opportunity?.category || 'product';
    const price = opportunity?.price || 0;
    const currency = opportunity?.currency || 'UGX';
    const shopName = opportunity?.shopName || 'the seller';
    const rating = opportunity?.rating || 0;
    
    let baseMessage = `👋 **Hi! I'm your Munolink AI assistant.**\n\nI can help you learn more about **${productName}** — this ${category} from ${shopName}${rating > 0 ? ` (${rating.toFixed(1)}⭐)` : ''} priced at ${currency} ${price.toLocaleString()}.`;
    
    if (contextHint) {
      baseMessage += `\n\n${contextHint}`;
    }
    
    baseMessage += `\n\n💡 **Try asking:**\n• "Compare similar"\n• "Is this a good deal?"\n• "Tell me about features"\n• "What do customers say?"`;
    
    return baseMessage;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !opportunity) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: generateAIResponse(inputText.trim(), opportunity),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800 + Math.random() * 400);
  };

  const handleSuggestionPress = (query: string) => {
    if (!opportunity) return;
    setInputText(query);
    // Auto-send after a short delay
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  // Format timestamp
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Render AI Message with markdown-like formatting
  const renderAIText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, (match, p1) => p1);
      const isBullet = line.trim().startsWith('•');
      const isEmoji = line.trim().match(/^[👍👋🤔🔍💰📋⭐🚚🛡️💡✅❌🟢🟡🟠📦📍🏷️⚖️]/);
      
      if (line.trim() === '') {
        return <View key={index} style={{ height: 6 }} />;
      }
      
      if (isEmoji && !isBullet) {
        return (
          <Text key={index} style={styles.aiEmojiLine}>
            {line}
          </Text>
        );
      }
      
      if (isBullet) {
        return (
          <Text key={index} style={styles.aiBulletPoint}>
            {line}
          </Text>
        );
      }
      
      return (
        <Text key={index} style={styles.aiTextLine}>
          {line}
        </Text>
      );
    });
  };

  // Render Typing Dots
  const renderTypingDots = () => {
    return (
      <View style={styles.typingContainer}>
        {dotAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.typingDot,
              {
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1.2],
                    }),
                  },
                ],
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // ============================================================
  // DESKTOP VIEW - Render content directly (no Modal wrapper)
  // ============================================================
  if (isDesktopView) {
    if (!opportunity) {
      return (
        <View style={styles.desktopEmptyContainer}>
          <Text style={styles.desktopEmptyIcon}>🤖</Text>
          <Text style={styles.desktopEmptyTitle}>No item selected</Text>
          <Text style={styles.desktopEmptySubtext}>
            Select an opportunity to chat with AI
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.desktopContainer}>
        {/* Header */}
        <View style={styles.desktopHeader}>
          <View style={styles.desktopHeaderLeft}>
            <View style={styles.aiAvatarContainer}>
              <Text style={styles.aiAvatar}>🤖</Text>
            </View>
            <View>
              <Text style={styles.desktopHeaderTitle}>AI Assistant</Text>
              <Text style={styles.desktopHeaderSubtitle} numberOfLines={1}>
                {opportunity.title}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.desktopCloseButton}>
            <Ionicons name="close" size={20} color="#8A8AAE" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.desktopMessagesContainer}
          contentContainerStyle={styles.desktopMessagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.desktopMessageWrapper,
                message.type === 'user' ? styles.desktopUserWrapper : styles.desktopAIWrapper,
              ]}
            >
              <View
                style={[
                  styles.desktopMessageBubble,
                  message.type === 'user' ? styles.desktopUserBubble : styles.desktopAIBubble,
                ]}
              >
                {message.type === 'ai' && (
                  <View style={styles.desktopAIIconContainer}>
                    <Text style={styles.desktopAIIcon}>🤖</Text>
                  </View>
                )}
                <View style={styles.desktopMessageContent}>
                  {message.type === 'ai' ? (
                    <View>{renderAIText(message.text)}</View>
                  ) : (
                    <Text style={styles.desktopUserText}>{message.text}</Text>
                  )}
                  <Text style={styles.desktopMessageTime}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.desktopMessageWrapper, styles.desktopAIWrapper]}>
              <View style={[styles.desktopMessageBubble, styles.desktopAIBubble]}>
                <View style={styles.desktopAIIconContainer}>
                  <Text style={styles.desktopAIIcon}>🤖</Text>
                </View>
                <View style={styles.desktopMessageContent}>
                  {renderTypingDots()}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.desktopSuggestionsContainer}
          contentContainerStyle={styles.desktopSuggestionsContent}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.desktopSuggestionChip}
              onPress={() => handleSuggestionPress(suggestion.query)}
            >
              <Text style={styles.desktopSuggestionIcon}>{suggestion.icon}</Text>
              <Text style={styles.desktopSuggestionText}>{suggestion.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.desktopInputContainer}>
          <TextInput
            style={styles.desktopInput}
            placeholder="Ask me anything..."
            placeholderTextColor="#8A8AAE"
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[
              styles.desktopSendButton,
              !inputText.trim() && styles.desktopSendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.desktopSendGradient}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // MOBILE VIEW - Use Modal with BottomSheet
  // ============================================================
  const modalHeight = height * (isLargeScreen ? 0.7 : 0.8);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.mobileModalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.mobileBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.mobileModalContent, { height: modalHeight }]}>
          {/* Drag Indicator */}
          <View style={styles.mobileDragIndicatorContainer}>
            <View style={styles.mobileDragIndicator} />
          </View>

          {/* Header */}
          <View style={styles.mobileHeader}>
            <View style={styles.mobileHeaderLeft}>
              <View style={styles.mobileAIAvatar}>
                <Text style={styles.mobileAIAvatarText}>🤖</Text>
              </View>
              <View>
                <Text style={styles.mobileHeaderTitle}>AI Assistant</Text>
                <Text style={styles.mobileHeaderSubtitle} numberOfLines={1}>
                  {opportunity?.title || 'No product selected'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.mobileCloseButton}>
              <Ionicons name="close" size={22} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          {opportunity ? (
            <>
              {/* Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.mobileMessagesContainer}
                contentContainerStyle={styles.mobileMessagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.mobileMessageWrapper,
                      message.type === 'user' ? styles.mobileUserWrapper : styles.mobileAIWrapper,
                    ]}
                  >
                    <View
                      style={[
                        styles.mobileMessageBubble,
                        message.type === 'user' ? styles.mobileUserBubble : styles.mobileAIBubble,
                      ]}
                    >
                      {message.type === 'ai' && (
                        <Text style={styles.mobileAIIcon}>🤖</Text>
                      )}
                      <Text
                        style={[
                          styles.mobileMessageText,
                          message.type === 'user' ? styles.mobileUserText : styles.mobileAIText,
                        ]}
                      >
                        {message.text}
                      </Text>
                    </View>
                    <Text style={styles.mobileMessageTime}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                ))}
                {isLoading && (
                  <View style={[styles.mobileMessageWrapper, styles.mobileAIWrapper]}>
                    <View style={[styles.mobileMessageBubble, styles.mobileAIBubble]}>
                      <Text style={styles.mobileAIIcon}>🤖</Text>
                      {renderTypingDots()}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Suggestions - Responsive */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mobileSuggestionsContainer}
                contentContainerStyle={styles.mobileSuggestionsContent}
              >
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.mobileSuggestionChip}
                    onPress={() => handleSuggestionPress(suggestion.query)}
                  >
                    <Text style={styles.mobileSuggestionText}>
                      {suggestion.icon} {suggestion.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Input */}
              <View style={styles.mobileInputContainer}>
                <TextInput
                  style={styles.mobileInput}
                  placeholder="Ask me anything..."
                  placeholderTextColor="#8A8AAE"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity
                  style={[
                    styles.mobileSendButton,
                    !inputText.trim() && styles.mobileSendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons name="send" size={20} color={inputText.trim() ? '#FFFFFF' : '#8A8AAE'} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.mobileEmptyContainer}>
              <Text style={styles.mobileEmptyIcon}>🤖</Text>
              <Text style={styles.mobileEmptyTitle}>No item selected</Text>
              <Text style={styles.mobileEmptySubtext}>
                Select an opportunity to chat with AI
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ============================================================
  // DESKTOP STYLES
  // ============================================================
  desktopContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
  },
  desktopEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  desktopEmptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  desktopEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  desktopEmptySubtext: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  desktopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74,125,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatar: {
    fontSize: 20,
  },
  desktopHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  desktopHeaderSubtitle: {
    color: '#8A8AAE',
    fontSize: 12,
    maxWidth: 200,
  },
  desktopCloseButton: {
    padding: 6,
  },
  desktopMessagesContainer: {
    flex: 1,
  },
  desktopMessagesContent: {
    paddingBottom: 12,
  },
  desktopMessageWrapper: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  desktopUserWrapper: {
    justifyContent: 'flex-end',
  },
  desktopAIWrapper: {
    justifyContent: 'flex-start',
  },
  desktopMessageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
  },
  desktopUserBubble: {
    backgroundColor: '#4A7DFF',
    borderBottomRightRadius: 4,
  },
  desktopAIBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 4,
  },
  desktopAIIconContainer: {
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  desktopAIIcon: {
    fontSize: 16,
  },
  desktopMessageContent: {
    flex: 1,
  },
  desktopUserText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  desktopMessageTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  aiTextLine: {
    color: '#E8ECF4',
    fontSize: 14,
    lineHeight: 22,
  },
  aiEmojiLine: {
    color: '#E8ECF4',
    fontSize: 16,
    lineHeight: 24,
  },
  aiBulletPoint: {
    color: '#E8ECF4',
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A7DFF',
  },
  desktopSuggestionsContainer: {
    maxHeight: 44,
    marginVertical: 8,
  },
  desktopSuggestionsContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  desktopSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginRight: 6,
  },
  desktopSuggestionIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  desktopSuggestionText: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  desktopInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
    paddingBottom: 4,
  },
  desktopInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 60,
  },
  desktopSendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  desktopSendButtonDisabled: {
    opacity: 0.4,
  },
  desktopSendGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================================
  // MOBILE STYLES
  // ============================================================
  mobileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mobileBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mobileModalContent: {
    backgroundColor: '#1A2A4F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  mobileDragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  mobileDragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileAIAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74,125,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileAIAvatarText: {
    fontSize: 20,
  },
  mobileHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mobileHeaderSubtitle: {
    color: '#8A8AAE',
    fontSize: 12,
    maxWidth: 180,
  },
  mobileCloseButton: {
    padding: 4,
  },
  mobileMessagesContainer: {
    flex: 1,
  },
  mobileMessagesContent: {
    paddingBottom: 8,
  },
  mobileMessageWrapper: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  mobileUserWrapper: {
    justifyContent: 'flex-end',
  },
  mobileAIWrapper: {
    justifyContent: 'flex-start',
  },
  mobileMessageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mobileUserBubble: {
    backgroundColor: '#4A7DFF',
    borderBottomRightRadius: 4,
  },
  mobileAIBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 4,
  },
  mobileAIIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  mobileMessageText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  mobileUserText: {
    color: '#FFFFFF',
  },
  mobileAIText: {
    color: '#E8ECF4',
  },
  mobileMessageTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginTop: 2,
    position: 'absolute',
    bottom: -16,
    right: 4,
  },
  mobileSuggestionsContainer: {
    maxHeight: 40,
    marginVertical: 6,
  },
  mobileSuggestionsContent: {
    gap: 6,
    paddingHorizontal: 2,
  },
  mobileSuggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginRight: 6,
  },
  mobileSuggestionText: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
    paddingBottom: 4,
  },
  mobileInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 60,
  },
  mobileSendButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  mobileSendButtonDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mobileEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mobileEmptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mobileEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mobileEmptySubtext: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
  },
});