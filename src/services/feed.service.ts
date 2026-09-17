// src/services/feed.service.ts

import { supabase } from '../lib/supabase';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  video: string | null;
  video_thumbnail: string | null;
  video_duration: number | null;
  video_size: number | null;
  hashtags: string[];
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
  user_full_name: string | null;
  user_avatar: string | null;
  user_latitude: number | null;
  user_longitude: number | null;
  detected_category: string | null;
  detected_intent: string | null;
  detected_tags: string[];
  specifications?: any;
}

export interface Opportunity {
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
  hashtags?: string[];
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
  distance?: number;
  specifications?: any;
}

// ============================================================
// HELPER: CALCULATE DISTANCE
// ✅ Exported so it can be reused in FeedScreen and elsewhere
// ============================================================
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================
// TYPE GUARD FOR SPECIFICATIONS
// ============================================================
function isSpecificationsObject(specs: unknown): specs is Record<string, unknown> {
  return !!specs && typeof specs === 'object' && !Array.isArray(specs);
}

// ============================================================
// MAIN SERVICE
// ============================================================
export const feedService = {
  /**
   * Get opportunities with distance from user
   */
  getOpportunities: async (userLocation?: {
    latitude: number;
    longitude: number;
  }): Promise<Opportunity[]> => {
    try {
      console.log('🔄 Fetching opportunities from catalog...');

      const { data: catalogPosts, error: catalogError } = await supabase
        .from('catalog')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (catalogError) {
        console.error('❌ Error fetching catalog posts:', catalogError);
        return [];
      }

      if (!catalogPosts || catalogPosts.length === 0) {
        console.log('⚠️ No opportunities found in catalog');
        return [];
      }

      console.log(`✅ Found ${catalogPosts.length} opportunities in catalog`);

      // Get user info including location
      const userIds = catalogPosts
        .map((post) => post.user_id)
        .filter(
          (id): id is string => id !== null && id !== undefined && id !== ''
        );

      let userMap: Record<
        string,
        {
          full_name: string | null;
          avatar_url: string | null;
          latitude: number | null;
          longitude: number | null;
          phone_number: string | null;
        }
      > = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, latitude, longitude, phone_number')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ Error fetching users:', usersError);
        } else if (users) {
          users.forEach((user: any) => {
            userMap[user.id] = {
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              latitude: user.latitude || null,
              longitude: user.longitude || null,
              phone_number: user.phone_number || null,
            };
          });
          console.log(`👤 Found ${Object.keys(userMap).length} users`);
        }
      }

      // Get save counts and user's saved status
      let saveCounts: Record<string, { count: number; isSaved: boolean }> = {};

      try {
        const { data: saveData, error: saveError } = await supabase
          .from('saves')
          .select('post_id, user_id')
          .in(
            'post_id',
            catalogPosts.map((p: any) => p.id)
          );

        if (saveError) {
          console.error('❌ Error fetching saves:', saveError);
        } else if (saveData) {
          const saveMap: Record<string, { count: number; userSaved: boolean }> =
            {};
          const { data: authData } = await supabase.auth.getUser();
          const currentUserId = authData?.user?.id;

          saveData.forEach((s: any) => {
            if (!saveMap[s.post_id]) {
              saveMap[s.post_id] = { count: 0, userSaved: false };
            }
            saveMap[s.post_id].count++;
            if (s.user_id === currentUserId) {
              saveMap[s.post_id].userSaved = true;
            }
          });

          saveCounts = Object.keys(saveMap).reduce((acc, key) => {
            acc[key] = {
              count: saveMap[key].count,
              isSaved: saveMap[key].userSaved,
            };
            return acc;
          }, {} as Record<string, { count: number; isSaved: boolean }>);
        }
      } catch (e) {
        console.log('⚠️ Saves table may not exist yet:', e);
      }

      // ✅ NEW: Get comment counts per post from the `comments` table
      let commentCounts: Record<string, number> = {};

      try {
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .select('post_id')
          .in(
            'post_id',
            catalogPosts.map((p: any) => p.id)
          );

        if (commentError) {
          console.log('⚠️ Comments table may not exist yet:', commentError);
        } else if (commentData) {
          commentData.forEach((c: any) => {
            commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
          });
          console.log(
            `💬 Comment counts computed for ${Object.keys(commentCounts).length} posts`
          );
        }
      } catch (e) {
        console.log('⚠️ Comment fetch failed:', e);
      }

      // Build opportunities
      const opportunities: Opportunity[] = catalogPosts.map((post: any) => {
        const userInfo = post.user_id ? userMap[post.user_id] : null;
        const images = post.images || [];
        const saveInfo = saveCounts[post.id] || { count: 0, isSaved: false };

        // ✅ EXTRACT PRICE FROM SPECIFICATIONS with type safety
        let price = post.price || 0;
        let specifications = post.specifications || {};

        if (price === 0 && isSpecificationsObject(specifications)) {
          const specPrice =
            specifications.price || specifications.regular_price || null;
          if (specPrice !== null && specPrice !== undefined) {
            price =
              typeof specPrice === 'number'
                ? specPrice
                : parseFloat(String(specPrice));
            if (isNaN(price)) price = 0;
          }
        }

        // ✅ Calculate distance if user location and seller location available
        let distance = undefined;
        if (
          userLocation &&
          userInfo?.latitude !== null &&
          userInfo?.latitude !== undefined &&
          userInfo?.longitude !== null &&
          userInfo?.longitude !== undefined
        ) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            userInfo.latitude,
            userInfo.longitude
          );
        }

        if (__DEV__) {
          console.log(`📊 Raw post data for "${post.name}":`, {
            price: price,
            specifications: specifications,
            share_count: post.share_count,
            comment_count: post.comment_count,
            like_count: post.like_count,
            view_count: post.view_count,
            save_count: post.save_count,
            real_comment_count: commentCounts[post.id] || 0,
          });
        }

        return {
          id: post.id,
          title: post.name || 'Untitled',
          price: price,
          currency: 'UGX',
          imageUrl: images[0] || '',
          catalogImages: images,
          description: post.description || '',
          rating: null,
          reviewCount: null,
          area: post.location || null,
          inStock: true,
          category: post.category || null,
          type: 'product',
          createdAt: post.created_at || new Date().toISOString(),
          userId: post.user_id || '',
          userFullName: userInfo?.full_name || 'User',
          userAvatar: userInfo?.avatar_url || null,
          userLatitude: userInfo?.latitude || null,
          userLongitude: userInfo?.longitude || null,
          userPhone: userInfo?.phone_number || null,
          hashtags: post.tags || [],
          video: post.video || null,
          video_thumbnail: post.video_thumbnail || null,
          video_duration: post.video_duration || null,
          video_size: post.video_size || null,
          likeCount: post.like_count || 0,
          viewCount: post.view_count || 0,
          shareCount: post.share_count || 0,
          // ✅ Prefer the real comment count from the comments table
          commentCount: commentCounts[post.id] || post.comment_count || 0,
          saveCount: saveInfo.count || post.save_count || 0,
          isSaved: saveInfo.isSaved || false,
          distance: distance,
          specifications: specifications,
        };
      });

      // Log the mapped data
      if (__DEV__ && opportunities.length > 0) {
        console.log('📊 First opportunity mapped:', {
          title: opportunities[0].title,
          price: opportunities[0].price,
          specifications: opportunities[0].specifications,
          shareCount: opportunities[0].shareCount,
          commentCount: opportunities[0].commentCount,
          saveCount: opportunities[0].saveCount,
          distance: opportunities[0].distance,
          isSaved: opportunities[0].isSaved,
        });
      }

      // Sort by distance if available
      if (userLocation) {
        opportunities.sort((a, b) => {
          const distA = a.distance ?? Infinity;
          const distB = b.distance ?? Infinity;
          return distA - distB;
        });
      }

      console.log(`✅ Returning ${opportunities.length} opportunities`);
      return opportunities;
    } catch (error) {
      console.error('❌ Error in getOpportunities:', error);
      return [];
    }
  },

  /**
   * Increment share count
   */
  incrementShareCount: async (postId: string): Promise<boolean> => {
    try {
      const { data: post, error: fetchError } = await supabase
        .from('catalog')
        .select('share_count')
        .eq('id', postId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching share count:', fetchError);
        return false;
      }

      const currentCount = post?.share_count || 0;
      const newCount = currentCount + 1;

      const { error: updateError } = await supabase
        .from('catalog')
        .update({ share_count: newCount })
        .eq('id', postId);

      if (updateError) {
        console.error('❌ Error updating share count:', updateError);
        return false;
      }

      console.log(`✅ Share count updated from ${currentCount} to ${newCount}`);
      return true;
    } catch (error) {
      console.error('❌ Error incrementing share count:', error);
      return false;
    }
  },

  /**
   * Toggle save status
   */
  toggleSave: async (
    postId: string,
    userId: string
  ): Promise<{ saved: boolean; count: number }> => {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking save:', checkError);
        return { saved: false, count: 0 };
      }

      const { data: post } = await supabase
        .from('catalog')
        .select('save_count')
        .eq('id', postId)
        .single();

      let currentCount = post?.save_count || 0;

      if (existing) {
        const { error: deleteError } = await supabase
          .from('saves')
          .delete()
          .eq('id', existing.id);

        if (deleteError) {
          console.error('❌ Error unsaving:', deleteError);
          return { saved: false, count: currentCount };
        }

        const newCount = Math.max(0, currentCount - 1);
        await supabase
          .from('catalog')
          .update({ save_count: newCount })
          .eq('id', postId);

        return { saved: false, count: newCount };
      } else {
        const { error: insertError } = await supabase
          .from('saves')
          .insert({ user_id: userId, post_id: postId });

        if (insertError) {
          console.error('❌ Error saving:', insertError);
          return { saved: false, count: currentCount };
        }

        const newCount = currentCount + 1;
        await supabase
          .from('catalog')
          .update({ save_count: newCount })
          .eq('id', postId);

        return { saved: true, count: newCount };
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
      return { saved: false, count: 0 };
    }
  },

  /**
   * Check if user saved a post
   */
  isSaved: async (postId: string, userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking save status:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('❌ Error checking save status:', error);
      return false;
    }
  },

  /**
   * Get a single opportunity by ID
   */
  getOpportunityById: async (
    id: string,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<Opportunity | null> => {
    try {
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching opportunity:', error);
        return null;
      }

      if (!data) return null;
      if (!data.user_id) return null;

      const { data: userData } = await supabase
        .from('users')
        .select('full_name, avatar_url, latitude, longitude, phone_number')
        .eq('id', data.user_id)
        .single();

      const images = data.images || [];

      let price = data.price || 0;
      let specifications = data.specifications || {};

      if (price === 0 && isSpecificationsObject(specifications)) {
        const specPrice =
          specifications.price || specifications.regular_price || null;
        if (specPrice !== null && specPrice !== undefined) {
          price =
            typeof specPrice === 'number'
              ? specPrice
              : parseFloat(String(specPrice));
          if (isNaN(price)) price = 0;
        }
      }

      // ✅ Get comment count for this single post
      let commentCount = data.comment_count || 0;
      try {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', id);
        if (typeof count === 'number') {
          commentCount = count;
        }
      } catch (e) {
        // non-fatal
      }

      // ✅ Compute distance if possible
      let distance: number | undefined = undefined;
      if (
        userLocation &&
        userData?.latitude != null &&
        userData?.longitude != null
      ) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          userData.latitude,
          userData.longitude
        );
      }

      return {
        id: data.id,
        title: data.name || 'Untitled',
        price: price,
        currency: 'UGX',
        imageUrl: images[0] || '',
        catalogImages: images,
        description: data.description || '',
        rating: null,
        reviewCount: null,
        area: data.location || null,
        inStock: true,
        category: data.category || null,
        type: 'product',
        createdAt: data.created_at || new Date().toISOString(),
        userId: data.user_id || '',
        userFullName: userData?.full_name || 'User',
        userAvatar: userData?.avatar_url || null,
        userLatitude: userData?.latitude || null,
        userLongitude: userData?.longitude || null,
        userPhone: userData?.phone_number || null,
        hashtags: data.tags || [],
        video: data.video || null,
        video_thumbnail: data.video_thumbnail || null,
        video_duration: data.video_duration || null,
        video_size: data.video_size || null,
        likeCount: data.like_count || 0,
        viewCount: data.view_count || 0,
        shareCount: data.share_count || 0,
        commentCount: commentCount,
        saveCount: data.save_count || 0,
        isSaved: false,
        distance: distance,
        specifications: specifications,
      };
    } catch (error) {
      console.error('❌ Error in getOpportunityById:', error);
      return null;
    }
  },
};