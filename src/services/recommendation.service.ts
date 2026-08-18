// src/services/recommendation.service.ts

import { supabase } from '../lib/supabase';
import { Opportunity } from './feed.service';
import { locationService, UserLocation } from './location.service';
import { mapItemType } from '../utils/typeHelpers';

export interface UserPreferences {
  categories: string[];
  priceRange: { min: number; max: number };
  preferredTypes: ('product' | 'service')[];
  viewedItems: string[];
  savedItems: string[];
  location: UserLocation | null;
  area: string | null;
}

// Type assertion to bypass type checking for now
const supabaseAny = supabase as any;

export const recommendationService = {
  // ============================================================
  // TRACK USER INTERACTION - FIXED TO CHECK BOTH TABLES
  // ============================================================
  async trackInteraction(
    userId: string,
    itemId: string,
    action: 'view' | 'save' | 'share' | 'purchase',
    itemType?: string
  ): Promise<void> {
    try {
      const mappedType = mapItemType(itemType);
      console.log(`📊 Tracking ${action} for user ${userId} on item ${itemId}`);

      // Check if user exists
      const { data: user, error: userError } = await supabaseAny
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user) {
        console.warn(`⚠️ User ${userId} not found, skipping tracking`);
        return;
      }

      // ✅ Check if item exists in catalog OR service_catalog
      let itemExists = false;
      let finalItemType = mappedType;

      // First check catalog (products)
      const { data: catalogItem, error: catalogError } = await supabaseAny
        .from('catalog')
        .select('id')
        .eq('id', itemId)
        .maybeSingle();

      if (catalogItem) {
        itemExists = true;
        finalItemType = 'product';
      } else {
        // If not in catalog, check service_catalog (services)
        const { data: serviceItem, error: serviceError } = await supabaseAny
          .from('service_catalog')
          .select('id')
          .eq('id', itemId)
          .maybeSingle();

        if (serviceItem) {
          itemExists = true;
          finalItemType = 'service';
        }
      }

      if (!itemExists) {
        console.warn(`⚠️ Item ${itemId} not found in catalog or service_catalog, skipping tracking`);
        return;
      }

      // Check if interaction already exists
      const { data: existing, error: findError } = await supabaseAny
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('action', action)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding interaction:', findError);
        return;
      }

      if (existing) {
        // Update existing interaction
        const { error: updateError } = await supabaseAny
          .from('user_interactions')
          .update({
            time_spent: (existing.time_spent || 0) + 1,
            metadata: {
              ...existing.metadata,
              count: (existing.metadata?.count || 0) + 1,
              last_interaction: new Date().toISOString()
            }
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating interaction:', updateError);
        } else {
          console.log(`✅ ${action} updated for ${itemId}`);
        }
      } else {
        // Insert new interaction
        const insertData = {
          user_id: userId,
          item_id: itemId,
          action: action,
          item_type: finalItemType,
          time_spent: 0,
          metadata: {
            count: 1,
            first_interaction: new Date().toISOString(),
            last_interaction: new Date().toISOString(),
            original_type: itemType || 'unknown'
          },
          created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabaseAny
          .from('user_interactions')
          .insert(insertData);

        if (insertError) {
          console.error('Error inserting interaction:', insertError);
        } else {
          console.log(`✅ ${action} tracked for ${itemId}`);
        }
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  },

  // ============================================================
  // GET USER PREFERENCES
  // ============================================================
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data: interactions, error } = await supabaseAny
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching interactions:', error);
        return null;
      }

      if (!interactions || interactions.length === 0) {
        return null;
      }

      const savedItems = interactions
        .filter((i: any) => i.action === 'save')
        .map((i: any) => i.item_id);

      const viewedItems = interactions
        .filter((i: any) => i.action === 'view')
        .map((i: any) => i.item_id);

      // Get user location
      const { data: user } = await supabaseAny
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let location: UserLocation | null = null;
      if (user) {
        location = {
          latitude: 0,
          longitude: 0,
          city: user.location_city || null,
          region: user.location_region || null,
          country: user.location_country || null,
          formattedAddress: null,
        };
      }

      // Get categories from viewed items - check both catalog and service_catalog
      let categories: string[] = [];
      if (viewedItems.length > 0) {
        // Check catalog first
        const { data: catalogItems } = await supabaseAny
          .from('catalog')
          .select('category')
          .in('id', viewedItems.slice(0, 20));

        // Also check service_catalog
        const { data: serviceItems } = await supabaseAny
          .from('service_catalog')
          .select('category')
          .in('id', viewedItems.slice(0, 20));

        const allItems = [...(catalogItems || []), ...(serviceItems || [])];
        
        if (allItems.length > 0) {
          const categoryCounts: Record<string, number> = {};
          allItems.forEach((item: any) => {
            if (item.category) {
              categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            }
          });
          categories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat]) => cat);
        }
      }

      // Determine preferred types
      const typeCounts: Record<string, number> = {};
      interactions.forEach((i: any) => {
        const type = i.item_type || 'product';
        const mappedType = type === 'product' ? 'product' : 'service';
        typeCounts[mappedType] = (typeCounts[mappedType] || 0) + 1;
      });
      const preferredTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type]) => type as 'product' | 'service');

      return {
        categories,
        priceRange: { min: 0, max: 1000000 },
        preferredTypes: preferredTypes.length > 0 ? preferredTypes : ['product', 'service'],
        viewedItems,
        savedItems,
        location,
        area: user?.location_city || null,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  },

  // ============================================================
  // GET PERSONALIZED RECOMMENDATIONS
  // ============================================================
  async getPersonalizedRecommendations(
    opportunities: Opportunity[],
    userId: string,
    userLocation?: UserLocation | null
  ): Promise<Opportunity[]> {
    const preferences = await this.getUserPreferences(userId);
    const location = userLocation || locationService.getCachedLocation();

    if (!preferences || preferences.viewedItems.length === 0) {
      return this.getNewUserRecommendations(opportunities, location);
    }

    // Separate products and services
    const products = opportunities.filter(opp => opp.type === 'product');
    const services = opportunities.filter(opp => opp.type === 'service' || opp.type === 'event');

    // Score products
    const scoredProducts = products.map((opp) => {
      let score = this.calculateScore(opp, preferences, location);
      return { ...opp, score };
    });

    // Score services
    const scoredServices = services.map((opp) => {
      let score = this.calculateScore(opp, preferences, location);
      return { ...opp, score };
    });

    // Sort each group by score
    scoredProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    scoredServices.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    // ✅ MIX PRODUCTS AND SERVICES
    const mixedResults: any[] = [];
    const maxLength = Math.max(scoredProducts.length, scoredServices.length);
    
    // Interleave products and services
    for (let i = 0; i < maxLength; i++) {
      if (i < scoredProducts.length) {
        mixedResults.push(scoredProducts[i]);
      }
      if (i < scoredServices.length) {
        mixedResults.push(scoredServices[i]);
      }
    }

    // ✅ Return ALL items, not just top ones
    const unique = Array.from(new Map(mixedResults.map((item: any) => [item.id, item])).values());

    // Shuffle slightly to add variety while keeping high scores on top
    const shuffled = this.shuffleArray(unique);
    const finalResult = shuffled.sort((a: any, b: any) => {
      if (Math.abs((a.score || 0) - (b.score || 0)) < 15) {
        return Math.random() - 0.5;
      }
      return (b.score || 0) - (a.score || 0);
    });

    console.log(`📊 Returning ${finalResult.length} personalized opportunities (${finalResult.filter((o: any) => o.type === 'product').length} products, ${finalResult.filter((o: any) => o.type === 'service' || o.type === 'event').length} services)`);

    return finalResult;
  },

  // ============================================================
  // CALCULATE SCORE (Extracted for reuse)
  // ============================================================
  calculateScore(opp: Opportunity, preferences: UserPreferences, location: UserLocation | null): number {
    let score = 0;

    // 1. Category match (30% weight)
    if (preferences.categories.length > 0) {
      if (preferences.categories.includes(opp.category || '')) {
        score += 30;
      } else {
        score += 5;
      }
    } else {
      score += 15;
    }

    // 2. Price match (20% weight)
    if (opp.price >= preferences.priceRange.min && opp.price <= preferences.priceRange.max) {
      score += 20;
    } else {
      const priceRatio = opp.price / preferences.priceRange.max;
      if (priceRatio <= 1.5) {
        score += 10;
      } else if (opp.price < preferences.priceRange.min) {
        score += 8;
      }
    }

    // 3. Type match (15% weight)
    const mappedType = opp.type === 'product' ? 'product' : 'service';
    if (preferences.preferredTypes.includes(mappedType)) {
      score += 15;
    } else {
      score += 5;
    }

    // 4. New items (15% weight)
    const daysOld = opp.createdAt
      ? (Date.now() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    if (daysOld < 7) {
      score += 15;
    } else if (daysOld < 14) {
      score += 10;
    } else {
      score += 5;
    }

    // 5. Not viewed before (10% weight)
    if (!preferences.viewedItems.includes(opp.id)) {
      score += 10;
    } else {
      const viewCount = preferences.viewedItems.filter((id: string) => id === opp.id).length;
      if (viewCount < 3) {
        score += 3;
      }
    }

    // 6. Not saved before (5% weight)
    if (!preferences.savedItems.includes(opp.id)) {
      score += 5;
    }

    // 7. Rating bonus (5% weight)
    if (opp.rating && opp.rating > 4.0) {
      score += 5;
    } else if (opp.rating && opp.rating > 3.0) {
      score += 2;
    }

    // 8. Location bonus (10% weight)
    if (location && location.city) {
      if (opp.area && opp.area.toLowerCase().includes(location.city.toLowerCase())) {
        score += 10;
      } else {
        score += 3;
      }
    } else if (preferences.area && opp.area) {
      if (opp.area.toLowerCase().includes(preferences.area.toLowerCase())) {
        score += 10;
      }
    }

    // Guarantee minimum score
    const minScore = 5 + (opp.rating ? opp.rating * 2 : 0);
    score = Math.max(score, minScore);

    return score;
  },

  // ============================================================
  // GET NEW USER RECOMMENDATIONS
  // ============================================================
  getNewUserRecommendations(
    opportunities: Opportunity[],
    userLocation?: UserLocation | null
  ): Opportunity[] {
    const shuffled = this.shuffleArray([...opportunities]);
    const location = userLocation || locationService.getCachedLocation();

    // Separate products and services
    const products = shuffled.filter(opp => opp.type === 'product');
    const services = shuffled.filter(opp => opp.type === 'service' || opp.type === 'event');

    // Score products
    const scoredProducts = products.map((opp) => {
      let score = this.calculateNewUserScore(opp, location);
      return { ...opp, score };
    });

    // Score services
    const scoredServices = services.map((opp) => {
      let score = this.calculateNewUserScore(opp, location);
      return { ...opp, score };
    });

    // Sort each group by score
    scoredProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    scoredServices.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    // ✅ MIX PRODUCTS AND SERVICES
    const mixedResults: any[] = [];
    const maxLength = Math.max(scoredProducts.length, scoredServices.length);
    
    // Interleave products and services
    for (let i = 0; i < maxLength; i++) {
      if (i < scoredProducts.length) {
        mixedResults.push(scoredProducts[i]);
      }
      if (i < scoredServices.length) {
        mixedResults.push(scoredServices[i]);
      }
    }

    // ✅ Return ALL items
    const unique = Array.from(new Map(mixedResults.map((item: any) => [item.id, item])).values());

    // Shuffle slightly to add variety
    const shuffledResult = this.shuffleArray(unique);
    const finalResult = shuffledResult.sort((a: any, b: any) => {
      if (Math.abs((a.score || 0) - (b.score || 0)) < 15) {
        return Math.random() - 0.5;
      }
      return (b.score || 0) - (a.score || 0);
    });

    console.log(`📊 Returning ${finalResult.length} new user recommendations (${finalResult.filter((o: any) => o.type === 'product').length} products, ${finalResult.filter((o: any) => o.type === 'service' || o.type === 'event').length} services)`);

    return finalResult;
  },

  // ============================================================
  // CALCULATE NEW USER SCORE (Extracted for reuse)
  // ============================================================
  calculateNewUserScore(opp: Opportunity, location: UserLocation | null): number {
    let score = 0;

    // 1. Location bonus (30% weight)
    if (location?.city && opp.area) {
      if (opp.area.toLowerCase().includes(location.city.toLowerCase())) {
        score += 30;
      } else {
        score += 10;
      }
    } else {
      score += 15;
    }

    // 2. New items bonus (25% weight)
    const daysOld = opp.createdAt
      ? (Date.now() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    if (daysOld < 7) {
      score += 25;
    } else if (daysOld < 14) {
      score += 15;
    } else {
      score += 5;
    }

    // 3. Rating bonus (20% weight)
    if (opp.rating && opp.rating > 4.5) {
      score += 20;
    } else if (opp.rating && opp.rating > 4.0) {
      score += 15;
    } else if (opp.rating && opp.rating > 3.0) {
      score += 10;
    } else {
      score += 5;
    }

    // 4. In-stock bonus (15% weight)
    if (opp.inStock !== false) {
      score += 15;
    }

    // 5. Image bonus (10% weight)
    if (opp.imageUrl) {
      score += 10;
    }

    // Guarantee minimum score
    const minScore = 10;
    score = Math.max(score, minScore);

    return score;
  },

  // ============================================================
  // GET USER'S SAVED ITEMS
  // ============================================================
  async getUserSavedItems(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseAny
        .from('user_interactions')
        .select('item_id')
        .eq('user_id', userId)
        .eq('action', 'save');

      if (error) {
        console.error('Error fetching saved items:', error);
        return [];
      }

      return data?.map((item: any) => item.item_id) || [];
    } catch (error) {
      console.error('Error getting saved items:', error);
      return [];
    }
  },

  // ============================================================
  // UTILITY: SHUFFLE ARRAY
  // ============================================================
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
};