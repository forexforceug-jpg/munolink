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
  purchasedItems: string[];
  bookedItems: string[];
  sharedItems: string[];
  location: UserLocation | null;
  area: string | null;
  viewIntensity: Record<string, number>;
}

const supabaseAny = supabase as any;

export const recommendationService = {
  // ============================================================
  // TRACK USER INTERACTION
  // ============================================================
  async trackInteraction(
    userId: string,
    itemId: string,
    action: 'view' | 'save' | 'share' | 'purchase' | 'booking' | 'unsave',
    itemType?: string,
    timeSpent?: number
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

      // Check if item exists
      let itemExists = false;
      let finalItemType = mappedType;

      const { data: catalogItem } = await supabaseAny
        .from('catalog')
        .select('id')
        .eq('id', itemId)
        .maybeSingle();

      if (catalogItem) {
        itemExists = true;
        finalItemType = 'product';
      } else {
        const { data: serviceItem } = await supabaseAny
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
        console.warn(`⚠️ Item ${itemId} not found, skipping tracking`);
        return;
      }

      // Check if interaction exists
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
        const currentCount = existing.metadata?.count || 0;
        const currentTimeSpent = existing.time_spent || 0;
        
        const { error: updateError } = await supabaseAny
          .from('user_interactions')
          .update({
            time_spent: currentTimeSpent + (timeSpent || 0),
            metadata: {
              ...existing.metadata,
              count: currentCount + 1,
              last_interaction: new Date().toISOString(),
              intensity: this.calculateIntensity(action, currentCount + 1),
              time_spent_total: currentTimeSpent + (timeSpent || 0),
            }
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating interaction:', updateError);
        }
      } else {
        const insertData = {
          user_id: userId,
          item_id: itemId,
          action: action,
          item_type: finalItemType,
          time_spent: timeSpent || 0,
          metadata: {
            count: 1,
            first_interaction: new Date().toISOString(),
            last_interaction: new Date().toISOString(),
            original_type: itemType || 'unknown',
            intensity: this.getActionWeight(action),
            time_spent_total: timeSpent || 0,
          },
          created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabaseAny
          .from('user_interactions')
          .insert(insertData);

        if (insertError) {
          console.error('Error inserting interaction:', insertError);
        }
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  },

  // ============================================================
  // CALCULATE INTENSITY
  // ============================================================
  getActionWeight(action: string): number {
    const weights = {
      'purchase': 10.0,
      'booking': 9.0,
      'save': 5.0,
      'share': 4.0,
      'view': 1.0,
    };
    return weights[action as keyof typeof weights] || 1.0;
  },

  calculateIntensity(action: string, count: number): number {
    const baseWeight = this.getActionWeight(action);
    if (action === 'view') {
      // ✅ FIXED: Cap at 5 instead of 3 so > 3 logic works
      return Math.min(baseWeight * Math.log2(count + 1), 5.0);
    }
    return Math.min(baseWeight + (count - 1) * 0.5, 10.0);
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

      // Extract all actions with proper counts
      const savedItems = interactions
        .filter((i: any) => i.action === 'save')
        .map((i: any) => i.item_id);

      // ✅ FIXED: Get view counts from metadata, not rows
      const viewedItems: string[] = [];
      const viewIntensity: Record<string, number> = {};
      const viewCounts: Record<string, number> = {};

      interactions
        .filter((i: any) => i.action === 'view')
        .forEach((i: any) => {
          const count = i.metadata?.count || 1;
          const intensity = i.metadata?.intensity || 1;
          
          viewedItems.push(i.item_id);
          viewIntensity[i.item_id] = Math.max(viewIntensity[i.item_id] || 0, intensity);
          viewCounts[i.item_id] = Math.max(viewCounts[i.item_id] || 0, count);
        });

      const purchasedItems = interactions
        .filter((i: any) => i.action === 'purchase')
        .map((i: any) => i.item_id);

      const bookedItems = interactions
        .filter((i: any) => i.action === 'booking')
        .map((i: any) => i.item_id);

      const sharedItems = interactions
        .filter((i: any) => i.action === 'share')
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

      // Get categories from viewed items
      let categories: string[] = [];
      if (viewedItems.length > 0) {
        const { data: catalogItems } = await supabaseAny
          .from('catalog')
          .select('category')
          .in('id', viewedItems.slice(0, 20));

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
        purchasedItems,
        bookedItems,
        sharedItems,
        location,
        area: user?.location_city || null,
        viewIntensity,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  },

  // ============================================================
  // GET PERSONALIZED RECOMMENDATIONS - WITH PROPER MIXING
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
    const products = opportunities.filter((opp: Opportunity) => opp.type === 'product');
    const services = opportunities.filter((opp: Opportunity) => opp.type === 'service' || opp.type === 'event');

    // Score products
    const scoredProducts = products.map((opp: Opportunity) => {
      const score = this.calculateScoreImproved(opp, preferences, location);
      return { ...opp, score };
    });

    // Score services
    const scoredServices = services.map((opp: Opportunity) => {
      const score = this.calculateScoreImproved(opp, preferences, location);
      return { ...opp, score };
    });

    // Sort each group by score
    scoredProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    scoredServices.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    // ============================================================
    // ✅ PROPER MIXING - Interleave products and services
    // ============================================================
    const mixedResults: any[] = [];
    
    // Calculate the ratio of products to services in the total pool
    const totalProducts = scoredProducts.length;
    const totalServices = scoredServices.length;
    const totalItems = totalProducts + totalServices;
    
    // If no items, return empty
    if (totalItems === 0) return [];
    
    // Calculate target percentages
    const productPercentage = totalProducts / totalItems;
    const servicePercentage = totalServices / totalItems;
    
    // Determine how many of each to take (up to 50 total)
    const targetCount = Math.min(totalItems, 50);
    const targetProducts = Math.round(targetCount * productPercentage);
    const targetServices = targetCount - targetProducts;
    
    // Take the top items from each group
    const topProducts = scoredProducts.slice(0, targetProducts);
    const topServices = scoredServices.slice(0, targetServices);
    
    // Interleave them evenly
    const maxLen = Math.max(topProducts.length, topServices.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (i < topProducts.length) {
        mixedResults.push(topProducts[i]);
      }
      if (i < topServices.length) {
        mixedResults.push(topServices[i]);
      }
    }
    
    // ✅ EXPLORATION: Replace 10-20% with random items from the bottom
    const explorationRate = 0.15; // 15% exploration
    const explorationCount = Math.floor(mixedResults.length * explorationRate);
    
    if (explorationCount > 0) {
      // Get items from the bottom of each list
      const bottomProducts = scoredProducts.slice(targetProducts);
      const bottomServices = scoredServices.slice(targetServices);
      const bottomAll = [...bottomProducts, ...bottomServices];
      
      // Shuffle and pick some for exploration
      const shuffledExploration = this.shuffleArray(bottomAll);
      const explorationItems = shuffledExploration.slice(0, explorationCount);
      
      // Replace the last N items with exploration items
      for (let i = 0; i < explorationItems.length; i++) {
        const index = mixedResults.length - 1 - i;
        if (index >= 0) {
          mixedResults[index] = explorationItems[i];
        }
      }
    }

    // Remove duplicates
    const unique = Array.from(new Map(mixedResults.map((item: any) => [item.id, item])).values());

    const productCount = unique.filter((o: any) => o.type === 'product').length;
    const serviceCount = unique.filter((o: any) => o.type === 'service' || o.type === 'event').length;

    console.log(`📊 Returning ${unique.length} personalized opportunities (${productCount} products, ${serviceCount} services)`);

    return unique;
  },

  // ============================================================
  // CALCULATE SCORE - IMPROVED
  // ============================================================
  calculateScoreImproved(opp: Opportunity, preferences: UserPreferences, location: UserLocation | null): number {
    let score = 0;

    // 1. Category match (25% weight)
    const categoryWeight = 25;
    if (preferences.categories.length > 0) {
      const categoryMatch = preferences.categories.some((cat: string) => 
        opp.category?.toLowerCase().includes(cat.toLowerCase())
      );
      score += categoryMatch ? categoryWeight : categoryWeight * 0.2;
    } else {
      score += categoryWeight * 0.5;
    }

    // 2. Price match (20% weight)
    const priceWeight = 20;
    if (opp.price >= preferences.priceRange.min && opp.price <= preferences.priceRange.max) {
      score += priceWeight;
    } else {
      const priceRatio = opp.price / preferences.priceRange.max;
      if (priceRatio <= 1.5) {
        score += priceWeight * 0.5;
      } else if (opp.price < preferences.priceRange.min) {
        score += priceWeight * 0.4;
      }
    }

    // 3. Type match (10% weight)
    const typeWeight = 10;
    const mappedType = opp.type === 'product' ? 'product' : 'service';
    if (preferences.preferredTypes.includes(mappedType)) {
      score += typeWeight;
    } else {
      score += typeWeight * 0.3;
    }

    // 4. Behavioral relevance (20% weight)
    const behaviorWeight = 20;
    let behaviorScore = 0;
    
    // ✅ FIXED: Use metadata.count for true view count
    const isSaved = preferences.savedItems.includes(opp.id);
    const isPurchased = preferences.purchasedItems?.includes(opp.id) || false;
    const isBooked = preferences.bookedItems?.includes(opp.id) || false;
    const isShared = preferences.sharedItems?.includes(opp.id) || false;
    const intensity = preferences.viewIntensity?.[opp.id] || 0;

    if (isPurchased || isBooked) {
      behaviorScore = behaviorWeight * 1.2;
    } else if (isShared) {
      behaviorScore = behaviorWeight * 0.9;
    } else if (isSaved) {
      behaviorScore = behaviorWeight * 0.8;
    } else if (intensity > 0) {
      // ✅ FIXED: Use intensity directly (now capped at 5)
      if (intensity >= 4) {
        behaviorScore = behaviorWeight * 0.8;
      } else if (intensity >= 3) {
        behaviorScore = behaviorWeight * 0.6;
      } else if (intensity >= 2) {
        behaviorScore = behaviorWeight * 0.4;
      } else {
        behaviorScore = behaviorWeight * 0.2;
      }
    } else {
      behaviorScore = behaviorWeight * 0.1;
    }
    score += Math.min(behaviorScore, behaviorWeight);

    // 5. Freshness (10% weight)
    const freshnessWeight = 10;
    const daysOld = opp.createdAt
      ? (Date.now() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    if (daysOld < 2) {
      score += freshnessWeight;
    } else if (daysOld < 7) {
      score += freshnessWeight * 0.8;
    } else if (daysOld < 14) {
      score += freshnessWeight * 0.5;
    } else {
      score += freshnessWeight * 0.2;
    }

    // 6. Rating/Quality (10% weight)
    const ratingWeight = 10;
    if (opp.rating && opp.rating > 4.5) {
      score += ratingWeight;
    } else if (opp.rating && opp.rating > 4.0) {
      score += ratingWeight * 0.8;
    } else if (opp.rating && opp.rating > 3.0) {
      score += ratingWeight * 0.5;
    } else if (opp.rating && opp.rating > 0) {
      score += ratingWeight * 0.3;
    } else {
      score += ratingWeight * 0.2;
    }

    // 7. Location bonus (5% weight)
    const locationWeight = 5;
    if (location?.city && opp.area) {
      if (opp.area.toLowerCase().includes(location.city.toLowerCase())) {
        score += locationWeight;
      } else {
        score += locationWeight * 0.4;
      }
    } else if (preferences.area && opp.area) {
      if (opp.area.toLowerCase().includes(preferences.area.toLowerCase())) {
        score += locationWeight;
      }
    }

    return Math.min(Math.round(score), 100);
  },

  // ============================================================
  // GET NEW USER RECOMMENDATIONS - WITH PROPER MIXING
  // ============================================================
  getNewUserRecommendations(
    opportunities: Opportunity[],
    userLocation?: UserLocation | null
  ): Opportunity[] {
    const shuffled = this.shuffleArray([...opportunities]);
    const location = userLocation || locationService.getCachedLocation();

    // Separate products and services
    const products = shuffled.filter((opp: Opportunity) => opp.type === 'product');
    const services = shuffled.filter((opp: Opportunity) => opp.type === 'service' || opp.type === 'event');

    // Score products
    const scoredProducts = products.map((opp: Opportunity) => {
      let score = this.calculateNewUserScoreImproved(opp, location);
      return { ...opp, score };
    });

    // Score services
    const scoredServices = services.map((opp: Opportunity) => {
      let score = this.calculateNewUserScoreImproved(opp, location);
      return { ...opp, score };
    });

    // Sort each group by score
    scoredProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    scoredServices.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    // ✅ PROPER MIXING for new users
    const mixedResults: any[] = [];
    
    const totalProducts = scoredProducts.length;
    const totalServices = scoredServices.length;
    const totalItems = totalProducts + totalServices;
    
    if (totalItems === 0) return [];
    
    // Calculate target percentages
    const productPercentage = totalProducts / totalItems;
    const servicePercentage = totalServices / totalItems;
    
    const targetCount = Math.min(totalItems, 30);
    const targetProducts = Math.round(targetCount * productPercentage);
    const targetServices = targetCount - targetProducts;
    
    const topProducts = scoredProducts.slice(0, targetProducts);
    const topServices = scoredServices.slice(0, targetServices);
    
    // Interleave
    const maxLen = Math.max(topProducts.length, topServices.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (i < topProducts.length) {
        mixedResults.push(topProducts[i]);
      }
      if (i < topServices.length) {
        mixedResults.push(topServices[i]);
      }
    }

    const unique = Array.from(new Map(mixedResults.map((item: any) => [item.id, item])).values());

    const productCount = unique.filter((o: any) => o.type === 'product').length;
    const serviceCount = unique.filter((o: any) => o.type === 'service' || o.type === 'event').length;

    console.log(`📊 Returning ${unique.length} new user recommendations (${productCount} products, ${serviceCount} services)`);

    return unique;
  },

  // ============================================================
  // CALCULATE NEW USER SCORE
  // ============================================================
  calculateNewUserScoreImproved(opp: Opportunity, location: UserLocation | null): number {
    let score = 0;

    const locationWeight = 25;
    if (location?.city && opp.area) {
      if (opp.area.toLowerCase().includes(location.city.toLowerCase())) {
        score += locationWeight;
      } else {
        score += locationWeight * 0.4;
      }
    } else {
      score += locationWeight * 0.3;
    }

    const freshnessWeight = 20;
    const daysOld = opp.createdAt
      ? (Date.now() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    if (daysOld < 2) {
      score += freshnessWeight;
    } else if (daysOld < 7) {
      score += freshnessWeight * 0.8;
    } else if (daysOld < 14) {
      score += freshnessWeight * 0.5;
    } else {
      score += freshnessWeight * 0.2;
    }

    const ratingWeight = 20;
    if (opp.rating && opp.rating > 4.5) {
      score += ratingWeight;
    } else if (opp.rating && opp.rating > 4.0) {
      score += ratingWeight * 0.8;
    } else if (opp.rating && opp.rating > 3.0) {
      score += ratingWeight * 0.5;
    } else {
      score += ratingWeight * 0.2;
    }

    const stockWeight = 20;
    if (opp.inStock !== false) {
      score += stockWeight;
    } else {
      score += stockWeight * 0.1;
    }

    const imageWeight = 15;
    if (opp.imageUrl) {
      score += imageWeight;
    } else {
      score += imageWeight * 0.2;
    }

    return Math.min(Math.round(score), 100);
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