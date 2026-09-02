// src/features/feed/components/AIBottomSheet.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  SafeAreaView,
  LogBox,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Opportunity } from '../../../services/feed.service';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

// Ignore specific warnings
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

interface AIBottomSheetProps {
  bottomSheetRef?: React.RefObject<any>;
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

interface AIAction {
  type: 'view_seller' | 'see_similar' | 'share' | 'contact' | 'view_reviews';
  label: string;
  data?: any;
}

interface AIMessage extends Message {
  actions?: AIAction[];
}

interface MarketplaceData {
  similarItems: any[];
  priceData: any[];
  sellerData: any;
  location: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export const AIBottomSheet: React.FC<AIBottomSheetProps> = ({
  bottomSheetRef,
  opportunity,
  contextHint,
  onClose,
  isDesktopView = false,
  visible = false,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLargeScreen = width >= 768;
  const isSmallScreen = width < 380;
  
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation for typing dots
  const [dotAnimations] = useState(() => 
    [1, 2, 3].map(() => new Animated.Value(0))
  );

  // Debug logging
  useEffect(() => {
    console.log('🔍 AIBottomSheet - Props:', {
      visible,
      hasOpportunity: !!opportunity,
      opportunityTitle: opportunity?.title || 'null',
      isDesktopView,
      messagesCount: messages.length,
      hasInitialized,
    });
  }, [visible, opportunity, isDesktopView, messages.length, hasInitialized]);

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

  // ============================================================
  // SUGGESTIONS - Context-Aware Based on Opportunity Type
  // ============================================================
  
  const getSuggestions = useCallback((): Suggestion[] => {
    const isProduct = opportunity?.type === 'product';
    const isService = opportunity?.type === 'service';
    const category = opportunity?.category || '';
    
    if (isProduct) {
      return [
        { icon: '🔍', text: 'Best alternative', query: 'What are the best alternatives?' },
        { icon: '💰', text: 'Cheaper options', query: 'Find cheaper options' },
        { icon: '⚖️', text: 'Compare nearby', query: 'Compare with nearby sellers' },
        { icon: '📊', text: 'Is it worth it?', query: 'Is this a good deal?' },
        { icon: '🎓', text: 'Best for school', query: 'Is this good for school?' },
        { icon: '🔄', text: 'Find similar', query: 'Find similar products' },
      ];
    }
    
    if (isService) {
      return [
        { icon: '👥', text: 'Compare providers', query: 'Compare with other providers' },
        { icon: '📅', text: 'Available this weekend?', query: 'Are you available this weekend?' },
        { icon: '📋', text: 'What\'s included?', query: 'What does the service include?' },
        { icon: '💰', text: 'Cheaper options', query: 'Find cheaper options' },
        { icon: '⭐', text: 'Best rated nearby', query: 'Who is the best rated nearby?' },
      ];
    }
    
    return [
      { icon: '⚖️', text: 'Compare similar', query: 'Compare this with similar' },
      { icon: '💰', text: 'Good deal?', query: 'Is this a good deal?' },
      { icon: '📋', text: 'Features', query: 'Tell me about the features' },
      { icon: '⭐', text: 'Reviews', query: 'What do customers say?' },
      { icon: '🚚', text: 'Delivery', query: 'Tell me about delivery' },
      { icon: '🛡️', text: 'Warranty', query: 'What warranty is offered?' },
    ];
  }, [opportunity]);

  const suggestions = getSuggestions();

  // ============================================================
  // QUERY MARKETPLACE DATA
  // ============================================================
  
  const queryMarketplace = useCallback(async (opp: Opportunity): Promise<MarketplaceData | null> => {
    try {
      const tableName = opp.type === 'product' ? 'catalog' : 'service_catalog';
      const categoryFilter = opp.category || '';
      
      let query = supabase
        .from(tableName)
        .select('*')
        .limit(10);
      
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      
      const { data: similarItems } = await query;
      
      let priceData: any[] = [];
      const isProduct = opp.type === 'product';
      
      if (isProduct) {
        const { data } = await supabase
          .from('shop_products')
          .select('regular_price')
          .eq('in_stock', true)
          .limit(20);
        if (data) priceData = data;
      } else {
        const { data } = await supabase
          .from('provider_services')
          .select('price')
          .eq('is_active', true)
          .limit(20);
        if (data) priceData = data;
      }
      
      const { data: sellerData } = await supabase
        .from('shops')
        .select('rating, review_count, is_verified')
        .eq('id', opp.shopId)
        .single();
      
      return {
        similarItems: similarItems || [],
        priceData: priceData || [],
        sellerData: sellerData || {},
        location: opp.area || 'nearby',
        inStock: opp.inStock !== false,
        rating: opp.rating || 0,
        reviewCount: opp.reviewCount || 0,
      };
    } catch (error) {
      console.error('Error querying marketplace:', error);
      return null;
    }
  }, []);

  // ============================================================
  // UNIFIED AI TEXT RENDERER - Used by both Desktop & Mobile
  // ============================================================
  
  const renderAIText = useCallback((text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        result.push(<View key={`empty-${index}`} style={{ height: 6 }} />);
        return;
      }
      
      // Check for bold text (text between ** markers)
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        result.push(
          <Text key={`bold-${index}`} style={styles.aiTextLine}>
            {parts.map((part, i) => {
              const isBold = i % 2 === 1;
              return (
                <Text key={`part-${i}`} style={isBold ? styles.aiBoldText : styles.aiTextLine}>
                  {part}
                </Text>
              );
            })}
          </Text>
        );
        return;
      }
      
      // Bullet points (starting with •)
      if (trimmed.startsWith('•')) {
        result.push(
          <View key={`bullet-${index}`} style={styles.bulletContainer}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.aiBulletText}>{trimmed.substring(1).trim()}</Text>
          </View>
        );
        return;
      }
      
      // Emoji headers (starting with emoji)
      const emojiMatch = trimmed.match(/^([👍👋🤔🔍💰📋⭐🚚🛡️💡✅❌🟢🟡🟠📦📍🏷️⚖️🔮👥📅📊🎓🔄🛍️🏪])/);
      if (emojiMatch) {
        result.push(
          <Text key={`emoji-${index}`} style={styles.aiEmojiLine}>
            {trimmed}
          </Text>
        );
        return;
      }
      
      // Regular text
      result.push(
        <Text key={`text-${index}`} style={styles.aiTextLine}>
          {trimmed}
        </Text>
      );
    });
    
