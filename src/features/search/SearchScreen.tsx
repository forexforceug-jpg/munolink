import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const trendingSearches = [
  { id: '1', icon: '🔥', label: 'Samsung phones under UGX 2M' },
  { id: '2', icon: '🔧', label: 'Mechanic available today' },
  { id: '3', icon: '🍕', label: 'Pizza delivery near me' },
  { id: '4', icon: '🏨', label: 'Hotel rooms tonight' },
  { id: '5', icon: '📱', label: 'iPhone 16 deals' },
  { id: '6', icon: '⚡', label: 'Electrician in Jinja' },
];

const suggestedPrompts = [
  { id: '1', icon: '🎯', label: 'Find a mechanic who can come today' },
  { id: '2', icon: '💰', label: 'Samsung phone under UGX 2 million' },
  { id: '3', icon: '🏠', label: 'Home cleaning services nearby' },
  { id: '4', icon: '📅', label: 'Available for booking this weekend' },
  { id: '5', icon: '🌟', label: 'Highly rated restaurants in Jinja' },
  { id: '6', icon: '🚚', label: 'Same-day delivery products' },
];

const recentSearches = [
  { id: '1', label: 'Samsung phones', time: '2 hours ago' },
  { id: '2', label: 'Mechanic Jinja', time: 'Yesterday' },
  { id: '3', label: 'Best restaurants', time: '2 days ago' },
  { id: '4', label: 'iPhone 16 price', time: '3 days ago' },
];

// --- Sub-components ---

// Trending Search Item
const TrendingItem = ({ item }: any) => (
  <TouchableOpacity style={styles.trendingItem}>
    <Text style={styles.trendingIcon}>{item.icon}</Text>
    <Text style={styles.trendingLabel}>{item.label}</Text>
  </TouchableOpacity>
);

// Suggested Prompt
const SuggestedPrompt = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.suggestedPrompt} onPress={() => onPress(item.label)}>
    <LinearGradient
      colors={['rgba(74, 125, 255, 0.05)', 'rgba(74, 125, 255, 0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.suggestedPromptGradient}
    >
      <Text style={styles.suggestedPromptIcon}>{item.icon}</Text>
      <Text style={styles.suggestedPromptText} numberOfLines={2}>{item.label}</Text>
      <Ionicons name="arrow-forward" size={16} color="#4A7DFF" style={styles.suggestedPromptArrow} />
    </LinearGradient>
  </TouchableOpacity>
);

// Recent Search Item
const RecentItem = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.recentItem} onPress={() => onPress(item.label)}>
    <View style={styles.recentItemLeft}>
      <View style={styles.recentItemIcon}>
        <Ionicons name="time-outline" size={16} color="#4A7DFF" />
      </View>
      <View>
        <Text style={styles.recentItemLabel}>{item.label}</Text>
        <Text style={styles.recentItemTime}>{item.time}</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.recentItemDelete}>
      <Ionicons name="close" size={16} color="#8A8AAE" />
    </TouchableOpacity>
  </TouchableOpacity>
);

