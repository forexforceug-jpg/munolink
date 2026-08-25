// src/features/search/SearchScreen.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { feedService, Opportunity as RawOpportunity } from '../../services/feed.service';
import { recommendationService } from '../../services/recommendation.service';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Types ---
interface SearchResult extends RawOpportunity {
  relevanceScore?: number;
  aiTag?: boolean;
}

// --- Sub-components ---

// ✅ Updated: Trending Item - Just the title
const TrendingItem = React.memo(({ item, onPress }: any) => (
  <TouchableOpacity style={styles.trendingItem} onPress={() => onPress(item.label)}>
    <Text style={styles.trendingLabel}>{item.label}</Text>
  </TouchableOpacity>
));

// Suggested Prompt
const SuggestedPrompt = React.memo(({ item, onPress }: any) => (
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
));

// Recent Search Item
const RecentItem = React.memo(({ item, onPress, onDelete }: any) => (
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
    <TouchableOpacity style={styles.recentItemDelete} onPress={() => onDelete(item.id)}>
      <Ionicons name="close" size={16} color="#8A8AAE" />
    </TouchableOpacity>
  </TouchableOpacity>
));

// --- Main Search Content Component ---
const SearchContent = ({ navigation }: any) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{ id: string; label: string; time: string }[]>([]);
  
  const inputRef = useRef<TextInput>(null);

  const { data: allOpportunities, isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: ['opportunities'],
    queryFn: feedService.getOpportunities,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setRecentSearches([
      { id: '1', label: 'Samsung phones', time: '2 hours ago' },
      { id: '2', label: 'Mechanic Jinja', time: 'Yesterday' },
      { id: '3', label: 'Best restaurants', time: '2 days ago' },
    ]);
  }, []);

  // ✅ Simplified trending searches - just text
  const trendingSearches = [
    { id: '1', label: 'Samsung phones under UGX 2M' },
    { id: '2', label: 'Mechanic available today' },
    { id: '3', label: 'Pizza delivery near me' },
    { id: '4', label: 'Hotel rooms tonight' },
    { id: '5', label: 'iPhone 16 deals' },
    { id: '6', label: 'Electrician in Jinja' },
  ];

  const suggestedPrompts = [
    { id: '1', icon: '🎯', label: 'Find a mechanic who can come today' },
    { id: '2', icon: '💰', label: 'Samsung phone under UGX 2 million' },
    { id: '3', icon: '🏠', label: 'Home cleaning services nearby' },
    { id: '4', icon: '📅', label: 'Available for booking this weekend' },
    { id: '5', icon: '🌟', label: 'Highly rated restaurants in Jinja' },
    { id: '6', icon: '🚚', label: 'Same-day delivery products' },
  ];

  // ✅ Perform search and navigate to results
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }

    const opportunities = allOpportunities || [];

    if (!opportunities || opportunities.length === 0) {
      Alert.alert('No Data', 'No products or services available to search.');
      return;
    }

    console.log(`🔍 Searching for: "${query}" in ${opportunities.length} opportunities`);

    setIsLoading(true);
    setIsSearching(true);

    const searchTerm = query.toLowerCase().trim();
    
    const results = opportunities.filter((item: RawOpportunity) => {
      const titleMatch = item.title?.toLowerCase().includes(searchTerm) || false;
      const shopMatch = item.shopName?.toLowerCase().includes(searchTerm) || false;
      const categoryMatch = item.category?.toLowerCase().includes(searchTerm) || false;
      const descriptionMatch = item.description?.toLowerCase().includes(searchTerm) || false;
      const areaMatch = item.area?.toLowerCase().includes(searchTerm) || false;
      
      return titleMatch || shopMatch || categoryMatch || descriptionMatch || areaMatch;
    });

    console.log(`✅ Found ${results.length} results for "${query}"`);

    const scoredResults = results.map((item: RawOpportunity) => {
      let score = 0;
      const term = searchTerm;
      
      if (item.title?.toLowerCase().includes(term)) score += 10;
      if (item.shopName?.toLowerCase().includes(term)) score += 5;
      if (item.category?.toLowerCase().includes(term)) score += 3;
      if (item.description?.toLowerCase().includes(term)) score += 2;
      if (item.area?.toLowerCase().includes(term)) score += 1;
      
      if (item.rating && item.rating > 4.0) score += 2;
      if (item.inStock) score += 1;
      
      return {
        ...item,
        relevanceScore: score,
      };
    });

    scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    const taggedResults = scoredResults.map((item: SearchResult, index: number) => ({
      ...item,
      aiTag: index < 3 && item.relevanceScore && item.relevanceScore > 5,
    }));

    setIsLoading(false);
    setIsSearching(false);

    // ✅ Navigate to SearchResultsScreen
    if (taggedResults.length > 0) {
      navigation.navigate('SearchResults', {
        results: taggedResults,
        query: query,
        initialIndex: 0,
      });
    } else {
      Alert.alert('No Results', `No results found for "${query}". Try adjusting your search.`);
    }

    // Track search
    if (user?.id) {
      console.log(`📊 Search tracked: "${query}" - ${taggedResults.length} results`);
    }
  }, [allOpportunities, user?.id, navigation]);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      const newRecent = {
        id: Date.now().toString(),
        label: searchQuery.trim(),
        time: 'Just now',
      };
      setRecentSearches(prev => [newRecent, ...prev.filter(r => r.label !== searchQuery.trim())]);
    } else {
      Alert.alert('Search', 'Please enter a search term');
    }
  }, [searchQuery, performSearch]);

  const handlePromptPress = useCallback((prompt: string) => {
    setSearchQuery(prompt);
    performSearch(prompt);
  }, [performSearch]);

  const handleRecentPress = useCallback((query: string) => {
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  const handleRecentDelete = useCallback((id: string) => {
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  // ✅ Go Back Handler
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (queryError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
        <Text style={styles.errorText}>Failed to load search data</Text>
        <Text style={styles.errorSubtext}>{queryError.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (queryLoading && !allOpportunities) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading search data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* ✅ Header with Go Back Arrow */}
      <View style={[styles.headerContainer, isDesktop && styles.headerContainerDesktop]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={22} color="#8A8AAE" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search products and services..."
            placeholderTextColor="#8A8AAE"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#8A8AAE" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.voiceButton} onPress={handleSearch}>
          <Ionicons name="search-outline" size={22} color="#4A7DFF" />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A7DFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!isLoading && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ✅ Trending Now - Simplified */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
            <View style={styles.trendingGrid}>
              {trendingSearches.map((item) => (
                <TrendingItem key={item.id} item={item} onPress={handlePromptPress} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Suggested Prompts</Text>
            <View style={styles.suggestedGrid}>
              {suggestedPrompts.map((item) => (
                <SuggestedPrompt key={item.id} item={item} onPress={handlePromptPress} />
              ))}
            </View>
          </View>

          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🕐 Recent Searches</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={styles.clearRecentText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((item) => (
                <RecentItem 
                  key={item.id} 
                  item={item} 
                  onPress={handleRecentPress}
                  onDelete={handleRecentDelete}
                />
              ))}
            </View>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
};

// --- Main SearchScreen Component ---
export const SearchScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Search" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SearchContent navigation={navigation} />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  containerDesktop: {
    backgroundColor: '#0D0D1A',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    padding: 20,
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  errorSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // ✅ Header with Back Button
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(13, 13, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContainerDesktop: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(13, 13, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
    zIndex: 10,
  },
  searchContainerDesktop: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  // ✅ Updated Trending Grid - Simpler
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trendingLabel: {
    color: '#FFFFFF',
    fontSize: 13,
  },
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
    color: '#FFFFFF',
    fontSize: 14,
  },
  suggestedPromptArrow: {
    marginLeft: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
    fontSize: 14,
  },
  recentItemTime: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  recentItemDelete: {
    padding: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});