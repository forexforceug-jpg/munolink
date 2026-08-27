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
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { feedService, Opportunity as RawOpportunity } from '../../services/feed.service';
import { recommendationService } from '../../services/recommendation.service';
import { supabase } from '../../lib/supabase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Types ---
interface SearchResult extends RawOpportunity {
  relevanceScore?: number;
  aiTag?: boolean;
}

interface SearchIntent {
  keywords: string[];
  categories: string[];
  priceRange: { min: number; max: number } | null;
  location: string | null;
  type: 'product' | 'service' | 'all';
  inStock: boolean;
  minRating: number;
}

// --- Sub-components ---

const TrendingItem = React.memo(({ item, onPress }: any) => (
  <TouchableOpacity style={styles.trendingItem} onPress={() => onPress(item.label)}>
    <Text style={styles.trendingLabel}>{item.label}</Text>
  </TouchableOpacity>
));

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

// ============================================================
// NATURAL LANGUAGE PARSING
// ============================================================

const parseNaturalLanguageQuery = (query: string): SearchIntent => {
  const cleanQuery = query.trim();
  
  const intent: SearchIntent = {
    keywords: [],
    categories: [],
    priceRange: null,
    location: null,
    type: 'all',
    inStock: false,
    minRating: 0,
  };

  // Price patterns
  const underMatch = cleanQuery.match(/(?:under|less than|below|max|maximum|<=?)\s*(?:UGX|ugx|usd|USD)?\s*([\d,]+)/i);
  if (underMatch) {
    intent.priceRange = { min: 0, max: parseInt(underMatch[1].replace(/,/g, '')) };
  }
  
  const aboveMatch = cleanQuery.match(/(?:above|over|more than|greater than|min|minimum|>=?)\s*(?:UGX|ugx|usd|USD)?\s*([\d,]+)/i);
  if (aboveMatch && !intent.priceRange) {
    intent.priceRange = { min: parseInt(aboveMatch[1].replace(/,/g, '')), max: 10000000 };
  }
  
  const betweenMatch = cleanQuery.match(/(?:between|from)\s*(?:UGX|ugx|usd|USD)?\s*([\d,]+)\s*(?:and|to)\s*(?:UGX|ugx|usd|USD)?\s*([\d,]+)/i);
  if (betweenMatch && !intent.priceRange) {
    intent.priceRange = { 
      min: parseInt(betweenMatch[1].replace(/,/g, '')), 
      max: parseInt(betweenMatch[2].replace(/,/g, '')) 
    };
  }

  // Location
  const locationMatch = cleanQuery.match(/(?:in|near|around|at)\s+([a-zA-Z\s]+?)(?:\s+for|\s+with|\s+and|$)/i);
  if (locationMatch) {
    intent.location = locationMatch[1].trim();
  }

  // Stock availability
  if (/(?:in stock|available|instock)/i.test(cleanQuery)) {
    intent.inStock = true;
  }

  // Rating
  const ratingMatch = cleanQuery.match(/(?:rated|rating|stars?)\s*([\d.]+)\s*(?:star|stars?)?/i);
  if (ratingMatch) {
    intent.minRating = parseFloat(ratingMatch[1]);
  }

  // Type detection
  if (/\b(product|item|goods|merchandise)\b/i.test(cleanQuery)) {
    intent.type = 'product';
  } else if (/\b(service|booking|appointment|consultation|repair|cleaning|delivery)\b/i.test(cleanQuery)) {
    intent.type = 'service';
  }

  // Extract keywords
  let keywordText = cleanQuery;
  keywordText = keywordText.replace(/(?:under|less than|below|max|maximum|<=?)\s*(?:UGX|ugx|usd|USD)?\s*[\d,]+/gi, '');
  keywordText = keywordText.replace(/(?:above|over|more than|greater than|min|minimum|>=?)\s*(?:UGX|ugx|usd|USD)?\s*[\d,]+/gi, '');
  keywordText = keywordText.replace(/(?:between|from)\s*(?:UGX|ugx|usd|USD)?\s*[\d,]+\s*(?:and|to)\s*(?:UGX|ugx|usd|USD)?\s*[\d,]+/gi, '');
  keywordText = keywordText.replace(/(?:in|near|around|at)\s+[a-zA-Z\s]+(?:\s+for|\s+with|\s+and|$)/gi, '');
  keywordText = keywordText.replace(/(?:in stock|available|instock)/gi, '');
  keywordText = keywordText.replace(/(?:rated|rating|stars?)\s*[\d.]+\s*(?:star|stars?)?/gi, '');
  
  const stopWords = new Set([
    'i', 'am', 'looking', 'for', 'a', 'an', 'the', 'to', 'from', 'with', 
    'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'of', 'so', 'than',
    'that', 'this', 'these', 'those', 'then', 'than', 'very', 'too', 'also',
    'get', 'want', 'need', 'find', 'search', 'looking', 'can', 'please'
  ]);
  
  intent.keywords = keywordText
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w.toLowerCase()));

  // Detect categories
  const categoryMap: Record<string, string[]> = {
    'phone': ['Electronics', 'Phones & Accessories'],
    'samsung': ['Electronics', 'Phones & Accessories'],
    'iphone': ['Electronics', 'Phones & Accessories'],
    'macbook': ['Electronics', 'Computers & Laptops'],
    'laptop': ['Electronics', 'Computers & Laptops'],
    'mechanic': ['Automotive', 'Repair & Services'],
    'car': ['Automotive', 'Vehicles'],
    'restaurant': ['Food & Dining', 'Restaurants'],
    'pizza': ['Food & Dining', 'Restaurants'],
    'hotel': ['Travel & Hospitality', 'Hotels & Lodging'],
    'room': ['Travel & Hospitality', 'Hotels & Lodging'],
    'electrician': ['Home Services', 'Repair & Services'],
    'cleaning': ['Home Services', 'Cleaning Services'],
    'delivery': ['Shipping & Logistics', 'Delivery Services'],
  };

  const detectedCategories: string[] = [];
  for (const keyword of intent.keywords) {
    const keywordLower = keyword.toLowerCase();
    for (const [key, categories] of Object.entries(categoryMap)) {
      if (keywordLower.includes(key) || key.includes(keywordLower)) {
        detectedCategories.push(...categories);
      }
    }
  }
  intent.categories = [...new Set(detectedCategories)].slice(0, 3);

  return intent;
};

