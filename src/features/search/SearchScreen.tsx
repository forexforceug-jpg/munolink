// src/features/search/SearchScreen.tsx

import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

interface CatalogPost {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  video: string | null;
  video_thumbnail: string | null;
  video_duration: number | null;
  video_size: number | null;
  tags: string[];
  location: string | null;
  category: string | null;
  status: string;
  like_count: number;
  view_count: number;
  share_count: number;
  comment_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
  specifications?: any;
  user_full_name?: string | null;
  user_avatar?: string | null;
}

interface SearchResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  catalogImages: string[];
  description: string;
  rating: number | null;
  reviewCount: number | null;
  area: string | null;
  inStock: boolean;
  category: string | null;
  type: 'product' | 'service' | 'event';
  createdAt?: string;
  userId: string;
  userFullName: string;
  userAvatar: string | null;
  userLatitude: number | null;
  userLongitude: number | null;
  userPhone: string | null;
  video: string | null;
  video_thumbnail: string | null;
  video_duration: number | null;
  video_size: number | null;
  likeCount?: number;
  viewCount?: number;
  shareCount?: number;
  commentCount?: number;
  saveCount?: number;
  isSaved?: boolean;
  specifications?: any;
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

// ============================================================
// TYPE GUARD FOR SPECIFICATIONS
// ============================================================

function isSpecificationsObject(specs: any): specs is { [key: string]: any } {
  return specs && typeof specs === 'object' && !Array.isArray(specs);
}

// ============================================================
// HELPER: GET PRICE FROM SPECIFICATIONS
// ============================================================

function extractPriceFromSpecifications(post: any): number {
  let price = post.price || 0;
  const specs = post.specifications || {};
  
  if (price === 0 && isSpecificationsObject(specs)) {
    const specPrice = specs.price || specs.regular_price || null;
    if (specPrice !== null && specPrice !== undefined) {
      const parsedPrice = typeof specPrice === 'number' ? specPrice : parseFloat(String(specPrice));
      if (!isNaN(parsedPrice)) {
        price = parsedPrice;
      }
    }
  }
  return price;
}

// ============================================================
// HELPER: GET IMAGE URL
// ============================================================

function getImageUrl(post: any): string {
  if (post.images && post.images.length > 0) {
    return post.images[0];
  }
  if (post.video_thumbnail) {
    return post.video_thumbnail;
  }
  return '';
}

