// src/features/profile/UserProfileScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';
import { SceneRenderer } from '../opportunity/renderer/SceneRenderer';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import * as Haptics from 'expo-haptics';
import { Opportunity } from '../../services/feed.service';

const { width, height } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

interface UserProfileData {
  id: string;
  full_name: string | null;
  phone_number: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  role: string | null;
  wallet_balance: number | null;
  lifetime_savings: number | null;
  kyc_verified: boolean | null;
  created_at: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
}

interface UserPost {
  id: string;
  name: string;
  category: string;
  description: string | null;
  images: string[] | null;
  video: string | null;
  video_thumbnail: string | null;
  price: number | null;
  like_count: number;
  view_count: number;
  created_at: string | null;
  specifications?: any;
}

interface UserProfileScreenProps {
  route: any;
  navigation: any;
}

// ============================================================
// TYPE GUARD FOR SPECIFICATIONS
// ============================================================

function isSpecificationsObject(specs: any): specs is { [key: string]: any } {
  return specs && typeof specs === 'object' && !Array.isArray(specs);
}

// ============================================================
// HELPERS: GET PRICE FROM SPECIFICATIONS
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
// PRICE BADGE HELPER
// ============================================================

const getPriceBadge = (price?: number | null) => {
  if (price === 0 || price === null || price === undefined) {
    return { label: 'Free', color: '#2ECC71', icon: '🎁' };
  }
  if (price && price > 0) {
    return { label: `UGX ${price.toLocaleString()}`, color: '#4A7DFF', icon: '💰' };
  }
  return { label: 'Free', color: '#2ECC71', icon: '🎁' };
};

// ============================================================
// STATS ROW COMPONENT
// ============================================================

const StatsRow = ({ posts, followers, following, onStatPress }: any) => (
  <View style={styles.statsRow}>
    <TouchableOpacity style={styles.statItem} onPress={() => onStatPress('posts')}>
      <Text style={styles.statNumber}>{posts || 0}</Text>
      <Text style={styles.statLabel}>Posts</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.statItem} onPress={() => onStatPress('followers')}>
      <Text style={styles.statNumber}>{followers || 0}</Text>
      <Text style={styles.statLabel}>Followers</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.statItem} onPress={() => onStatPress('following')}>
      <Text style={styles.statNumber}>{following || 0}</Text>
      <Text style={styles.statLabel}>Following</Text>
    </TouchableOpacity>
  </View>
);

// ============================================================
// GRID POST ITEM - WITH TITLE, PRICE, AND USER NAME
// ============================================================