// ============================================================
// GET SIMILAR ITEMS
// ============================================================

const getSimilarItems = (
  item: RawOpportunity,
  allOpportunities: RawOpportunity[]
): RawOpportunity[] => {
  const similar: (RawOpportunity & { matchScore: number })[] = [];
  const itemKeywords = `${item.title || ''} ${item.category || ''} ${item.shopName || ''}`.toLowerCase();
  
  for (const other of allOpportunities) {
    if (other.id === item.id) continue;
    
    const otherText = `${other.title || ''} ${other.category || ''} ${other.shopName || ''}`.toLowerCase();
    let matchScore = 0;
    
    if (other.category && item.category && 
        other.category.toLowerCase().includes(item.category.toLowerCase())) {
      matchScore += 3;
    }
    
    const itemWords = new Set(itemKeywords.split(/\s+/));
    const otherWords = otherText.split(/\s+/);
    let commonWords = 0;
    for (const word of otherWords) {
      if (word.length > 2 && itemWords.has(word)) {
        commonWords++;
      }
    }
    matchScore += commonWords * 0.5;
    
    if (other.shopId === item.shopId) {
      matchScore += 2;
    }
    
    if (other.type === item.type) {
      matchScore += 1;
    }
    
    if (matchScore > 1.5) {
      similar.push({ ...other, matchScore });
    }
  }
  
  similar.sort((a, b) => b.matchScore - a.matchScore);
  return similar.slice(0, 15);
};

