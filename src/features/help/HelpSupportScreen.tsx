// src/features/help/HelpSupportScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// --- FAQ Data ---
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    category: 'Account',
    question: 'How do I create an account?',
    answer: 'To create an account on Munolink, tap on "Join" on the welcome screen. You will be prompted to enter your phone number and create a profile. You can also sign up using your Google account for a quicker process.',
  },
  {
    id: '2',
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'To reset your password, go to the Sign In screen and tap on "Forgot password?". You will receive a password reset link via SMS or email. Follow the instructions to create a new password.',
  },
  {
    id: '3',
    category: 'Account',
    question: 'How do I update my profile information?',
    answer: 'Go to the Account screen, tap on "Profile Settings" to update your personal information, including your name, phone number, and profile picture. You can also change your avatar by tapping on the camera icon on your profile image.',
  },
  {
    id: '4',
    category: 'Business',
    question: 'How do I start a business on Munolink?',
    answer: 'To start a business, go to the Account screen and tap on "Start a Business". You will be guided through the process of setting up your shop, adding products or services, and publishing your offerings.',
  },
  {
    id: '5',
    category: 'Business',
    question: 'How do I add products or services?',
    answer: 'From your Business Dashboard, tap on "Add Product" or "Add Service". Fill in the details including name, description, price, and upload images. Your offering will be published immediately after confirmation.',
  },
  {
    id: '6',
    category: 'Business',
    question: 'How do I update my business logo and banner?',
    answer: 'In your Business Dashboard, go to Settings. From there, you can upload a new logo and banner image for your business. You can also update these from the Account screen by long-pressing on your business card.',
  },
  {
    id: '7',
    category: 'Orders',
    question: 'How do I track my orders?',
    answer: 'You can track your orders from the Orders section in your dashboard. Each order will show its current status (New, Confirmed, Preparing, Ready, Shipped, Completed, or Cancelled).',
  },
  {
    id: '8',
    category: 'Orders',
    question: 'What payment methods are accepted?',
    answer: 'Munolink supports multiple payment methods including Mobile Money (MTN MoMo, Airtel Money), Bank Transfer, and Cash on Delivery. You can also use your Munolink Wallet for faster checkout.',
  },
  {
    id: '9',
    category: 'Orders',
    question: 'How do I cancel an order?',
    answer: 'To cancel an order, go to your Orders, select the order you want to cancel, and tap on "Cancel Order". Please note that orders can only be cancelled before they are marked as "Shipped" or "Completed".',
  },
  {
    id: '10',
    category: 'Wallet',
    question: 'How do I add money to my Munolink Wallet?',
    answer: 'Go to the Wallet section in your Account, then tap on "Add Money". You can transfer funds from your mobile money or bank account to your Munolink Wallet. The funds will reflect instantly.',
  },
  {
    id: '11',
    category: 'Wallet',
    question: 'How do I withdraw money from my wallet?',
    answer: 'To withdraw money, go to the Wallet section and tap on "Withdraw". Enter the amount you want to withdraw and your preferred withdrawal method. Withdrawals typically take 24-48 hours to process.',
  },
  {
    id: '12',
    category: 'Wallet',
    question: 'What are lifetime savings?',
    answer: 'Lifetime savings represent the total amount you have saved through your Munolink account. This includes all your purchases and transactions. You can view your lifetime savings in the Account screen.',
  },
  {
    id: '13',
    category: 'General',
    question: 'Is Munolink secure?',
    answer: 'Yes, Munolink uses industry-standard security measures including end-to-end encryption for messages, secure payment processing, and regular security audits. Your personal information is protected and never shared without your consent.',
  },
  {
    id: '14',
    category: 'General',
    question: 'How do I contact customer support?',
    answer: 'You can contact customer support through the Help & Support screen. We offer support via email (aijukasti@gmail.com), phone (+256 769345264), and live chat. Our team typically responds within 24 hours.',
  },
  {
    id: '15',
    category: 'General',
    question: 'How do I report a problem?',
    answer: 'To report a problem, use the live chat feature in the Help & Support section, or send us an email at aijukasti@gmail.com with details about the issue. We will investigate and get back to you promptly.',
  },
];

// --- FAQ Categories ---
const CATEGORIES = ['All', 'Account', 'Business', 'Orders', 'Wallet', 'General'];

