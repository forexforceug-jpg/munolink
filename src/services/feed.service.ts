import { supabase } from '../lib/supabase';

// ============================================================
// TYPE DEFINITION
// ============================================================
export interface Opportunity {
  id: string;
  title: string;
  shopName: string;
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
  distance?: string;
  category: string | null;
  type: 'product' | 'service' | 'event';
  createdAt?: string;
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
      // PART 1: FETCH PRODUCTS (Multiple queries - works without foreign keys)
      // ============================================================

      // Step 1: Get shop products
      const { data: shopProducts, error: shopProductsError } = await supabase
        .from('shop_products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (shopProductsError) {
        console.error('❌ Error fetching shop products:', shopProductsError);
        return getMockOpportunities();
      }

      if (!shopProducts || shopProducts.length === 0) {
        console.log('⚠️ No shop products found, using mock data');
        return getMockOpportunities();
      }

      console.log(`✅ Found ${shopProducts.length} shop products`);

      // Step 2: Get catalog items (product details)
      const catalogIds = filterNonNull(shopProducts.map(sp => sp.catalog_id));
      
      let catalogItems: any[] = [];
      if (catalogIds.length > 0) {
        const { data, error } = await supabase
          .from('catalog')
          .select('*')
          .in('id', catalogIds);

        if (!error && data) {
          catalogItems = data;
          console.log(`✅ Found ${catalogItems.length} catalog items`);
        }
      }

      // Step 3: Get shops (business details)
      const shopIds = filterNonNull(shopProducts.map(sp => sp.shop_id));
      
      let shops: any[] = [];
      if (shopIds.length > 0) {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .in('id', shopIds);

        if (!error && data) {
          shops = data;
          console.log(`✅ Found ${shops.length} shops`);
        }
      }

      // Step 4: Combine into Product Opportunities
      const productOpportunities: Opportunity[] = [];

      for (const sp of shopProducts) {
        const catalog = catalogItems.find(c => c.id === sp.catalog_id);
        const shop = shops.find(s => s.id === sp.shop_id);

        if (catalog && shop) {
          const catalogImages = catalog.images || [];
          const imageUrl = catalogImages[0] || getPlaceholderImage(catalog.category, catalog.name);

          productOpportunities.push({
            id: catalog.id,
            title: catalog.name || 'Product',
            shopName: shop.name || 'Shop',
            shopId: shop.id,
            price: sp.regular_price || 0,
            currency: 'UGX',
            imageUrl: imageUrl,
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
          });
        }
      }

      console.log(`📦 Found ${productOpportunities.length} products`);

      // ============================================================
      // PART 2: FETCH SERVICES (Multiple queries)
      // ============================================================

      // Step 1: Get provider services
      const { data: providerServices, error: providerServicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('is_active', true);

      if (providerServicesError) {
        console.error('❌ Error fetching provider services:', providerServicesError);
        // Continue with just products if services fail
      }

      let serviceOpportunities: Opportunity[] = [];

      if (providerServices && providerServices.length > 0) {
        console.log(`✅ Found ${providerServices.length} provider services`);

        // Step 2: Get service catalog (service details)
        const serviceCatalogIds = filterNonNull(providerServices.map(ps => ps.service_id));
        
        let serviceCatalogItems: any[] = [];
        if (serviceCatalogIds.length > 0) {
          const { data, error } = await supabase
            .from('service_catalog')
            .select('*')
            .in('id', serviceCatalogIds);

          if (!error && data) {
            serviceCatalogItems = data;
            console.log(`✅ Found ${serviceCatalogItems.length} service catalog items`);
          }
        }

        // Step 3: Get institutions (organizations offering services)
        const institutionIds = filterNonNull(providerServices.map(ps => ps.institution_id));
        
        let institutions: any[] = [];
        if (institutionIds.length > 0) {
          const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .in('id', institutionIds);

          if (!error && data) {
            institutions = data;
            console.log(`✅ Found ${institutions.length} institutions`);
          }
        }

        // Step 4: Combine into Service Opportunities
        for (const ps of providerServices) {
          const service = serviceCatalogItems.find(s => s.id === ps.service_id);
          const institution = institutions.find(i => i.id === ps.institution_id);

          if (service && institution) {
            const serviceImages = service.images || [];
            const imageUrl = serviceImages[0] || getPlaceholderImage(service.category, service.name);

            serviceOpportunities.push({
              id: service.id,
              title: service.name || 'Service',
              shopName: institution.name || 'Provider',
              shopId: institution.id,
              price: ps.price || 0,
              currency: 'UGX',
              imageUrl: imageUrl,
              catalogImages: serviceImages,
              description: service.description || '',
              specifications: service.specifications || {},
              rating: institution.rating || null,
              reviewCount: institution.review_count || null,
              area: institution.area || null,
              inStock: true,
              category: service.category || null,
              type: 'service',
              createdAt: ps.created_at || new Date().toISOString(),
            });
          }
        }

        console.log(`🔧 Found ${serviceOpportunities.length} services`);
      }

      // ============================================================
      // PART 3: COMBINE AND RETURN
      // ============================================================

      const allOpportunities = [...productOpportunities, ...serviceOpportunities];

      allOpportunities.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      if (allOpportunities.length === 0) {
        console.log('⚠️ No opportunities found, using mock data');
        return getMockOpportunities();
      }

      console.log(`✅ Returning ${allOpportunities.length} total opportunities from database`);
      console.log(`   📦 Products: ${productOpportunities.length}`);
      console.log(`   🔧 Services: ${serviceOpportunities.length}`);

      return allOpportunities;

    } catch (error) {
      console.error('❌ Error in getOpportunities:', error);
      console.log('📝 Using mock data due to error');
      return getMockOpportunities();
    }
  },

  // ============================================================
  // OTHER METHODS
  // ============================================================

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