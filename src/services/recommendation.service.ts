// src/services/recommendation.service.ts

import { supabase } from '../lib/supabase';
import { Opportunity } from './feed.service';

export interface UserPreferences {
  categories: string[];
  priceRange: { min: number; max: number };
  preferredTypes: ('product' | 'service')[];
  viewedItems: string[];
  savedItems: string[];
  area: string | null;
}

export const recommendationService = {
  // Track user interaction
  async trackInteraction(userId: string, itemId: string, action: 'view' | 'save' | 'share' | 'purchase'): Promise<void> {
    try {
      // Use 'as any' to bypass TypeScript type checking
      const { data: existing } = await supabase
        .from('user_interactions' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('action', action)
        .maybeSingle();

      if (existing) {
        // Update the existing interaction with a new timestamp
        await supabase
          .from('user_interactions' as any)
          .update({ 
            updated_at: new Date().toISOString(),
            count: (existing as any).count ? (existing as any).count + 1 : 1
          })
          .eq('id', (existing as any).id);
      } else {
        // Insert new interaction
        await supabase
          .from('user_interactions' as any)
          .insert({
            user_id: userId,
            item_id: itemId,
            action: action,
            created_at: new Date().toISOString(),
            count: 1,
          });
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  },

  // Get user preferences from interactions
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Get user's interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_interactions' as any)
        .select('*')
        .eq('user_id', userId);

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError);
        return null;
      }

      if (!interactions || interactions.length === 0) {
        return null;
      }

      // Type assertion for interactions
      const typedInteractions = interactions as any[];

      // Get user's saved items (items with 'save' action)
      const savedItems = typedInteractions
        .filter((i: any) => i.action === 'save')
        .map((i: any) => i.item_id);

      // Get user's viewed items
      const viewedItems = typedInteractions
        .filter((i: any) => i.action === 'view')
        .map((i: any) => i.item_id);

      // Get user's location from profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('full_name, phone_number')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
      }

      // Try to determine preferred categories from viewed items
      let categories: string[] = [];
      if (viewedItems.length > 0) {
        // Get categories of viewed items from catalog
        const { data: items } = await supabase
          .from('catalog')
          .select('category')
          .in('id', viewedItems.slice(0, 20));

        if (items) {
          const categoryCounts: Record<string, number> = {};
          items.forEach((item: any) => {
            if (item.category) {
              categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            }
          });
          // Get top 3 categories
          categories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat]) => cat);
        }
      }

      // Determine preferred types
      const typeCounts: Record<string, number> = {};
      typedInteractions.forEach((i: any) => {
        // Default to product if we can't determine
        const type = 'product' as 'product' | 'service';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const preferredTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type]) => type as 'product' | 'service');

      return {
        categories: categories,
        priceRange: { min: 0, max: 1000000 },
        preferredTypes: preferredTypes.length > 0 ? preferredTypes : ['product', 'service'],
        viewedItems: viewedItems,
        savedItems: savedItems,
        area: null,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  },

  // Get personalized recommendations
  async getPersonalizedRecommendations(
    opportunities: Opportunity[],
    userId: string
  ): Promise<Opportunity[]> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences || preferences.viewedItems.length === 0) {
      // New user - return shuffled with discovery focus
      return this.getNewUserRecommendations(opportunities);
    }

    // Score each opportunity based on user preferences
    const scored = opportunities.map(opp => {
      let score = 0;
      
      // 1. Category match (30% weight)
      if (preferences.categories.includes(opp.category || '')) {
        score += 30;
      }
      
      // 2. Price match (20% weight)
      if (opp.price >= preferences.priceRange.min && opp.price <= preferences.priceRange.max) {
        score += 20;
      }
      
      // 3. Type match (15% weight)
      // Fix: Only check if type is 'product' or 'service'
      if (opp.type === 'product' || opp.type === 'service') {
        if (preferences.preferredTypes.includes(opp.type)) {
          score += 15;
        }
      }
      
      // 4. New items (15% weight)
      const daysOld = opp.createdAt ? 
        (Date.now() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 30;
      if (daysOld < 7) {
        score += 15;
      }
      
      // 5. Not viewed before (10% weight)
      if (!preferences.viewedItems.includes(opp.id)) {
        score += 10;
      }
      
      // 6. Not saved before (5% weight)
      if (!preferences.savedItems.includes(opp.id)) {
        score += 5;
      }
      
      // 7. Rating bonus (5% weight)
      if (opp.rating && opp.rating > 4.0) {
        score += 5;
      }
      
      // 8. Location bonus (additional if same area)
      if (preferences.area && opp.area && opp.area.includes(preferences.area)) {
        score += 10;
      }
      
      return { ...opp, score };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Return top scored with some randomness (mix in some new items)
    const topCount = Math.min(scored.length, 50);
    const topScored = scored.slice(0, topCount);
    
    // Mix in some random items for discovery (30% exploration)
    const remaining = scored.slice(topCount);
    const randomCount = Math.min(remaining.length, Math.floor(topCount * 0.3));
    const randomItems = shuffleArray(remaining).slice(0, randomCount);
    
    const result = [...topScored, ...randomItems];
    
    // Shuffle final result and remove duplicates
    const unique = Array.from(new Map(result.map(item => [item.id, item])).values());
    return shuffleArray(unique);
  },

  // New user recommendations
  getNewUserRecommendations(opportunities: Opportunity[]): Opportunity[] {
    // Shuffle all opportunities
    const shuffled = shuffleArray([...opportunities]);
    
    // 30% local, 50% new, 20% featured (highly rated)
    const local = shuffled.filter(o => 
      o.area && (o.area.includes('Jinja') || o.area.includes('Kampala') || o.area.includes('Entebbe'))
    );
    const newItems = shuffled.filter(o => {
      const daysOld = o.createdAt ? 
        (Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 30;
      return daysOld < 7;
    });
    const featured = shuffled.filter(o => o.rating && o.rating > 4.5);

    // Take 30% local, 50% new, 20% featured
    const totalCount = Math.min(shuffled.length, 50);
    const localCount = Math.floor(totalCount * 0.3);
    const newCount = Math.floor(totalCount * 0.5);
    const featuredCount = Math.floor(totalCount * 0.2);

    const result = [
      ...local.slice(0, localCount),
      ...newItems.slice(0, newCount),
      ...featured.slice(0, featuredCount),
    ];

    // Remove duplicates and shuffle
    const unique = Array.from(new Map(result.map(item => [item.id, item])).values());
    return shuffleArray(unique);
  },

  // Get trending items
  async getTrendingItems(limit: number = 10): Promise<string[]> {
    try {
      // Get items with most interactions in the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('user_interactions' as any)
        .select('item_id, count')
        .gte('created_at', weekAgo.toISOString())
        .order('count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trending:', error);
        return [];
      }

      const typedData = data as any[];
      return typedData?.map((item: any) => item.item_id) || [];
    } catch (error) {
      console.error('Error getting trending:', error);
      return [];
    }
  },

  // Get user's saved items
  async getUserSavedItems(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_interactions' as any)
        .select('item_id')
        .eq('user_id', userId)
        .eq('action', 'save');

      if (error) {
        console.error('Error fetching saved items:', error);
        return [];
      }

      const typedData = data as any[];
      return typedData?.map((item: any) => item.item_id) || [];
    } catch (error) {
      console.error('Error getting saved items:', error);
      return [];
    }
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}