// --- FAQ Item Component ---
const FAQItem = ({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) => {
  const [height] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(height, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  return (
    <TouchableOpacity 
      style={[styles.faqItem, isOpen && styles.faqItemOpen]} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <View style={styles.faqHeaderLeft}>
          <Text style={styles.faqCategory}>{item.category}</Text>
          <Text style={styles.faqQuestion}>{item.question}</Text>
        </View>
        <Ionicons 
          name={isOpen ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#4A7DFF" 
        />
      </View>
      
      <Animated.View 
        style={[
          styles.faqAnswerContainer,
          {
            maxHeight: height.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: height,
          }
        ]}
      >
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- Main Component ---
const HelpSupportContent = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFAQId, setOpenFAQId] = useState<string | null>(null);

  const supportOptions = [
    { 
      id: 'email', 
      icon: 'mail-outline', 
      label: 'Email Support', 
      subtitle: 'aijukasti@gmail.com',
      color: '#2ECC71',
    },
    { 
      id: 'phone', 
      icon: 'call-outline', 
      label: 'Call Us', 
      subtitle: '+256 769345264',
      color: '#F1C40F',
    },
    { 
      id: 'chat', 
      icon: 'chatbubble-outline', 
      label: 'Live Chat', 
      subtitle: 'Available 24/7',
      color: '#9C27B0',
    },
  ];

  const handleOptionPress = (id: string) => {
    if (id === 'email') {
      Linking.openURL('mailto:aijukasti@gmail.com').catch(() => {
        Alert.alert('Error', 'Could not open email app');
      });
    } else if (id === 'phone') {
      Linking.openURL('tel:+256769345264').catch(() => {
        Alert.alert('Error', 'Could not open phone app');
      });
    } else if (id === 'chat') {
      Alert.alert('Live Chat', 'Chat support will be available soon. In the meantime, please email us at aijukasti@gmail.com');
    } else {
      Alert.alert('Coming Soon', `${id} support will be available soon.`);
    }
  };

  const toggleFAQ = (id: string) => {
    setOpenFAQId(openFAQId === id ? null : id);
  };

  const filteredFAQs = selectedCategory === 'All' 
    ? FAQS 
    : FAQS.filter(faq => faq.category === selectedCategory);

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            <Text style={styles.welcomeEmoji}>💬</Text>
            <Text style={styles.welcomeTitle}>How can we help you?</Text>
            <Text style={styles.welcomeSubtitle}>
              Browse our FAQs or contact us directly
            </Text>
          </LinearGradient>
        </View>

        {/* Support Options */}
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <View style={styles.supportOptionsRow}>
          {supportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.supportOptionCard}
              onPress={() => handleOptionPress(option.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.supportOptionIcon, { backgroundColor: option.color + '15' }]}>
                <Ionicons name={option.icon as any} size={24} color={option.color} />
              </View>
              <Text style={styles.supportOptionLabel}>{option.label}</Text>
              <Text style={styles.supportOptionSubtitle}>{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeaderRow}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <Text style={styles.faqCount}>{filteredFAQs.length} questions</Text>
          </View>

          {/* Category Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ List */}
          <View style={styles.faqList}>
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <FAQItem
                  key={faq.id}
                  item={faq}
                  isOpen={openFAQId === faq.id}
                  onToggle={() => toggleFAQ(faq.id)}
                />
              ))
            ) : (
              <View style={styles.emptyFAQs}>
                <Ionicons name="search-outline" size={40} color="#8A8AAE" />
                <Text style={styles.emptyFAQsTitle}>No FAQs found</Text>
                <Text style={styles.emptyFAQsSubtext}>
                  Try selecting a different category
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#8A8AAE" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Response Time</Text>
              <Text style={styles.infoValue}>We typically respond within 24 hours</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#8A8AAE" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Secure & Private</Text>
              <Text style={styles.infoValue}>Your conversations are encrypted</Text>
            </View>
          </View>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>Munolink v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

// --- Main Export ---
export const HelpSupportScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="HelpSupport" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <HelpSupportContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  desktopContainer: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  desktopContent: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2F5F',
    marginBottom: 12,
  },
  supportOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  supportOptionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  supportOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  supportOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  supportOptionSubtitle: {
    fontSize: 10,
    color: '#8A8AAE',
    textAlign: 'center',
    marginTop: 2,
  },
  faqSection: {
    marginBottom: 16,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  faqCount: {
    fontSize: 12,
    color: '#8A8AAE',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryContainer: {
    paddingRight: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#4A7DFF',
    borderColor: '#4A7DFF',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8AAE',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  faqList: {
    gap: 6,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  faqItemOpen: {
    borderColor: '#4A7DFF',
    backgroundColor: '#F8FAFF',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  faqCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A7DFF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2F5F',
    flex: 1,
  },
  faqAnswerContainer: {
    overflow: 'hidden',
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6A7A9E',
    lineHeight: 20,
    paddingTop: 8,
    paddingRight: 8,
  },
  emptyFAQs: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyFAQsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2F5F',
    marginTop: 8,
  },
  emptyFAQsSubtext: {
    fontSize: 13,
    color: '#8A8AAE',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2F5F',
  },
  infoValue: {
    fontSize: 12,
    color: '#8A8AAE',
    marginTop: 1,
  },
  versionText: {
    color: '#8A8AAE',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});