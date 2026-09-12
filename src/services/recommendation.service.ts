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

      const { data: user, error: userError } = await supabaseAny
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user) {
        console.warn(`⚠️ User ${userId} not found, skipping tracking`);
        return;
      }

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
      return Math.min(baseWeight * Math.log2(count + 1), 5.0);
    }
    return Math.min(baseWeight + (count - 1) * 0.5, 10.0);
  },

  // ============================================================
  // SAVE USER LOCATION
  // ============================================================
  async saveUserLocation(
    userId: string,
    location: UserLocation | null,
    locationLabel: string
  ): Promise<void> {
    try {
      if (!userId || !location) return;

      const { error } = await supabaseAny
        .from('users')
        .update({
          location_city: location.city || null,
          location_region: location.region || null,
          location_country: location.country || null,
          location_label: locationLabel || null,
          location_lat: location.latitude || null,
          location_lng: location.longitude || null,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error saving user location:', error);
      } else {
        console.log(`✅ Saved location for user ${userId}: ${locationLabel}`);
      }
    } catch (error) {
      console.error('Error in saveUserLocation:', error);
    }
  },

  // ============================================================
  // GET USER'S SAVED LOCATION
  // ============================================================
  async getUserLocation(userId: string): Promise<{ location: UserLocation | null; label: string | null }> {
    try {
      const { data, error } = await supabaseAny
        .from('users')
        .select('location_city, location_region, location_country, location_label, location_lat, location_lng')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return { location: null, label: null };
      }

      if (data.location_lat && data.location_lng) {
        const location: UserLocation = {
          latitude: data.location_lat,
          longitude: data.location_lng,
          city: data.location_city || null,
          region: data.location_region || null,
          country: data.location_country || null,
          formattedAddress: data.location_label || null,
        };
        return { location, label: data.location_label || null };
      }

      return { location: null, label: null };
    } catch (error) {
      console.error('Error getting user location:', error);
      return { location: null, label: null };
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

      // Get user location from saved preferences
      const { location, label } = await this.getUserLocation(userId);

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
        area: location?.city || null,
        viewIntensity,
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
    const location = userLocation || preferences?.location || locationService.getCachedLocation();

    if (!preferences || preferences.viewedItems.length === 0) {
      return this.getNewUserRecommendations(opportunities, location);
    }

    const products = opportunities.filter((opp: Opportunity) => opp.type === 'product');
    const services = opportunities.filter((opp: Opportunity) => opp.type === 'service' || opp.type === 'event');

    const scoredProducts = products.map((opp: Opportunity) => {
      const score = this.calculateScoreImproved(opp, preferences, location);
      return { ...opp, score };
    });

    const scoredServices = services.map((opp: Opportunity) => {
      const score = this.calculateScoreImproved(opp, preferences, location);
      return { ...opp, score };
    });

    scoredProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    scoredServices.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    const mixedResults: any[] = [];
    
    const totalProducts = scoredProducts.length;
    const totalServices = scoredServices.length;
    const totalItems = totalProducts + totalServices;
    
    if (totalItems === 0) return [];
    
    const productPercentage = totalProducts / totalItems;
    const servicePercentage = totalServices / totalItems;
    
    const targetCount = Math.min(totalItems, 50);
    const targetProducts = Math.round(targetCount * productPercentage);
    const targetServices = targetCount - targetProducts;
    
    const topProducts = scoredProducts.slice(0, targetProducts);
    const topServices = scoredServices.slice(0, targetServices);
    
    const maxLen = Math.max(topProducts.length, topServices.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (i < topProducts.length) {
        mixedResults.push(topProducts[i]);
      }
      if (i < topServices.length) {
        mixedResults.push(topServices[i]);
      }
    }
    
    const explorationRate = 0.15;
    const explorationCount = Math.floor(mixedResults.length * explorationRate);
    
    if (explorationCount > 0) {
      const bottomProducts = scoredProducts.slice(targetProducts);
      const bottomServices = scoredServices.slice(targetServices);
      const bottomAll = [...bottomProducts, ...bottomServices];
      
      const shuffledExploration = this.shuffleArray(bottomAll);
      const explorationItems = shuffledExploration.slice(0, explorationCount);
      
      for (let i = 0; i < explorationItems.length; i++) {
        const index = mixedResults.length - 1 - i;
        if (index >= 0) {
          mixedResults[index] = explorationItems[i];
        }
      }
    }

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

    // 7. Location bonus (5% weight) - USES EXACT LOCATION
    const locationWeight = 5;
    let locationScore = 0;

    const effectiveLocation = location || preferences.location;

    if (effectiveLocation?.city && opp.area) {
      const cityLower = effectiveLocation.city.toLowerCase().trim();
      const areaLower = opp.area.toLowerCase().trim();
      
      // ✅ Exact match or partial match
      if (areaLower.includes(cityLower) || cityLower.includes(areaLower)) {
        locationScore = locationWeight; // Full bonus
      } else {
        // Check for partial matches (e.g., "Kampala" matches "Kampala Central")
        const cityParts = cityLower.split(' ');
        let hasPartialMatch = false;
        for (const part of cityParts) {
          if (part.length > 2 && areaLower.includes(part)) {
            hasPartialMatch = true;
            break;
          }
        }
        locationScore = hasPartialMatch ? locationWeight * 0.7 : locationWeight * 0.3;
      }
    } else if (preferences.area && opp.area) {
      const prefAreaLower = preferences.area.toLowerCase().trim();
      const areaLower = opp.area.toLowerCase().trim();
      
      if (areaLower.includes(prefAreaLower) || prefAreaLower.includes(areaLower)) {
        locationScore = locationWeight * 0.8;
      } else {
        locationScore = locationWeight * 0.3;
      }
    } else {
      locationScore = locationWeight * 0.2;
    }

    score += locationScore;

    return Math.min(Math.round(score), 100);
  },

  // ============================================================
  // GET LOCATION-BASED RECOMMENDATIONS
  // ============================================================
  async getLocationBasedRecommendations(
    opportunities: Opportunity[],
    location: UserLocation | null,
    userId?: string
  ): Promise<Opportunity[]> {
    if (!location) {
      if (userId) {
        return await this.getPersonalizedRecommendations(opportunities, userId);
      }
      return this.getNewUserRecommendations(opportunities);
    }

    console.log(`📍 Getting location-based recommendations for: ${location.city || location.formattedAddress}`);

    // Score each opportunity based on location
    const scored = opportunities.map((opp) => {
      let score = 0;
      
      // Location match scoring (max 100 points)
      if (opp.area) {
        const areaLower = opp.area.toLowerCase();
        const cityLower = location.city?.toLowerCase() || '';
        const regionLower = location.region?.toLowerCase() || '';
        const countryLower = location.country?.toLowerCase() || '';
        
        // ✅ Exact city match (highest priority)
        if (cityLower && areaLower.includes(cityLower)) {
          score += 50;
        } 
        // ✅ Region match
        else if (regionLower && areaLower.includes(regionLower)) {
          score += 30;
        }
        // ✅ Country match (default)
        else if (countryLower && areaLower.includes(countryLower)) {
          score += 15;
        }
        // ✅ Partial match (e.g., "Kampala" matches "Kampala Central")
        else if (cityLower) {
          const cityParts = cityLower.split(' ');
          let hasPartial = false;
          for (const part of cityParts) {
            if (part.length > 2 && areaLower.includes(part)) {
              hasPartial = true;
              break;
            }
          }
          if (hasPartial) score += 25;
        }
      }
      
      // Add freshness bonus
      if (opp.createdAt) {
        const daysOld = (Date.now() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += 20;
        else if (daysOld < 14) score += 10;
        else if (daysOld < 30) score += 5;
      }
      
      // Add rating bonus
      if (opp.rating && opp.rating > 4.5) score += 20;
      else if (opp.rating && opp.rating > 4.0) score += 15;
      else if (opp.rating && opp.rating > 3.0) score += 10;
      
      // Add stock bonus
      if (opp.inStock !== false) score += 10;
      
      return { ...opp, score };
    });

    // Sort by score
    scored.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    
    // Mix products and services
    const products = scored.filter((o: any) => o.type === 'product');
    const services = scored.filter((o: any) => o.type === 'service' || o.type === 'event');
    
    const mixedResults: any[] = [];
    const maxLen = Math.max(products.length, services.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (i < products.length) mixedResults.push(products[i]);
      if (i < services.length) mixedResults.push(services[i]);
    }
    
    // Add some exploration items (10%)
    const explorationCount = Math.min(Math.floor(mixedResults.length * 0.1), 5);
    if (explorationCount > 0) {
      const bottomItems = scored.slice(Math.min(scored.length, 20));
      const shuffledBottom = this.shuffleArray(bottomItems);
      for (let i = 0; i < Math.min(explorationCount, shuffledBottom.length); i++) {
        const idx = mixedResults.length - 1 - i;
        if (idx >= 0) {
          mixedResults[idx] = shuffledBottom[i];
        }
      }
    }

    const unique = Array.from(new Map(mixedResults.map((item: any) => [item.id, item])).values());

    const productCount = unique.filter((o: any) => o.type === 'product').length;
    const serviceCount = unique.filter((o: any) => o.type === 'service' || o.type === 'event').length;

    console.log(`📍 Returning ${unique.length} location-based opportunities (${productCount} products, ${serviceCount} services)`);

    return unique;
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

    const products = shuffled.filter((opp: Opportunity) => opp.type === 'product');
    const services = shuffled.filter((opp: Opportunity) => opp.type === 'service' || opp.type === 'event');

    const scoredProducts = products.map((opp: Opportunity) => {
      let score = this.calculateNewUserScoreImproved(opp, location);
      return { ...opp, score };
    });

    const scoredServices = services.map((opp: Opportunity) => {
      let score = this.calculateNewUserScoreImproved(opp, location);
      return { ...opp, score };
    });

    scoredProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    scoredServices.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    const mixedResults: any[] = [];
    
    const totalProducts = scoredProducts.length;
    const totalServices = scoredServices.length;
    const totalItems = totalProducts + totalServices;
    
    if (totalItems === 0) return [];
    
    const productPercentage = totalProducts / totalItems;
    const servicePercentage = totalServices / totalItems;
    
    const targetCount = Math.min(totalItems, 30);
    const targetProducts = Math.round(targetCount * productPercentage);
    const targetServices = targetCount - targetProducts;
    
    const topProducts = scoredProducts.slice(0, targetProducts);
    const topServices = scoredServices.slice(0, targetServices);
    
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
  // CALCULATE NEW USER SCORE - IMPROVED
  // ============================================================
  calculateNewUserScoreImproved(opp: Opportunity, location: UserLocation | null): number {
    let score = 0;

    // Location weight (25%) - USES EXACT LOCATION
    const locationWeight = 25;
    let locationScore = 0;

    if (location?.city && opp.area) {
      const cityLower = location.city.toLowerCase().trim();
      const areaLower = opp.area.toLowerCase().trim();
      
      if (areaLower.includes(cityLower) || cityLower.includes(areaLower)) {
        locationScore = locationWeight;
      } else {
        const cityParts = cityLower.split(' ');
        let hasPartialMatch = false;
        for (const part of cityParts) {
          if (part.length > 2 && areaLower.includes(part)) {
            hasPartialMatch = true;
            break;
          }
        }
        locationScore = hasPartialMatch ? locationWeight * 0.7 : locationWeight * 0.3;
      }
    } else {
      locationScore = locationWeight * 0.2;
    }

    score += locationScore;

    // Freshness (20%)
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

    // Rating (20%)
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

    // Stock (20%)
    const stockWeight = 20;
    if (opp.inStock !== false) {
      score += stockWeight;
    } else {
      score += stockWeight * 0.1;
    }

    // Image (15%)
    const imageWeight = 15;
    if (opp.imageUrl) {
      score += imageWeight;
    } else {
      score += imageWeight * 0.2;
    }

    return Math.min(Math.round(score), 100);
  },

  // ============================================================
  // FILTER OPPORTUNITIES BY LOCATION
  // ============================================================
  filterByLocation(
    opportunities: Opportunity[],
    location: UserLocation | null,
    radiusKm: number = 50
  ): Opportunity[] {
    if (!location) return opportunities;

    return opportunities.filter((opp) => {
      if (!opp.area) return true;
      
      const areaLower = opp.area.toLowerCase();
      const cityLower = location.city?.toLowerCase() || '';
      
      if (cityLower) {
        return areaLower.includes(cityLower) || cityLower.includes(areaLower);
      }
      
      const regionLower = location.region?.toLowerCase() || '';
      const countryLower = location.country?.toLowerCase() || '';
      
      if (regionLower) {
        return areaLower.includes(regionLower);
      }
      
      if (countryLower) {
        return areaLower.includes(countryLower);
      }
      
      return true;
    });
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