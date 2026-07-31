import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Opportunity } from '../../../services/feed.service';

interface AIBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  opportunity: Opportunity;
  contextHint?: string; // Add this optional prop
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

export const AIBottomSheet: React.FC<AIBottomSheetProps> = ({
  bottomSheetRef,
  opportunity,
  contextHint,
  onClose,
}) => {
  // Build initial message with context hint if provided
  const getInitialMessage = () => {
    const baseMessage = `👋 Hi! I'm your Munolink AI assistant. I can help you with this ${opportunity.category || 'product'}.`;
    
    if (contextHint) {
      return `${baseMessage}\n\n${contextHint}`;
    }
    
    return `${baseMessage}\n\nTry asking me:\n• "Compare this with similar products"\n• "Is this a good deal?"\n• "Tell me more about the features"\n• "What do other customers say?"`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      text: getInitialMessage(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: generateAIResponse(inputText.trim(), opportunity),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const generateAIResponse = (query: string, opp: Opportunity): string => {
    const lowerQuery = query.toLowerCase();
    
    // Simple response logic (replace with real AI)
    if (lowerQuery.includes('compare') || lowerQuery.includes('similar')) {
      return `🔍 Comparing ${opp.title} with similar products...\n\nThis ${opp.category || 'product'} offers great value at ${opp.currency} ${opp.price.toLocaleString()}. Based on my analysis, it's competitively priced for the features it offers. Similar products in this category typically range between ${opp.currency} ${Math.round(opp.price * 0.8).toLocaleString()} and ${opp.currency} ${Math.round(opp.price * 1.2).toLocaleString()}.`;
    }
    
    if (lowerQuery.includes('good deal') || lowerQuery.includes('worth')) {
      return `💰 Value Analysis: ${opp.title} is priced at ${opp.currency} ${opp.price.toLocaleString()}.\n\n${opp.shopName} has a rating of ${opp.rating || 'N/A'} ⭐, which is ${opp.rating && opp.rating > 4.0 ? 'excellent' : 'good'}.\n\n${opp.area ? `Located in ${opp.area}` : 'Available nearby'}.\n\n✅ I'd say this is a ${opp.rating && opp.rating > 4.0 ? 'great' : 'decent'} deal!`;
    }
    
    if (lowerQuery.includes('feature') || lowerQuery.includes('spec')) {
      const specs = opp.specifications || {};
      const specList = Object.entries(specs)
        .filter(([_, value]) => value)
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n');
      
      return `📋 ${opp.title} Specifications:\n\n${specList || 'No detailed specifications available.'}\n\n${opp.description ? `\n📝 Description: ${opp.description}` : ''}`;
    }
    
    if (lowerQuery.includes('review') || lowerQuery.includes('customer')) {
      return `⭐ Customer Feedback for ${opp.title}:\n\n${opp.shopName} has a ${opp.rating ? `rating of ${opp.rating.toFixed(1)} ⭐ from ${opp.reviewCount || 0} reviews` : 'no reviews yet'}.\n\n💡 Tip: Check the "Reviews" button to see detailed customer feedback!`;
    }
    
    if (lowerQuery.includes('delivery') || lowerQuery.includes('shipping')) {
      return `🚚 Delivery Information for ${opp.title}:\n\n• Available from ${opp.shopName}\n• ${opp.area ? `Location: ${opp.area}` : 'Nearby'}\n• ${opp.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n💡 Contact the seller for specific delivery times and fees.`;
    }
    
    if (lowerQuery.includes('warranty') || lowerQuery.includes('guarantee')) {
      return `🛡️ Warranty Information:\n\n${opp.title} comes with:\n• Manufacturer warranty\n• ${opp.shopName} guarantee\n• ${opp.rating && opp.rating > 4.0 ? '⭐ Premium seller protection' : 'Standard seller protection'}\n\n💡 Ask the seller for specific warranty terms.`;
    }
    
    return `🤔 Here's what I know about ${opp.title}:\n\n• Price: ${opp.currency} ${opp.price.toLocaleString()}\n• Seller: ${opp.shopName}${opp.rating ? ` (${opp.rating.toFixed(1)} ⭐)` : ''}\n• Location: ${opp.area || 'Nearby'}\n• Status: ${opp.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n💡 Try asking me:\n• "Compare this with similar products"\n• "Is this a good deal?"\n• "Tell me about the features"\n• "What do other customers say?"`;
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['65%', '90%']}
      onDismiss={onClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.aiAvatar}>🤖</Text>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Context: {opportunity.title}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Context Hint Badge - Show if there's a hint */}
        {contextHint && (
          <View style={styles.contextHintBadge}>
            <Ionicons name="bulb-outline" size={14} color="#4A7DFF" />
            <Text style={styles.contextHintText}>{contextHint}</Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.type === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingWrapper}>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <ActivityIndicator size="small" color="#4A7DFF" />
                <Text style={[styles.messageText, styles.aiText]}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor="#8A8AAE"
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#1A2A4F',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiAvatar: {
    fontSize: 28,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#8A8AAE',
    fontSize: 18,
  },
  contextHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.15)',
  },
  contextHintText: {
    color: '#4A7DFF',
    fontSize: 12,
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 12,
  },
  messageWrapper: {
    marginBottom: 10,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#4A7DFF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#E8ECF4',
  },
  loadingWrapper: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 40,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});