// ============================================================
// MIX RECOMMENDATIONS
// ============================================================

const mixRecommendations = (items: RawOpportunity[]): RawOpportunity[] => {
  const products = items.filter(item => item.type === 'product');
  const services = items.filter(item => item.type === 'service' || item.type === 'event');
  
  if (products.length === 0) return services.slice(0, 30);
  if (services.length === 0) return products.slice(0, 30);
  
  const mixed: RawOpportunity[] = [];
  const maxLen = Math.max(products.length, services.length);
  
  for (let i = 0; i < maxLen && mixed.length < 30; i++) {
    if (i < products.length) {
      mixed.push(products[i]);
    }
    if (i < services.length && mixed.length < 30) {
      mixed.push(services[i]);
    }
  }
  
  return mixed;
};

// --- Main Search Content Component ---
const SearchContent = ({ navigation }: any) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{ id: string; label: string; time: string }[]>([]);
  const [popularSearches, setPopularSearches] = useState<{ id: string; label: string }[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const searchContainerRef = useRef<View>(null);

  const { data: allOpportunities, isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: ['opportunities'],
    queryFn: feedService.getOpportunities,
    staleTime: 5 * 60 * 1000,
  });

  // ============================================================
  // SEARCH HISTORY FUNCTIONS (Direct Supabase calls)
  // ============================================================

  // Track search in database
  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    intent: SearchIntent,
    filtersApplied: any
  ) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          query: query.trim(),
          results_count: resultsCount,
          intent: intent as any,
          filters_applied: filtersApplied || {},
        });
        
      if (error) {
        console.error('Error tracking search:', error);
      }
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }, [user?.id]);

  // Load recent searches from database
  const loadRecentSearches = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('id, query, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading recent searches:', error);
        setRecentSearches([]);
        return;
      }

      const formatted = data.map((s: any) => ({
        id: s.id,
        label: s.query,
        time: s.created_at ? timeAgo(new Date(s.created_at)) : 'Just now',
      }));
      setRecentSearches(formatted);
    } catch (error) {
      console.error('Error loading recent searches:', error);
      setRecentSearches([]);
    }
  }, [user?.id]);

  // Load popular searches from database
  const loadPopularSearches = useCallback(async () => {
    setIsLoadingPopular(true);
    try {
      // Get all searches and count manually
      const { data, error } = await supabase
        .from('search_history')
        .select('query')
        .limit(100);

      if (error) {
        console.error('Error loading popular searches:', error);
        setPopularSearches(getDefaultPopularSearches());
        setIsLoadingPopular(false);
        return;
      }

      if (!data || data.length === 0) {
        setPopularSearches(getDefaultPopularSearches());
        setIsLoadingPopular(false);
        return;
      }

      // Count occurrences
      const countMap: Record<string, number> = {};
      data.forEach((item: any) => {
        const query = item.query;
        countMap[query] = (countMap[query] || 0) + 1;
      });

      const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query]) => query);

      const formatted = sorted.map((query: string, index: number) => ({
        id: `popular-${index}`,
        label: query,
      }));
      
      setPopularSearches(formatted.length > 0 ? formatted : getDefaultPopularSearches());
    } catch (error) {
      console.error('Error loading popular searches:', error);
      setPopularSearches(getDefaultPopularSearches());
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  // Default popular searches fallback
  const getDefaultPopularSearches = () => [
    { id: '1', label: 'Samsung phones under UGX 2M' },
    { id: '2', label: 'Mechanic available today' },
    { id: '3', label: 'Pizza delivery near me' },
    { id: '4', label: 'Hotel rooms tonight' },
    { id: '5', label: 'iPhone 16 deals' },
    { id: '6', label: 'Electrician in Jinja' },
  ];

  // Delete a single search
  const deleteSearch = useCallback(async (searchId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error deleting search:', error);
      }
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  }, [user?.id]);

  // Clear all search history
  const clearAllSearches = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error clearing search history:', error);
      }
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, [user?.id]);

  // Load data on mount
  useEffect(() => {
    loadRecentSearches();
    loadPopularSearches();
  }, [loadRecentSearches, loadPopularSearches]);

  // Helper function for time ago
  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
  };

  // Get suggestions as user types
  useEffect(() => {
    if (searchQuery.length > 1 && allOpportunities) {
      const lowerPartial = searchQuery.toLowerCase();
      const suggestionsSet = new Set<string>();
      
      allOpportunities.forEach((item: RawOpportunity) => {
        if (item.category && item.category.toLowerCase().includes(lowerPartial)) {
          suggestionsSet.add(item.category);
        }
      });
      
      allOpportunities.forEach((item: RawOpportunity) => {
        if (item.shopName && item.shopName.toLowerCase().includes(lowerPartial)) {
          suggestionsSet.add(item.shopName);
        }
      });
      
      allOpportunities.forEach((item: RawOpportunity) => {
        if (item.area && item.area.toLowerCase().includes(lowerPartial)) {
          suggestionsSet.add(item.area);
        }
      });
      
      allOpportunities
        .filter((item: RawOpportunity) => 
          item.title && item.title.toLowerCase().includes(lowerPartial)
        )
        .slice(0, 3)
        .forEach((item: RawOpportunity) => {
          if (item.title) suggestionsSet.add(item.title);
        });
      
      setSuggestions([...suggestionsSet].slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allOpportunities]);

  // Use popular searches from database or fallback
  const trendingSearches = popularSearches.length > 0 ? popularSearches : getDefaultPopularSearches();

  const suggestedPrompts = [
    { id: '1', icon: '🎯', label: 'Find a mechanic who can come today' },
    { id: '2', icon: '💰', label: 'Samsung phone under UGX 2 million' },
    { id: '3', icon: '🏠', label: 'Home cleaning services nearby' },
    { id: '4', icon: '📅', label: 'Available for booking this weekend' },
    { id: '5', icon: '🌟', label: 'Highly rated restaurants in Jinja' },
    { id: '6', icon: '🚚', label: 'Same-day delivery products' },
  ];

  // ============================================================
  // ENHANCED SEARCH WITH HISTORY TRACKING
  // ============================================================
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }

    const opportunities = allOpportunities || [];

    if (!opportunities || opportunities.length === 0) {
      Alert.alert('No Data', 'No products or services available to search.');
      return;
    }

    setIsLoading(true);
    setIsSearching(true);

    try {
      const intent = parseNaturalLanguageQuery(query);

      let results = opportunities;

      if (intent.keywords.length > 0) {
        results = results.filter((item: RawOpportunity) => {
          const searchText = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.shopName || ''} ${item.area || ''}`.toLowerCase();
          return intent.keywords.some(kw => searchText.includes(kw.toLowerCase()));
        });
      }

      if (intent.categories.length > 0) {
        results = results.filter((item: RawOpportunity) => {
          return intent.categories.some(cat => 
            item.category?.toLowerCase().includes(cat.toLowerCase())
          );
        });
      }

      if (intent.priceRange) {
        results = results.filter((item: RawOpportunity) => {
          const price = item.price || 0;
          return price >= intent.priceRange!.min && price <= intent.priceRange!.max;
        });
      }

      if (intent.location) {
        results = results.filter((item: RawOpportunity) => {
          return item.area?.toLowerCase().includes(intent.location!.toLowerCase());
        });
      }

      if (intent.type !== 'all') {
        results = results.filter((item: RawOpportunity) => item.type === intent.type);
      }

      if (intent.inStock) {
        results = results.filter((item: RawOpportunity) => item.inStock !== false);
      }

      if (intent.minRating > 0) {
        results = results.filter((item: RawOpportunity) => (item.rating || 0) >= intent.minRating);
      }

      const scoredResults = results.map((item: RawOpportunity) => {
        let score = 0;
        const searchText = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.shopName || ''} ${item.area || ''}`.toLowerCase();
        
        if (intent.keywords.some(kw => item.title?.toLowerCase().includes(kw.toLowerCase()))) {
          score += 20;
        }
        
        if (intent.categories.some(cat => item.category?.toLowerCase().includes(cat.toLowerCase()))) {
          score += 15;
        }
        
        if (intent.keywords.some(kw => item.description?.toLowerCase().includes(kw.toLowerCase()))) {
          score += 10;
        }
        
        if (intent.keywords.some(kw => item.shopName?.toLowerCase().includes(kw.toLowerCase()))) {
          score += 8;
        }
        
        if (intent.location && item.area?.toLowerCase().includes(intent.location.toLowerCase())) {
          score += 10;
        }
        
        if (intent.priceRange) {
          const price = item.price || 0;
          if (price >= intent.priceRange.min && price <= intent.priceRange.max) {
            score += 5;
          }
        }
        
        if (item.rating && item.rating >= 4.0) {
          score += 5;
        } else if (item.rating && item.rating >= 3.5) {
          score += 3;
        }
        
        return { ...item, relevanceScore: score };
      });

      scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      let recommendations: RawOpportunity[] = [];

      if (scoredResults.length > 0) {
        const topResult = scoredResults[0];
        const similarItems = getSimilarItems(topResult, opportunities);
        const resultIds = new Set(scoredResults.map(r => r.id));
        recommendations = similarItems.filter(item => !resultIds.has(item.id));
        
        if (user?.id) {
          const personalized = await recommendationService.getPersonalizedRecommendations(
            opportunities.filter(item => !resultIds.has(item.id)),
            user.id
          );
          const combined = [...recommendations, ...personalized];
          const unique = Array.from(new Map(combined.map((item: RawOpportunity) => [item.id, item])).values());
          recommendations = unique;
        }
      } else {
        const relatedItems = opportunities.filter((item: RawOpportunity) => {
          const searchText = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.shopName || ''}`.toLowerCase();
          return intent.keywords.some(kw => searchText.includes(kw.toLowerCase()));
        });
        
        if (relatedItems.length > 0) {
          const scoredRelated = relatedItems.map((item: RawOpportunity) => {
            let score = 0;
            if (intent.keywords.some(kw => item.title?.toLowerCase().includes(kw.toLowerCase()))) {
              score += 20;
            }
            return { ...item, relevanceScore: score };
          });
          scoredRelated.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
          recommendations = scoredRelated.slice(0, 20);
        } else if (user?.id) {
          recommendations = await recommendationService.getPersonalizedRecommendations(
            opportunities,
            user.id
          );
        }
      }

      const mixedRecommendations = mixRecommendations(recommendations);
      const finalRecommendations = mixedRecommendations.slice(0, 30);

      const taggedResults = scoredResults.map((item: SearchResult, index: number) => ({
        ...item,
        aiTag: index < 3 && (item.relevanceScore || 0) > 10,
      }));

      const allResults = [...taggedResults];
      
      if (finalRecommendations.length > 0) {
        const resultIds = new Set(allResults.map(r => r.id));
        const recs = finalRecommendations
          .filter(r => !resultIds.has(r.id))
          .map((r, index) => ({
            ...r,
            relevanceScore: 0,
            aiTag: false,
          }));
        allResults.push(...recs);
      }

      // ✅ Track search in database using local function
      if (user?.id) {
        await trackSearch(
          query,
          scoredResults.length,
          intent,
          {
            categories: intent.categories,
            priceRange: intent.priceRange,
            location: intent.location,
            type: intent.type,
            inStock: intent.inStock,
            minRating: intent.minRating,
          }
        );
      }

      setIsLoading(false);
      setIsSearching(false);

      navigation.navigate('SearchResults', {
        results: allResults,
        query: query,
        initialIndex: 0,
        intent: intent,
        hasResults: scoredResults.length > 0,
        totalResults: scoredResults.length,
        recommendationsCount: finalRecommendations.length,
      });

      // Reload recent searches
      await loadRecentSearches();

    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to perform search. Please try again.');
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [allOpportunities, user?.id, navigation, trackSearch, loadRecentSearches]);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      Alert.alert('Search', 'Please enter a search term');
    }
  }, [searchQuery, performSearch]);

  const handlePromptPress = useCallback((prompt: string) => {
    setSearchQuery(prompt);
    setShowSuggestions(false);
    performSearch(prompt);
  }, [performSearch]);

  const handleRecentPress = useCallback((query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    performSearch(query);
  }, [performSearch]);

  const handleRecentDelete = useCallback(async (id: string) => {
    // Remove from local state
    setRecentSearches(prev => prev.filter(item => item.id !== id));
    
    // Delete from database
    await deleteSearch(id);
  }, [deleteSearch]);

  const handleClearAllRecent = useCallback(async () => {
    if (user?.id) {
      Alert.alert(
        'Clear Search History',
        'Are you sure you want to clear all search history?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clear', 
            style: 'destructive',
            onPress: async () => {
              await clearAllSearches();
              setRecentSearches([]);
            }
          }
        ]
      );
    } else {
      setRecentSearches([]);
    }
  }, [user?.id, clearAllSearches]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (queryError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
        <Text style={styles.errorText}>Failed to load search data</Text>
        <Text style={styles.errorSubtext}>{queryError.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (queryLoading && !allOpportunities) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading search data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper} ref={searchContainerRef}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#8A8AAE" />
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
            onFocus={() => setShowSuggestions(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#8A8AAE" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <LinearGradient
              colors={['#4A7DFF', '#6C5CE7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchButtonGradient}
            >
              <Ionicons name="search-outline" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `suggestion-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <Ionicons name="search-outline" size={16} color="#4A7DFF" />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4A7DFF" />
            <Text style={styles.loadingOverlayText}>Searching...</Text>
          </View>
        </View>
      )}

      {/* Main Content */}
      {!isLoading && !showSuggestions && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Trending Now - From Database */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
              {isLoadingPopular && (
                <ActivityIndicator size="small" color="#4A7DFF" />
              )}
            </View>
            <View style={styles.trendingGrid}>
              {trendingSearches.slice(0, 6).map((item) => (
                <TrendingItem key={item.id} item={item} onPress={handlePromptPress} />
              ))}
            </View>
          </View>

          {/* Suggested Prompts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 Suggested Prompts</Text>
            </View>
            <View style={styles.suggestedGrid}>
              {suggestedPrompts.map((item) => (
                <SuggestedPrompt key={item.id} item={item} onPress={handlePromptPress} />
              ))}
            </View>
          </View>

          {/* Recent Searches - From Database */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🕐 Recent Searches</Text>
                <TouchableOpacity onPress={handleClearAllRecent}>
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
    </SafeAreaView>
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
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0D0D1A' }}>
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
    paddingHorizontal: 24,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#0D0D1A',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },

  // Search Bar
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0D0D1A',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    marginLeft: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: 'rgba(20, 20, 40, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    maxHeight: 250,
    marginHorizontal: 16,
    borderRadius: 12,
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    gap: 12,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  loadingCard: {
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  loadingOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearRecentText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // Trending
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trendingLabel: {
    color: '#FFFFFF',
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
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.1)',
    borderRadius: 12,
  },
  suggestedPromptIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  suggestedPromptText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  suggestedPromptArrow: {
    marginLeft: 8,
  },

  // Recent Searches
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    padding: 6,
  },

  // Error & Loading States
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

  bottomSpacer: {
    height: 40,
  },
});