// ============================================================
// SUB-COMPONENTS - DEFINED BEFORE SearchContent
// ============================================================

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
// MAIN SEARCH CONTENT
// ============================================================

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
  const [catalogPosts, setCatalogPosts] = useState<CatalogPost[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  
  const inputRef = useRef<TextInput>(null);
  const searchContainerRef = useRef<View>(null);

  // ============================================================
  // FETCH CATALOG POSTS
  // ============================================================

  const fetchCatalogPosts = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('❌ Error fetching catalog:', error);
        setIsLoadingCatalog(false);
        return;
      }

      if (!data || data.length === 0) {
        setCatalogPosts([]);
        setIsLoadingCatalog(false);
        return;
      }

      // Fetch user info for all posts
      const userIds = data
        .map(post => post.user_id)
        .filter((id): id is string => id !== null && id !== undefined);

      let userMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (!usersError && users) {
          users.forEach((u: any) => {
            userMap[u.id] = {
              full_name: u.full_name || 'User',
              avatar_url: u.avatar_url || null,
            };
          });
        }
      }

      const postsWithUsers = data.map((post: any) => ({
        ...post,
        user_full_name: userMap[post.user_id]?.full_name || 'User',
        user_avatar: userMap[post.user_id]?.avatar_url || null,
      }));

      setCatalogPosts(postsWithUsers);
    } catch (error) {
      console.error('❌ Error in fetchCatalogPosts:', error);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogPosts();
  }, [fetchCatalogPosts]);

  // ============================================================
  // SEARCH HISTORY FUNCTIONS
  // ============================================================

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

      const formatted = (data || []).map((s: any) => ({
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

  const loadPopularSearches = useCallback(async () => {
    setIsLoadingPopular(true);
    try {
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

  const getDefaultPopularSearches = () => [
    { id: '1', label: 'Samsung phones under UGX 2M' },
    { id: '2', label: 'Mechanic available today' },
    { id: '3', label: 'Pizza delivery near me' },
    { id: '4', label: 'Hotel rooms tonight' },
    { id: '5', label: 'iPhone 16 deals' },
    { id: '6', label: 'Electrician in Jinja' },
  ];

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

  useEffect(() => {
    loadRecentSearches();
    loadPopularSearches();
  }, [loadRecentSearches, loadPopularSearches]);

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
    if (searchQuery.length > 1 && catalogPosts.length > 0) {
      const lowerPartial = searchQuery.toLowerCase();
      const suggestionsSet = new Set<string>();
      
      catalogPosts.forEach((item) => {
        if (item.category && item.category.toLowerCase().includes(lowerPartial)) {
          suggestionsSet.add(item.category);
        }
      });
      
      catalogPosts.forEach((item) => {
        if (item.user_full_name && item.user_full_name.toLowerCase().includes(lowerPartial)) {
          suggestionsSet.add(item.user_full_name);
        }
      });
      
      catalogPosts.forEach((item) => {
        if (item.location && item.location.toLowerCase().includes(lowerPartial)) {
          suggestionsSet.add(item.location);
        }
      });
      
      catalogPosts
        .filter((item) => item.name && item.name.toLowerCase().includes(lowerPartial))
        .slice(0, 3)
        .forEach((item) => {
          if (item.name) suggestionsSet.add(item.name);
        });
      
      setSuggestions([...suggestionsSet].slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, catalogPosts]);

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

    // Detect categories - simplified
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
  // PERFORM SEARCH
  // ============================================================

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }

    if (catalogPosts.length === 0) {
      Alert.alert('No Data', 'No products or services available to search.');
      return;
    }

    setIsLoading(true);
    setIsSearching(true);

    try {
      const intent = parseNaturalLanguageQuery(query);

      // Start with all catalog posts
      let results = catalogPosts;

      // Keyword search
      if (intent.keywords.length > 0) {
        results = results.filter((item) => {
          const searchText = `${item.name || ''} ${item.description || ''} ${item.category || ''} ${item.user_full_name || ''} ${item.location || ''}`.toLowerCase();
          return intent.keywords.some(kw => searchText.includes(kw.toLowerCase()));
        });
      }

      // Category filter
      if (intent.categories.length > 0) {
        results = results.filter((item) => {
          return intent.categories.some(cat => 
            item.category?.toLowerCase().includes(cat.toLowerCase())
          );
        });
      }

      // Price range filter
      if (intent.priceRange) {
        results = results.filter((item) => {
          const price = extractPriceFromSpecifications(item);
          return price >= intent.priceRange!.min && price <= intent.priceRange!.max;
        });
      }

      // Location filter
      if (intent.location) {
        results = results.filter((item) => {
          return item.location?.toLowerCase().includes(intent.location!.toLowerCase());
        });
      }

      // Type filter
      if (intent.type !== 'all') {
        results = results.filter((item) => {
          const isService = item.category?.toLowerCase().includes('service') || 
                           item.category?.toLowerCase().includes('repair') ||
                           item.category?.toLowerCase().includes('cleaning') ||
                           item.category?.toLowerCase().includes('delivery');
          const isProduct = !isService;
          
          if (intent.type === 'product') return isProduct;
          if (intent.type === 'service') return isService;
          return true;
        });
      }

      // Score results
      const scoredResults = results.map((item) => {
        let score = 0;
        const searchText = `${item.name || ''} ${item.description || ''} ${item.category || ''} ${item.user_full_name || ''} ${item.location || ''}`.toLowerCase();
        
        if (intent.keywords.some(kw => item.name?.toLowerCase().includes(kw.toLowerCase()))) {
          score += 20;
        }
        
        if (intent.categories.some(cat => item.category?.toLowerCase().includes(cat.toLowerCase()))) {
          score += 15;
        }
        
        if (intent.keywords.some(kw => item.description?.toLowerCase().includes(kw.toLowerCase()))) {
          score += 10;
        }
        
        if (intent.keywords.some(kw => item.user_full_name?.toLowerCase().includes(kw.toLowerCase()))) {
          score += 8;
        }
        
        if (intent.location && item.location?.toLowerCase().includes(intent.location.toLowerCase())) {
          score += 10;
        }
        
        if (intent.priceRange) {
          const price = extractPriceFromSpecifications(item);
          if (price >= intent.priceRange.min && price <= intent.priceRange.max) {
            score += 5;
          }
        }
        
        if (item.like_count && item.like_count > 5) {
          score += Math.min(item.like_count / 10, 5);
        }
        
        return { ...item, relevanceScore: score };
      });

      scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      // Map to SearchResult format
      const searchResults: SearchResult[] = scoredResults.map((item) => ({
        id: item.id,
        title: item.name || 'Untitled',
        price: extractPriceFromSpecifications(item),
        currency: 'UGX',
        imageUrl: getImageUrl(item),
        catalogImages: item.images || [],
        description: item.description || '',
        rating: null,
        reviewCount: null,
        area: item.location || null,
        inStock: true,
        category: item.category || null,
        type: 'product' as const,
        createdAt: item.created_at,
        userId: item.user_id || '',
        userFullName: item.user_full_name || 'User',
        userAvatar: item.user_avatar || null,
        userLatitude: null,
        userLongitude: null,
        userPhone: null,
        video: item.video || null,
        video_thumbnail: item.video_thumbnail || null,
        video_duration: item.video_duration || null,
        video_size: item.video_size || null,
        likeCount: item.like_count || 0,
        viewCount: item.view_count || 0,
        shareCount: item.share_count || 0,
        commentCount: item.comment_count || 0,
        saveCount: item.save_count || 0,
        specifications: item.specifications || {},
        relevanceScore: item.relevanceScore || 0,
        aiTag: (item.relevanceScore || 0) > 15,
      }));

      // Track search
      if (user?.id) {
        await trackSearch(
          query,
          searchResults.length,
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
        results: searchResults,
        query: query,
        initialIndex: 0,
        intent: intent,
        hasResults: searchResults.length > 0,
        totalResults: searchResults.length,
        recommendationsCount: 0,
      });

      await loadRecentSearches();

    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to perform search. Please try again.');
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [catalogPosts, user?.id, navigation, trackSearch, loadRecentSearches]);

  // ============================================================
  // HANDLERS
  // ============================================================

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
    setRecentSearches(prev => prev.filter(item => item.id !== id));
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

  // ============================================================
  // LOADING STATES
  // ============================================================

  if (isLoadingCatalog) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading search data...</Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 40 }} />
      </View>

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

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4A7DFF" />
            <Text style={styles.loadingOverlayText}>Searching...</Text>
          </View>
        </View>
      )}

      {!isLoading && !showSuggestions && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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

// ============================================================
// MAIN EXPORT
// ============================================================

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