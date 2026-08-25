// src/services/feed.service.ts

import { supabase } from '../lib/supabase';

// ============================================================
// TYPE DEFINITION
// ============================================================
export interface Opportunity {
  id: string;
  title: string;
  shopName: string;
  savedCount?: number;
  shareCount?: number;
  distance?: number;
  shopId: string;
  price: number;
  currency: string;
  imageUrl: string;
  catalogImages: string[];
  description: string;
  specifications: any;
  rating: number | null;
  topReview?: string;
  reviewCount: number | null;
  area: string | null;
  inStock: boolean;
  category: string | null;
  type: 'product' | 'service' | 'event';
  createdAt?: string;
  duration?: string | null;
  duration_minutes?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  shopLatitude?: number | null;
  shopLongitude?: number | null;
  shopLogo?: string | null;
  brand?: string | null;
  providerId?: string;
  providerName?: string;
  providerType?: 'individual' | 'institution';
}

// ============================================================
// HELPER: PLACEHOLDER IMAGE
// ============================================================
function getPlaceholderImage(category: string | null, title: string): string {
  const seed = encodeURIComponent(title);
  return `https://picsum.photos/seed/${seed}/400/600`;
}

// ============================================================
// HELPER: SAFELY FILTER NULL VALUES
// ============================================================
function filterNonNull<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((item): item is T => item !== null && item !== undefined);
}

// ============================================================
// HELPER: SHUFFLE ARRAY
// ============================================================
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================
// MOCK DATA (Fallback when Supabase fails)
// ============================================================
const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'mock_1',
    title: 'Samsung Galaxy A54',
    shopName: 'TechWorld Kampala',
    shopId: 'shop_mock_1',
    price: 850000,
    currency: 'UGX',
    imageUrl: getPlaceholderImage('electronics', 'Samsung Galaxy'),
    catalogImages: Array(5).fill(getPlaceholderImage('electronics', 'Samsung Galaxy')),
    description: 'Brand new Samsung Galaxy A54 with 5G, 128GB storage.',
    specifications: { model: 'A54', storage: '128GB', ram: '8GB' },
    rating: 4.8,
    reviewCount: 45,
    area: 'Kampala',
    inStock: true,
    category: 'electronics',
    type: 'product',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock_2',
    title: 'Phone Screen Repair',
    shopName: 'QuickFix Mobile',
    shopId: 'shop_mock_2',
    price: 75000,
    currency: 'UGX',
    imageUrl: getPlaceholderImage('services', 'Phone Repair'),
    catalogImages: Array(5).fill(getPlaceholderImage('services', 'Phone Repair')),
    description: 'Professional phone screen repair service. 1-hour turnaround.',
    specifications: { duration: '1 hour', warranty: '3 months' },
    rating: 4.5,
    reviewCount: 23,
    area: 'Jinja',
    inStock: true,
    category: 'services',
    type: 'service',
    createdAt: new Date().toISOString(),
    providerName: 'QuickFix Mobile',
    providerType: 'individual',
  },
];

function getMockOpportunities(): Opportunity[] {
  return MOCK_OPPORTUNITIES;
}