// AI Search Result Card
const AIResultCard = ({ item, index }: any) => (
  <View style={styles.resultCard}>
    <Image source={{ uri: item.image }} style={styles.resultImage} />
    <View style={styles.resultInfo}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        {item.aiTag && (
          <View style={styles.resultAITag}>
            <Ionicons name="sparkles" size={10} color="#4A7DFF" />
            <Text style={styles.resultAITagText}>AI Pick</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultShop}>{item.shop}</Text>
      <Text style={styles.resultPrice}>UGX {item.price.toLocaleString()}</Text>
      <View style={styles.resultFooter}>
        <Text style={styles.resultRating}>⭐ {item.rating}</Text>
        <Text style={styles.resultDistance}>• {item.distance}</Text>
        <Text style={[styles.resultStatus, { color: item.inStock ? '#2ECC71' : '#E74C3C' }]}>
          {item.inStock ? 'In Stock' : 'Check Availability'}
        </Text>
      </View>
    </View>
  </View>
);

// --- Main SearchScreen Component ---
export const SearchScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mock AI search results
  const mockResults = [
    { id: '1', title: 'Samsung Galaxy S25', shop: 'TechWorld Kampala', price: 2850000, image: 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=S25', rating: 4.8, distance: '0.6 km', inStock: true, aiTag: true },
    { id: '2', title: 'iPhone 16 Pro Max', shop: 'City Electronics', price: 3200000, image: 'https://via.placeholder.com/80/6B94FF/FFFFFF?text=iPhone', rating: 4.9, distance: '1.2 km', inStock: true, aiTag: false },
    { id: '3', title: 'MacBook Air M3', shop: 'TechWorld Kampala', price: 4500000, image: 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=MacBook', rating: 4.7, distance: '0.6 km', inStock: true, aiTag: true },
    { id: '4', title: 'Mechanic Service', shop: 'QuickFix Auto', price: 150000, image: 'https://via.placeholder.com/80/6B94FF/FFFFFF?text=Mechanic', rating: 4.5, distance: '2.3 km', inStock: true, aiTag: false },
  ];

  // Simulate AI search
  const performSearch = (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowResults(true);

    // Animate results in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Simulate API call
    setTimeout(() => {
      setSearchResults(mockResults);
      setIsLoading(false);
      setIsSearching(true);
    }, 800);
  };

  // Handle search input submit
  const handleSearch = () => {
    Keyboard.dismiss();
    performSearch(searchQuery);
  };

  // Handle suggested prompt press
  const handlePromptPress = (prompt: string) => {
    setSearchQuery(prompt);
    performSearch(prompt);
  };

  // Handle recent search press
  const handleRecentPress = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    setIsSearching(false);
    setSearchResults([]);
    inputRef.current?.focus();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Render search content
  const renderSearchContent = () => {
    if (showResults && isSearching) {
      // Search Results
      return (
        <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
          {/* AI Summary */}
          <View style={styles.aiSummary}>
            <Ionicons name="sparkles" size={16} color="#4A7DFF" />
            <Text style={styles.aiSummaryText}>
              I found <Text style={styles.aiSummaryHighlight}>{searchResults.length}</Text> opportunities for "{searchQuery}"
            </Text>
          </View>

          {/* Result Tabs */}
          <View style={styles.resultTabs}>
            {['All', 'Products', 'Services', 'Shops'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.resultTab, activeTab === tab.toLowerCase() && styles.resultTabActive]}
                onPress={() => setActiveTab(tab.toLowerCase())}
              >
                <Text style={[styles.resultTabText, activeTab === tab.toLowerCase() && styles.resultTabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results List */}
          <FlatList
            data={searchResults}
            renderItem={({ item, index }) => <AIResultCard item={item} index={index} />}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      );
    }

    // Home / Initial State
    return (
      <>
        {/* Trending Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          <View style={styles.trendingGrid}>
            {trendingSearches.map((item) => (
              <TrendingItem key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Suggested Prompts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Suggested Prompts</Text>
          <View style={styles.suggestedGrid}>
            {suggestedPrompts.map((item) => (
              <SuggestedPrompt key={item.id} item={item} onPress={handlePromptPress} />
            ))}
          </View>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🕐 Recent Searches</Text>
              <TouchableOpacity>
                <Text style={styles.clearRecentText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((item) => (
              <RecentItem key={item.id} item={item} onPress={handleRecentPress} />
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={22} color="#8A8AAE" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Ask AI anything..."
            placeholderTextColor="#8A8AAE"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#8A8AAE" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic-outline" size={22} color="#4A7DFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera-outline" size={22} color="#4A7DFF" />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7DFF" />
          <Text style={styles.loadingText}>AI is searching...</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!isLoading && renderSearchContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2F5F',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 16,
    padding: 0,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  cameraButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearRecentText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // Trending
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    gap: 6,
  },
  trendingIcon: {
    fontSize: 14,
  },
  trendingLabel: {
    color: '#1F2F5F',
    fontSize: 13,
  },
  // Suggested Prompts
  suggestedGrid: {
    gap: 8,
  },
  suggestedPrompt: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestedPromptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.1)',
    borderRadius: 12,
  },
  suggestedPromptIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  suggestedPromptText: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 14,
  },
  suggestedPromptArrow: {
    marginLeft: 8,
  },
  // Recent
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentItemLabel: {
    color: '#1F2F5F',
    fontSize: 14,
  },
  recentItemTime: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  recentItemDelete: {
    padding: 4,
  },
  // Results
  resultsContainer: {
    flex: 1,
  },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.1)',
  },
  aiSummaryText: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 13,
  },
  aiSummaryHighlight: {
    fontWeight: 'bold',
    color: '#4A7DFF',
  },
  resultTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  resultTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
  },
  resultTabActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  resultTabText: {
    color: '#8A8AAE',
    fontSize: 13,
    fontWeight: '500',
  },
  resultTabTextActive: {
    color: '#4A7DFF',
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  resultImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  resultAITag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  resultAITagText: {
    color: '#4A7DFF',
    fontSize: 8,
    fontWeight: '500',
  },
  resultShop: {
    color: '#4A7DFF',
    fontSize: 12,
    marginTop: 2,
  },
  resultPrice: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  resultRating: {
    color: '#F1C40F',
    fontSize: 12,
  },
  resultDistance: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  resultStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});