const GridPostItem = ({ item, onPress, userName }: any) => {
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : item.video_thumbnail || null;
  const hasVideo = !!item.video;
  
  // ✅ Extract price from specifications
  const price = extractPriceFromSpecifications(item);
  const hasPrice = price !== undefined && price !== null && price > 0;
  const priceBadge = getPriceBadge(price);
  const displayName = userName || 'User';

  return (
    <TouchableOpacity 
      style={styles.gridPostItem} 
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
      ) : (
        <View style={styles.gridPostPlaceholder}>
          <Ionicons name="image-outline" size={32} color="#8A8AAE" />
        </View>
      )}
      
      {hasVideo && (
        <View style={styles.gridVideoBadge}>
          <Ionicons name="play-circle" size={20} color="#FFFFFF" />
        </View>
      )}
      
      {hasPrice && (
        <View style={[styles.gridPriceBadge, { backgroundColor: priceBadge.color + '25' }]}>
          <Text style={[styles.gridPriceBadgeText, { color: priceBadge.color }]}>
            {priceBadge.icon} {priceBadge.label}
          </Text>
        </View>
      )}
      
      <View style={styles.gridOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gridGradient}
        />
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>{item.name || 'Post'}</Text>
          {hasPrice && (
            <Text style={styles.gridPrice}>UGX {price!.toLocaleString()}</Text>
          )}
          <View style={styles.gridFooter}>
            <Text style={styles.gridUser} numberOfLines={1}>{displayName}</Text>
            {item.like_count && item.like_count > 0 && (
              <Text style={styles.gridLikes}>❤️ {item.like_count}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================
// MAIN CONTENT
// ============================================================

const UserProfileContent = ({ route, navigation }: UserProfileScreenProps) => {
  const { userId, userName: routeUserName } = route.params || {};
  const { user: currentUser } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Fullscreen view state
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<UserPost | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});

  // ============================================================
  // INBOX HANDLER - OPENS CHAT WITH USER
  // ============================================================
  
  const handleInboxPress = useCallback(() => {
    if (!currentUser) {
      Alert.alert('Sign in required', 'Please sign in to message this user.');
      return;
    }

    if (isOwnProfile) {
      Alert.alert('Info', 'You cannot message yourself.');
      return;
    }

    console.log(`💬 Opening inbox with: ${userProfile?.full_name || 'User'} (${userId})`);
    
    navigation.navigate('Inbox', {
      userId: userId,
      userName: userProfile?.full_name || 'User',
    });
  }, [currentUser, userId, userProfile, isOwnProfile, navigation]);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================
  
  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch user profile - INCLUDES BIO
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Check if this is the current user's profile
      const isOwn = currentUser?.id === userId;
      setIsOwnProfile(isOwn);

      // Fetch posts count
      const { count: postsCount, error: postsCountError } = await supabase
        .from('catalog')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (postsCountError) console.error('Posts count error:', postsCountError);

      // Try to fetch followers count
      let followersCountData = 0;
      let followingCountData = 0;
      let isFollowingUser = false;

      try {
        const { count: followersCountResult, error: followersError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);

        if (!followersError) {
          followersCountData = followersCountResult || 0;
        }
      } catch (e) {
        console.log('Follows table may not exist yet');
      }

      try {
        const { count: followingCountResult, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);

        if (!followingError) {
          followingCountData = followingCountResult || 0;
        }
      } catch (e) {
        console.log('Follows table may not exist yet');
      }

      // Check if current user is following this profile
      if (currentUser && !isOwn) {
        try {
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .maybeSingle();

          if (!followError && followData) {
            isFollowingUser = true;
          }
        } catch (e) {
          console.log('Follow check failed - table may not exist');
        }
      }

      setUserProfile({
        id: userData.id,
        full_name: userData.full_name || 'User',
        phone_number: userData.phone_number || '',
        avatar_url: userData.avatar_url || null,
        cover_url: userData.cover_url || null,
        bio: userData.bio || null, // ✅ BIO is fetched
        role: userData.role || 'customer',
        wallet_balance: userData.wallet_balance || 0,
        lifetime_savings: userData.lifetime_savings || 0,
        kyc_verified: userData.kyc_verified || false,
        created_at: userData.created_at || null,
        location_city: userData.location_city || null,
        location_region: userData.location_region || null,
        location_country: userData.location_country || null,
        posts_count: postsCount || 0,
        followers_count: followersCountData,
        following_count: followingCountData,
        is_following: isFollowingUser,
      });

      setIsFollowing(isFollowingUser);
      setFollowersCount(followersCountData);
      setFollowingCount(followingCountData);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    }
  }, [userId, currentUser]);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedPosts: UserPost[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name || 'Untitled',
        category: item.category || 'Uncategorized',
        description: item.description || null,
        images: item.images || null,
        video: item.video || null,
        video_thumbnail: item.video_thumbnail || null,
        price: item.price || null,
        like_count: item.like_count || 0,
        view_count: item.view_count || 0,
        created_at: item.created_at || null,
        specifications: item.specifications || {}, // ✅ Include specifications for price extraction
      }));
      
      setUserPosts(mappedPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  }, [userId]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchUserPosts(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUserProfile, fetchUserPosts]);

  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [loadAllData]);

  // ============================================================
  // FOLLOW HANDLER
  // ============================================================
  
  const handleFollowPress = useCallback(async () => {
    if (!currentUser) {
      Alert.alert('Sign in required', 'Please sign in to follow this user.');
      return;
    }

    if (isOwnProfile) {
      Alert.alert('Info', 'You cannot follow yourself.');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (error) {
          if (error.message?.includes('relation "follows" does not exist')) {
            Alert.alert('Feature Unavailable', 'The follow feature is not yet set up.');
            return;
          }
          throw error;
        }
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId,
          });

        if (error) {
          if (error.message?.includes('relation "follows" does not exist')) {
            Alert.alert('Feature Unavailable', 'The follow feature is not yet set up.');
            return;
          }
          throw error;
        }
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  }, [currentUser, userId, isFollowing, isOwnProfile]);

  // ============================================================
  // FULLSCREEN VIEW HANDLERS
  // ============================================================
  
  const handleItemPress = useCallback((item: UserPost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    setViewMode('fullscreen');
  }, []);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
  }, []);

  // ============================================================
  // STATS PRESS HANDLER
  // ============================================================
  
  const handleStatPress = useCallback((type: string) => {
    let count = 0;
    let label = '';
    switch (type) {
      case 'posts':
        count = userProfile?.posts_count || 0;
        label = 'Posts';
        break;
      case 'followers':
        count = followersCount;
        label = 'Followers';
        break;
      case 'following':
        count = followingCount;
        label = 'Following';
        break;
    }
    Alert.alert(`${label}`, `${count} ${label}`);
  }, [userProfile, followersCount, followingCount]);

  // ============================================================
  // RENDER FULLSCREEN ITEM
  // ============================================================
  
  const renderFullScreenItem = useCallback((item: UserPost) => {
    if (!item) return null;

    const isSaved = savedItemsMap[item.id] || false;
    
    const mediaItems = [];
    const thumbnail = item.video_thumbnail || (item.images && item.images.length > 0 ? item.images[0] : null);
    
    if (item.video) {
      mediaItems.push({ 
        type: 'video' as const, 
        url: item.video,
        thumbnail: thumbnail || undefined
      });
    }
    
    if (item.images && item.images.length > 0) {
      for (const img of item.images) {
        if (mediaItems.some(m => m.url === img)) continue;
        mediaItems.push({ type: 'image' as const, url: img });
      }
    }
    
    if (mediaItems.length === 0) {
      const placeholderText = encodeURIComponent(item.name || 'Post');
      mediaItems.push({ 
        type: 'image' as const, 
        url: `https://via.placeholder.com/400x400/1A2A4F/4A7DFF?text=${placeholderText.substring(0, 20)}` 
      });
    }

    // ✅ Extract price from specifications
    const price = extractPriceFromSpecifications(item);

    const cardWidth = isDesktop ? 420 : width;
    const cardHeight = isDesktop ? height : height;

    // Convert to Opportunity type
    const opportunity: Opportunity = {
      id: item.id,
      title: item.name || 'Post',
      price: price,
      currency: 'UGX',
      imageUrl: item.images?.[0] || item.video_thumbnail || '',
      catalogImages: item.images || [],
      description: item.description || '',
      rating: null,
      reviewCount: 0,
      area: null,
      userLatitude: null,
      userLongitude: null,
      userPhone: null,
      inStock: true,
      category: item.category || null,
      type: 'product',
      createdAt: item.created_at || undefined,
      userId: userProfile?.id || '',
      userFullName: userProfile?.full_name || 'User',
      userAvatar: userProfile?.avatar_url || null,
      video: item.video || null,
      video_thumbnail: item.video_thumbnail || null,
      video_duration: null,
      video_size: null,
      likeCount: item.like_count || 0,
      viewCount: item.view_count || 0,
      shareCount: 0,
      commentCount: 0,
      specifications: item.specifications || {},
    };

    return (
      <View
        style={{
          height: cardHeight,
          width: cardWidth,
          paddingVertical: 0,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <SceneRenderer
          key={item.id}
          media={mediaItems}
          title={item.name || 'Post'}
          price={price}
          currency="UGX"
          userName={userProfile?.full_name || 'User'}
          userAvatar={userProfile?.avatar_url || null}
          description={item.description || null}
          rating={null}
          area={null}
          inStock={true}
          type="product"
          createdAt={item.created_at || undefined}
          isDesktop={isDesktop}
          width={cardWidth}
          height={cardHeight}
          onShowMore={() => {
            Alert.alert('📝 Post Details', item.description || 'No description available');
          }}
          onShare={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onSave={() => {
            if (!currentUser?.id) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const currentSaved = savedItemsMap[item.id] || false;
            const newSaved = !currentSaved;
            setSavedItemsMap(prev => ({ ...prev, [item.id]: newSaved }));
          }}
          onPrimaryAction={() => {
            handleInboxPress();
          }}
          onSceneChange={(index, source) => {
            if (__DEV__) {
              console.log('Scene changed to:', index, source);
            }
          }}
          onBehavioralEvent={(event) => {
            if (__DEV__) {
              console.log('Behavioral event:', event);
            }
          }}
          autoPlay={false}
          autoPlayInterval={5000}
          resetKey={item.id}
          bottomOffset={0}
        />

        <View style={styles.actionRailWrapper}>
          <FloatingActionRail
            key={`rail-${item.id}`}
            opportunity={opportunity}
            onUserPress={() => {
              navigation.navigate('UserProfile', {
                userId: userProfile?.id,
                userName: userProfile?.full_name,
              });
            }}
            onReviewsPress={() => {}}
            onDirectionsPress={() => {}}
            onSharePress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onAIPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              Alert.alert('🤖 AI Assistant', `Analyzing post: ${item.name}`);
            }}
            onSavePress={() => {
              if (!currentUser?.id) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const currentSaved = savedItemsMap[item.id] || false;
              const newSaved = !currentSaved;
              setSavedItemsMap(prev => ({ ...prev, [item.id]: newSaved }));
            }}
            isSaved={isSaved}
            savedCount={0}
            shareCount={0}
            reviewCount={0}
            userAvatar={userProfile?.avatar_url || null}
          />
        </View>
      </View>
    );
  }, [isDesktop, width, height, navigation, currentUser?.id, userProfile, savedItemsMap, handleInboxPress]);

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- FULLSCREEN VIEW ---
  if (viewMode === 'fullscreen' && selectedItem) {
    const allItems = userPosts;
    const currentIndex = allItems.findIndex(item => item.id === selectedItem.id);
    const initialIndex = currentIndex !== -1 ? currentIndex : 0;

    return (
      <View style={styles.fullscreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

        <TouchableOpacity style={styles.fullscreenBackButton} onPress={handleBackToGrid}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.fullscreenBackText}>Back</Text>
        </TouchableOpacity>

        <FlatList
          data={allItems}
          renderItem={({ item }) => (
            <View style={{ height: height, width: width }}>
              {renderFullScreenItem(item)}
            </View>
          )}
          keyExtractor={(item, index) => `fullscreen-${item.id}-${index}`}
          pagingEnabled={!isDesktop}
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={isDesktop ? 3 : 1}
          windowSize={isDesktop ? 5 : 2}
          scrollEventThrottle={32}
        />
      </View>
    );
  }

  // --- GRID VIEW ---
  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.desktopContainer]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userProfile.full_name || 'User'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
        }
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {userProfile.cover_url ? (
            <Image source={{ uri: userProfile.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <LinearGradient
                colors={['rgba(74,125,255,0.3)', 'rgba(74,125,255,0.1)']}
                style={styles.coverGradient}
              />
            </View>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ 
                uri: userProfile.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.full_name || 'User')}&background=4A7DFF&color=fff&size=200&bold=true` 
              }} 
              style={styles.profileImage} 
            />
          </View>
          
          <View style={styles.profileActions}>
            {!isOwnProfile && (
              <>
                <TouchableOpacity 
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={handleFollowPress}
                >
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.inboxButton}
                  onPress={handleInboxPress}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#4A7DFF" />
                </TouchableOpacity>
              </>
            )}
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('Account')}
              >
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* User Info - WITH BIO DISPLAYED */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userProfile.full_name || 'User'}</Text>
          {/* ✅ BIO is displayed here */}
          {userProfile.bio && (
            <Text style={styles.userBio}>{userProfile.bio}</Text>
          )}
          {userProfile.location_city && (
            <View style={styles.userLocation}>
              <Ionicons name="location-outline" size={14} color="#8A8AAE" />
              <Text style={styles.userLocationText}>
                {[userProfile.location_city, userProfile.location_region, userProfile.location_country]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <StatsRow 
          posts={userProfile.posts_count} 
          followers={followersCount} 
          following={followingCount}
          onStatPress={handleStatPress}
        />

        {/* Posts Grid - WITH TITLE, PRICE (from specifications), USER NAME */}
        {userPosts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Ionicons name="images-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyPostsTitle}>No posts yet</Text>
            <Text style={styles.emptyPostsSubtext}>
              {isOwnProfile ? 'Share your first post with the community' : 'This user has not posted anything yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={userPosts}
            renderItem={({ item }) => (
              <GridPostItem 
                item={item} 
                onPress={handleItemPress}
                userName={userProfile.full_name || 'User'}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.postsGrid}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// MAIN EXPORT
// ============================================================

export const UserProfileScreen = ({ route, navigation }: UserProfileScreenProps) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="UserProfile" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <UserProfileContent route={route} navigation={navigation} />
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
  desktopContainer: {
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  goBackText: {
    color: '#4A7DFF',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#0D0D1A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  backButton: {
    padding: 4,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  coverContainer: {
    height: 150,
    backgroundColor: '#1A1A2E',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    backgroundColor: 'rgba(74,125,255,0.1)',
  },
  coverGradient: {
    width: '100%',
    height: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -30,
  },
  profileImageContainer: {
    padding: 3,
    backgroundColor: '#0D0D1A',
    borderRadius: 50,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#4A7DFF',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#4A7DFF',
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#8A8AAE',
  },
  inboxButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(74,125,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74,125,255,0.2)',
  },
  editProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  userInfo: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userBio: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  userLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  userLocationText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginTop: 12,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  postsGrid: {
    paddingHorizontal: 4,
  },
  gridPostItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  gridPostImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  gridPostPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridVideoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
    zIndex: 5,
  },
  gridPriceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  gridPriceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  gridGradient: {
    width: '100%',
    height: '100%',
  },
  gridInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridPrice: {
    color: '#4A7DFF',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 1,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  gridUser: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    flex: 1,
  },
  gridLikes: {
    color: '#F1C40F',
    fontSize: 9,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyPostsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyPostsSubtext: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 20,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenBackButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  fullscreenBackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  actionRailWrapper: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 50,
  },
});