// ============================================================
// MAIN SERVICE
// ============================================================
export const feedService = {
  async getOpportunities(): Promise<Opportunity[]> {
    try {
      console.log('🔄 Fetching products AND services from Supabase...');

      // ============================================================
      // PART 1: FETCH PRODUCTS
      // ============================================================

      const { data: shopProducts, error: shopProductsError } = await supabase
        .from('shop_products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (shopProductsError) {
        console.error('❌ Error fetching shop products:', shopProductsError);
        return getMockOpportunities();
      }

      let catalogItems: any[] = [];
      let shops: any[] = [];
      const productOpportunities: Opportunity[] = [];

      if (shopProducts && shopProducts.length > 0) {
        console.log(`✅ Found ${shopProducts.length} shop products`);

        const catalogIds = filterNonNull(shopProducts.map(sp => sp.catalog_id));
        if (catalogIds.length > 0) {
          const { data, error } = await supabase
            .from('catalog')
            .select('*')
            .in('id', catalogIds);
          if (!error && data) catalogItems = data;
        }

        const shopIds = filterNonNull(shopProducts.map(sp => sp.shop_id));
        if (shopIds.length > 0) {
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .in('id', shopIds);
          if (!error && data) shops = data;
        }

        for (const sp of shopProducts) {
          const catalog = catalogItems.find(c => c.id === sp.catalog_id);
          const shop = shops.find(s => s.id === sp.shop_id);
          if (catalog && shop) {
            const catalogImages = catalog.images || [];
            productOpportunities.push({
              id: catalog.id,
              title: catalog.name || 'Product',
              shopName: shop.name || 'Shop',
              shopId: shop.id,
              price: sp.regular_price || 0,
              currency: 'UGX',
              imageUrl: catalogImages[0] || getPlaceholderImage(catalog.category, catalog.name),
              catalogImages: catalogImages,
              description: catalog.description || '',
              specifications: catalog.specifications || {},
              rating: shop.rating || null,
              reviewCount: shop.review_count || null,
              area: shop.area || null,
              inStock: sp.in_stock || false,
              category: catalog.category || null,
              type: 'product',
              createdAt: sp.created_at || new Date().toISOString(),
              brand: catalog.brand || null,
              shopLatitude: shop.latitude || null,
              shopLongitude: shop.longitude || null,
              shopLogo: shop.logo_url || null,
            });
          }
        }
        console.log(`📦 Found ${productOpportunities.length} products`);
      }

      // ============================================================
      // PART 2: FETCH SERVICES - FIXED WITHOUT TYPE RELATION
      // ============================================================

      // ✅ Step 1: Get provider services
      const { data: providerServices, error: providerServicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('is_active', true);

      let serviceOpportunities: Opportunity[] = [];

      if (providerServicesError) {
        console.error('❌ Error fetching provider services:', providerServicesError);
      } else if (providerServices && providerServices.length > 0) {
        console.log(`✅ Found ${providerServices.length} provider services`);

        // ✅ Step 2: Get all service catalog items from the provider services
        const serviceIds = filterNonNull(providerServices.map(ps => ps.service_id));
        
        let serviceCatalogItems: any[] = [];
        if (serviceIds.length > 0) {
          const { data, error } = await supabase
            .from('service_catalog')
            .select('*')
            .in('id', serviceIds);
          if (!error && data) {
            serviceCatalogItems = data;
            console.log(`📚 Found ${serviceCatalogItems.length} service catalog items`);
          } else {
            console.error('❌ Error fetching service catalog:', error);
          }
        }

        // ✅ Step 3: Get users for provider services
        const userIds = filterNonNull(providerServices.map(ps => ps.user_id));
        let users: any[] = [];
        if (userIds.length > 0) {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, phone_number')
            .in('id', userIds);
          if (!error && data) users = data;
        }

        // ✅ Step 4: Get institutions for provider services
        const institutionIds = filterNonNull(providerServices.map(ps => ps.institution_id));
        let institutions: any[] = [];
        if (institutionIds.length > 0) {
          const { data, error } = await supabase
            .from('institutions')
            .select('id, name, area, city, rating, review_count')
            .in('id', institutionIds);
          if (!error && data) institutions = data;
        }

        // ✅ Step 5: Build service opportunities
        for (const ps of providerServices) {
          // Find the service catalog item
          const service = serviceCatalogItems.find(s => s.id === ps.service_id);
          if (!service) {
            console.warn(`⚠️ No service catalog found for service_id: ${ps.service_id}`);
            continue;
          }

          let providerName = 'Service Provider';
          let providerId = ps.user_id || ps.institution_id || 'unknown';
          let providerType: 'individual' | 'institution' = 'individual';
          let providerRating = null;
          let providerReviewCount = null;
          let providerArea = null;

          // Check if linked to institution
          if (ps.institution_id) {
            const inst = institutions.find(i => i.id === ps.institution_id);
            if (inst) {
              providerName = inst.name || 'Institution';
              providerType = 'institution';
              providerRating = inst.rating;
              providerReviewCount = inst.review_count;
              providerArea = inst.area || inst.city;
              console.log(`🏢 Institution service: ${service.name} by ${providerName}`);
            }
          } 
          // Check if linked to user
          else if (ps.user_id) {
            const user = users.find(u => u.id === ps.user_id);
            if (user) {
              providerName = user.full_name || 'Service Provider';
              providerType = 'individual';
              console.log(`👤 User service: ${service.name} by ${providerName}`);
            } else {
              console.warn(`⚠️ No user found for user_id: ${ps.user_id}`);
            }
          }

          const serviceImages = service.images || [];
          const serviceSpecs = service.specifications || {};

          serviceOpportunities.push({
            id: service.id,
            title: service.name || 'Service',
            shopName: providerName,
            shopId: providerId,
            price: ps.price || 0,
            currency: 'UGX',
            imageUrl: serviceImages[0] || getPlaceholderImage(service.category, service.name),
            catalogImages: serviceImages,
            description: service.description || '',
            specifications: serviceSpecs,
            rating: providerRating || null,
            reviewCount: providerReviewCount || null,
            area: providerArea || null,
            inStock: ps.is_active || false,
            category: service.category || null,
            type: 'service',
            createdAt: ps.created_at || new Date().toISOString(),
            duration: service.duration || null,
            duration_minutes: service.duration_minutes || null,
            providerId: providerId,
            providerName: providerName,
            providerType: providerType,
          });
        }
        console.log(`🔧 Found ${serviceOpportunities.length} services`);
      }

      // ============================================================
      // PART 3: COMBINE AND RETURN
      // ============================================================

      const allOpportunities = [...productOpportunities, ...serviceOpportunities];
      const shuffled = shuffleArray(allOpportunities);

      if (shuffled.length === 0) {
        console.log('⚠️ No opportunities found, using mock data');
        return getMockOpportunities();
      }

      console.log(`✅ Returning ${shuffled.length} total opportunities`);
      console.log(`   📦 Products: ${productOpportunities.length}`);
      console.log(`   🔧 Services: ${serviceOpportunities.length}`);

      return shuffled;

    } catch (error) {
      console.error('❌ Error in getOpportunities:', error);
      return getMockOpportunities();
    }
  },

  async getOpportunitiesByCategory(categoryId: string): Promise<Opportunity[]> {
    const all = await this.getOpportunities();
    return all.filter(opp => opp.category === categoryId);
  },

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    const all = await this.getOpportunities();
    return all.find(opp => opp.id === id) || null;
  },

  async getProductsOnly(): Promise<Opportunity[]> {
    const all = await this.getOpportunities();
    return all.filter(opp => opp.type === 'product');
  },

  async getServicesOnly(): Promise<Opportunity[]> {
    const all = await this.getOpportunities();
    return all.filter(opp => opp.type === 'service');
  },

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    const all = await this.getOpportunities();
    const lowerQuery = query.toLowerCase();
    return all.filter(opp =>
      opp.title.toLowerCase().includes(lowerQuery) ||
      opp.description.toLowerCase().includes(lowerQuery) ||
      opp.category?.toLowerCase().includes(lowerQuery)
    );
  },

  getMockOpportunities,
};