    return result;
  }, []);

  // ============================================================
  // AI RESPONSE GENERATOR - With Real Data
  // ============================================================
  
  const generateAIResponse = useCallback(async (query: string, opp: Opportunity): Promise<AIMessage> => {
    const lowerQuery = query.toLowerCase();
    const productName = opp.title || 'this product';
    const price = opp.price || 0;
    const currency = opp.currency || 'UGX';
    const shopName = opp.shopName || 'the seller';
    
    const marketData = await queryMarketplace(opp);
    
    if (!marketData) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `I couldn't fetch enough marketplace data to answer that accurately. Please try again or ask a different question.`,
        actions: [
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
          { type: 'see_similar', label: 'See Similar', data: { category: opp.category } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    const prices = marketData.priceData
      .map(p => p.regular_price || p.price || 0)
      .filter(p => p > 0);
    
    const avgPrice = prices.length > 0 
      ? prices.reduce((a, b) => a + b, 0) / prices.length 
      : price;
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : price * 0.7;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : price * 1.3;
    const priceDiff = avgPrice > 0 ? ((price - avgPrice) / avgPrice) * 100 : 0;
    const isGoodDeal = priceDiff < -10 && marketData.rating > 4.0;
    
    if (lowerQuery.includes('compare') || lowerQuery.includes('similar') || lowerQuery.includes('alternative')) {
      const similarCount = marketData.similarItems?.length || 0;
      
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `🔍 **Comparing ${productName}**\n\n` +
          `**Current Price:** ${currency} ${price.toLocaleString()}\n` +
          `**Seller Rating:** ${marketData.rating > 0 ? `${marketData.rating.toFixed(1)}⭐ (${marketData.reviewCount} reviews)` : 'New seller'}\n` +
          `**Location:** ${marketData.location}\n` +
          `**Availability:** ${marketData.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
          `**Market Comparison (from ${similarCount} similar items):**\n` +
          `• Price range: ${currency} ${Math.round(minPrice).toLocaleString()} - ${currency} ${Math.round(maxPrice).toLocaleString()}\n` +
          `• Average price: ${currency} ${Math.round(avgPrice).toLocaleString()}\n` +
          `• Current price is ${priceDiff > 0 ? '+' : ''}${Math.round(priceDiff)}% ${priceDiff < 0 ? 'below' : 'above'} average\n` +
          `• ${shopName} is ${marketData.rating > 4.0 ? 'highly rated' : marketData.rating > 3.0 ? 'reliable' : 'new'}\n\n` +
          `💡 **Verdict:** ${isGoodDeal ? '✅ Good deal!' : priceDiff < 0 ? '🟡 Competitive pricing' : '🟠 Consider comparing with other options.'}`,
        actions: [
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
          { type: 'see_similar', label: 'See Similar', data: { category: opp.category } },
          { type: 'share', label: 'Share', data: { opportunityId: opp.id } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    if (lowerQuery.includes('good deal') || lowerQuery.includes('worth') || lowerQuery.includes('value')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `💰 **Value Analysis: ${productName}**\n\n` +
          `**Price:** ${currency} ${price.toLocaleString()}\n` +
          `**Market Average:** ${currency} ${Math.round(avgPrice).toLocaleString()}\n` +
          `**Price Difference:** ${priceDiff > 0 ? '+' : ''}${Math.round(priceDiff)}% ${priceDiff < 0 ? 'below' : 'above'} average\n` +
          `**Seller Rating:** ${marketData.rating > 0 ? `${marketData.rating.toFixed(1)}⭐ (${marketData.reviewCount} reviews)` : 'New seller'}\n` +
          `**Location:** ${marketData.location}\n` +
          `**Availability:** ${marketData.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
          `**Value Score:** ${isGoodDeal ? '🟢 Excellent' : priceDiff < 0 ? '🟡 Good' : '🟠 Average'}\n\n` +
          `💡 **Recommendation:** ${isGoodDeal ? '✅ This is a great deal! Highly recommended.' : priceDiff < 0 ? 'This is a solid option.' : 'Consider comparing with other options.'}`,
        actions: [
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
          { type: 'see_similar', label: 'See Similar', data: { category: opp.category } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    if (lowerQuery.includes('feature') || lowerQuery.includes('spec') || lowerQuery.includes('detail')) {
      const specs = opp.specifications || {};
      const specList = Object.entries(specs)
        .filter(([_, value]) => value)
        .map(([key, value]) => `• **${key}:** ${value}`)
        .join('\n');

      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `📋 **${productName} - Specifications**\n\n` +
          `${specList || 'No detailed specifications available.'}\n\n` +
          `${opp.description ? `📝 **Description:**\n${opp.description}\n\n` : ''}` +
          `🏷️ **Category:** ${opp.category || 'Uncategorized'}\n` +
          `📍 **Location:** ${marketData.location}\n` +
          `📦 **Status:** ${marketData.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
          `💡 Ask me about specific features or comparisons!`,
        actions: [
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
          { type: 'see_similar', label: 'See Similar', data: { category: opp.category } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    if (lowerQuery.includes('review') || lowerQuery.includes('customer') || lowerQuery.includes('feedback')) {
      const rating = marketData.rating || 0;
      const reviewCount = marketData.reviewCount || 0;
      
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `⭐ **Customer Feedback for ${productName}**\n\n` +
          `${rating > 0 ? `**Overall Rating:** ${rating.toFixed(1)} ⭐ (${reviewCount} reviews)\n\n` : '**No reviews yet**\n\n'}` +
          `**Seller Reputation:**\n` +
          `• ${shopName} has been rated by ${reviewCount > 0 ? reviewCount : 'no'} customers\n` +
          `• ${rating > 4.0 ? '✅ Highly trusted seller' : rating > 3.0 ? '✅ Reliable seller' : '⚠️ Consider reviewing feedback'}\n\n` +
          `💡 **Tip:** Click the "Reviews" button to see detailed customer feedback!`,
        actions: [
          { type: 'view_reviews', label: 'View Reviews', data: { productId: opp.id } },
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    if (lowerQuery.includes('delivery') || lowerQuery.includes('shipping') || lowerQuery.includes('deliver')) {
      const estimatedDays = marketData.location === 'Kampala' || marketData.location === 'Jinja' 
        ? '1-2 business days' 
        : '2-4 business days';
      
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `🚚 **Delivery Information for ${productName}**\n\n` +
          `📍 **Location:** ${marketData.location}\n` +
          `📦 **Status:** ${marketData.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
          `**Estimated Delivery:**\n` +
          `• ${estimatedDays}\n\n` +
          `**Shipping Options:**\n` +
          `• Standard delivery available\n` +
          `• Express delivery (contact seller)\n\n` +
          `💡 Contact ${shopName} for specific delivery fees and exact timing.`,
        actions: [
          { type: 'contact', label: 'Contact Seller', data: { shopId: opp.shopId } },
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    if (lowerQuery.includes('warranty') || lowerQuery.includes('guarantee') || lowerQuery.includes('return')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `🛡️ **Warranty & Returns for ${productName}**\n\n` +
          `⚠️ **I couldn't verify the exact warranty from the seller's listing.**\n\n` +
          `**What I can tell you:**\n` +
          `• ${shopName} has a ${marketData.rating > 4.0 ? 'premium' : 'standard'} seller reputation\n` +
          `• ${marketData.rating > 4.0 ? 'Highly rated sellers typically offer better warranty terms' : 'Check with the seller for specific warranty details'}\n\n` +
          `💡 **Next steps:**\n` +
          `• Click "Contact Seller" to ask about warranty directly\n` +
          `• View the seller's profile for more information\n\n` +
          `**I won't guess warranty terms - it's better to get accurate information from the seller.**`,
        actions: [
          { type: 'contact', label: 'Contact Seller', data: { shopId: opp.shopId } },
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('expensive')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: `💰 **Pricing Information for ${productName}**\n\n` +
          `**Current Price:** ${currency} ${price.toLocaleString()}\n` +
          `**Market Average:** ${currency} ${Math.round(avgPrice).toLocaleString()}\n` +
          `**Seller:** ${shopName}\n` +
          `**Category:** ${opp.category || 'Uncategorized'}\n\n` +
          `**Price Comparison:**\n` +
          `• ${priceDiff < 0 ? '✅ Below average price' : '🟡 At or above average price'}\n` +
          `• Price range: ${currency} ${Math.round(minPrice).toLocaleString()} - ${currency} ${Math.round(maxPrice).toLocaleString()}\n\n` +
          `💡 ${price > 500000 ? 'Premium product with higher value' : 'Affordable option with good value'}`,
        actions: [
          { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
          { type: 'see_similar', label: 'See Similar', data: { category: opp.category } },
        ],
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      id: Date.now().toString(),
      type: 'ai',
      text: `🤔 **Here's what I know about ${productName}**\n\n` +
        `**Overview:**\n` +
        `• ${productName}\n` +
        `• Category: ${opp.category || 'Uncategorized'}\n` +
        `• Price: ${currency} ${price.toLocaleString()}\n\n` +
        `**Seller:** ${shopName} ${marketData.rating > 0 ? `(${marketData.rating.toFixed(1)}⭐)` : ''}\n` +
        `**Location:** ${marketData.location}\n` +
        `**Status:** ${marketData.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n` +
        `${Object.keys(opp.specifications || {}).length > 0 ? `**Key Features:**\n${Object.entries(opp.specifications || {}).slice(0, 3).map(([k, v]) => `• ${k}: ${v}`).join('\n')}\n\n` : ''}` +
        `💡 **Try asking:**\n` +
        `• "Compare this with similar products"\n` +
        `• "Is this a good deal?"\n` +
        `• "Tell me about the features"\n` +
        `• "What do customers say?"\n` +
        `• "Tell me about delivery"`,
      actions: [
        { type: 'view_seller', label: 'View Seller', data: { shopId: opp.shopId } },
        { type: 'see_similar', label: 'See Similar', data: { category: opp.category } },
        { type: 'share', label: 'Share', data: { opportunityId: opp.id } },
      ],
      timestamp: new Date().toISOString(),
    };
  }, [queryMarketplace]);

  // ============================================================
  // INITIALIZE MESSAGES
  // ============================================================
  
  useEffect(() => {
    if (opportunity && visible) {
      console.log('📱 Initializing messages for opportunity:', opportunity.title);
      const initialMessage = getInitialMessage();
      setMessages([
        {
          id: Date.now().toString(),
          type: 'ai',
          text: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      setHasInitialized(true);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } else if (visible && !opportunity) {
      console.log('⚠️ AIBottomSheet is visible but opportunity is null');
      setMessages([
        {
          id: Date.now().toString(),
          type: 'ai',
          text: '👋 **Hi!** Please select an opportunity to chat with me about.',
          timestamp: new Date().toISOString(),
        },
      ]);
      setHasInitialized(true);
    }
  }, [opportunity, visible]);

  useEffect(() => {
    if (!visible) {
      setInputText('');
      setIsLoading(false);
    }
  }, [visible]);

  const getInitialMessage = useCallback(() => {
    const productName = opportunity?.title || 'this product';
    const category = opportunity?.category || 'product';
    const price = opportunity?.price || 0;
    const currency = opportunity?.currency || 'UGX';
    const shopName = opportunity?.shopName || 'the seller';
    const rating = opportunity?.rating || 0;
    
    let baseMessage = `👋 **Hi! I'm muno AI.**\n\nI can help you learn more about **${productName}** — this ${category} from ${shopName}${rating > 0 ? ` (${rating.toFixed(1)}⭐)` : ''} priced at ${currency} ${price.toLocaleString()}.`;
    
    if (contextHint) {
      baseMessage += `\n\n${contextHint}`;
    }
    
    baseMessage += `\n\n💡 **Try asking:**\n• "Compare similar"\n• "Is this a good deal?"\n• "Tell me about features"\n• "What do customers say?"`;
    
    return baseMessage;
  }, [opportunity, contextHint]);

  // ============================================================
  // HANDLE SEND MESSAGE
  // ============================================================
  
  const handleSendMessage = useCallback(async (customQuery?: string) => {
    const query = customQuery || inputText;
    if (!query.trim() || !opportunity) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: query.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(query.trim(), opportunity);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        text: `I'm having trouble analyzing that right now. Please try asking a different question.`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, opportunity, generateAIResponse]);

  const handleSuggestionPress = useCallback((query: string) => {
    handleSendMessage(query);
  }, [handleSendMessage]);

  const formatTime = useCallback((timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, []);

  // ============================================================
  // UNIFIED AI MESSAGE RENDERER - Used by both Desktop & Mobile
  // ============================================================
  
  const renderAIMessage = useCallback((message: AIMessage) => {
    return (
      <View style={styles.aiMessageContainer}>
        {renderAIText(message.text)}
        {message.actions && message.actions.length > 0 && (
          <View style={styles.actionContainer}>
            {message.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={() => handleActionPress(action)}
              >
                <Text style={styles.actionButtonText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [renderAIText]);

  const handleActionPress = (action: AIAction) => {
    console.log('Action pressed:', action);
    switch (action.type) {
      case 'view_seller':
        break;
      case 'see_similar':
        break;
      case 'share':
        break;
      case 'contact':
        break;
      case 'view_reviews':
        break;
    }
  };

  // Render Typing Dots
  const renderTypingDots = useCallback(() => {
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
  }, [dotAnimations]);

  // ============================================================
  // DESKTOP VIEW
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
        <View style={styles.desktopHeader}>
          <View style={styles.desktopHeaderLeft}>
            <LinearGradient
              colors={['#4A7DFF', '#6C5CE7']}
              style={styles.desktopAvatarGradient}
            >
              <Text style={styles.desktopAvatar}>🔮</Text>
            </LinearGradient>
            <View>
              <Text style={styles.desktopHeaderTitle}>muno AI</Text>
              <Text style={styles.desktopHeaderSubtitle} numberOfLines={1}>
                Knows Munolink • {opportunity.title}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.desktopCloseButton}>
            <Ionicons name="close" size={20} color="#8A8AAE" />
          </TouchableOpacity>
        </View>

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
                    <Text style={styles.desktopAIIcon}>🔮</Text>
                  </View>
                )}
                <View style={styles.desktopMessageContent}>
                  {message.type === 'ai' ? (
                    renderAIMessage(message)
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
                  <Text style={styles.desktopAIIcon}>🔮</Text>
                </View>
                <View style={styles.desktopMessageContent}>
                  {renderTypingDots()}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

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

        <View style={styles.desktopInputContainer}>
          <TextInput
            style={styles.desktopInput}
            placeholder="What can I help you find?"
            placeholderTextColor="#8A8AAE"
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={() => handleSendMessage()}
          />
          <TouchableOpacity
            style={[
              styles.desktopSendButton,
              !inputText.trim() && styles.desktopSendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
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
  // MOBILE VIEW - Uses the same renderAIMessage function
  // ============================================================
  const modalHeight = height * (isLargeScreen ? 0.75 : 0.85);
  const bottomInset = Platform.OS === 'ios' ? insets.bottom : 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        style={styles.mobileModalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <TouchableOpacity style={styles.mobileBackdrop} onPress={onClose} activeOpacity={1} />
        <SafeAreaView style={[styles.mobileModalContent, { height: modalHeight, paddingBottom: bottomInset }]}>
          {/* Drag Indicator */}
          <View style={styles.mobileDragIndicatorContainer}>
            <View style={styles.mobileDragIndicator} />
          </View>

          {/* Header */}
          <View style={styles.mobileHeader}>
            <View style={styles.mobileHeaderLeft}>
              <LinearGradient
                colors={['#4A7DFF', '#6C5CE7']}
                style={styles.mobileAvatarGradient}
              >
                <Text style={styles.mobileAvatarText}>🔮</Text>
              </LinearGradient>
              <View>
                <Text style={styles.mobileHeaderTitle}>muno AI</Text>
                <Text style={styles.mobileHeaderSubtitle} numberOfLines={1}>
                  {opportunity?.title || 'No product selected'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.mobileCloseButton}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
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
                {messages.length === 0 ? (
                  <View style={styles.mobileEmptyState}>
                    <Text style={styles.mobileEmptyStateText}>Loading conversation...</Text>
                  </View>
                ) : (
                  messages.map((message) => (
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
                          <Text style={styles.mobileAIIcon}>🔮</Text>
                        )}
                        <View style={styles.mobileMessageContent}>
                          {message.type === 'ai' ? (
                            renderAIMessage(message)
                          ) : (
                            <Text style={styles.mobileUserText}>{message.text}</Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.mobileMessageTime}>
                        {formatTime(message.timestamp)}
                      </Text>
                    </View>
                  ))
                )}
                {isLoading && (
                  <View style={[styles.mobileMessageWrapper, styles.mobileAIWrapper]}>
                    <View style={[styles.mobileMessageBubble, styles.mobileAIBubble]}>
                      <Text style={styles.mobileAIIcon}>🔮</Text>
                      {renderTypingDots()}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Suggestions */}
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
                  placeholder="What can I help you find?"
                  placeholderTextColor="#6A7A9E"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  numberOfLines={1}
                  onSubmitEditing={() => handleSendMessage()}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  style={[
                    styles.mobileSendButton,
                    !inputText.trim() && styles.mobileSendButtonDisabled,
                  ]}
                  onPress={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                >
                  <LinearGradient
                    colors={['#4A7DFF', '#6C5CE7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mobileSendGradient}
                  >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.mobileEmptyContainer}>
              <Text style={styles.mobileEmptyIcon}>🔮</Text>
              <Text style={styles.mobileEmptyTitle}>No item selected</Text>
              <Text style={styles.mobileEmptySubtext}>
                Select an opportunity to chat with muno AI
              </Text>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================================
// STYLES
// ============================================================
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
  desktopAvatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopAvatar: {
    fontSize: 18,
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
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.2)',
  },
  actionButtonText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },
  aiMessageContainer: {
    flex: 1,
    paddingVertical: 2,
  },
  aiTextLine: {
    color: '#E8ECF4',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 2,
  },
  aiEmojiLine: {
    color: '#E8ECF4',
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 4,
    fontWeight: '600',
  },
  aiBoldText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 24,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    color: '#4A7DFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  aiBulletText: {
    color: '#E8ECF4',
    fontSize: 15,
    lineHeight: 24,
    flex: 1,
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  mobileModalContent: {
    backgroundColor: '#1A2A4F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  mobileDragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  mobileDragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 6,
  },
  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileAvatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileAvatarText: {
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
    minHeight: 100,
  },
  mobileMessagesContent: {
    paddingBottom: 8,
    paddingTop: 4,
  },
  mobileEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  mobileEmptyStateText: {
    color: '#8A8AAE',
    fontSize: 14,
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
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mobileUserBubble: {
    backgroundColor: '#4A7DFF',
    borderBottomRightRadius: 4,
  },
  mobileAIBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mobileAIIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  mobileMessageContent: {
    flex: 1,
  },
  mobileUserText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
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
    maxHeight: 42,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 60,
    minHeight: 40,
  },
  mobileSendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mobileSendButtonDisabled: {
    opacity: 0.4,
  },
  mobileSendGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
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