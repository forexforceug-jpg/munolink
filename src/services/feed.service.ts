import { supabase } from '../lib/supabase';

// Type for an opportunity card
export interface Opportunity {
  id: string;
  title: string;
  shopName: string;
  shopId: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
  specifications: any;
  rating: number | null;
  reviewCount: number | null;
  area: string | null;
  inStock: boolean;
  category: string | null;
}

export const feedService = {
  // Fetch all opportunities - Using a simpler query approach
  async getOpportunities(): Promise<Opportunity[]> {
    try {
      // Step 1: Get all shop products with their shop info
      const { data: shopProducts, error: shopProductsError } = await supabase
        .from('shop_products')
        .select(`
          id,
          regular_price,
          in_stock,
          catalog_id,
          shop_id,
          created_at
        `)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (shopProductsError) {
        console.error('Error fetching shop products:', shopProductsError);
        throw shopProductsError;
      }

      if (!shopProducts || shopProducts.length === 0) {
        console.log('No shop products found');
        return [];
      }

      // Step 2: Get all catalog items
      const catalogIds = shopProducts.map(sp => sp.catalog_id).filter(Boolean);
      const { data: catalogItems, error: catalogError } = await supabase
        .from('catalog')
        .select('*')
        .in('id', catalogIds)
        .eq('is_active', true);

      if (catalogError) {
        console.error('Error fetching catalog:', catalogError);
        throw catalogError;
      }

      // Step 3: Get all shops
      const shopIds = shopProducts.map(sp => sp.shop_id).filter(Boolean);
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .in('id', shopIds);

      if (shopsError) {
        console.error('Error fetching shops:', shopsError);
        throw shopsError;
      }

      // Step 4: Combine the data
      const opportunities: Opportunity[] = [];

      for (const sp of shopProducts) {
        const catalog = catalogItems?.find(c => c.id === sp.catalog_id);
        const shop = shops?.find(s => s.id === sp.shop_id);

        if (catalog && shop) {
          opportunities.push({
            id: catalog.id,
            title: catalog.name || 'Product',
            shopName: shop.name || 'Shop',
            shopId: shop.id,
            price: sp.regular_price || 0,
            currency: 'UGX',
            imageUrl: catalog.images?.[0] || 'https://via.placeholder.com/400x800/1F2F5F/FFFFFF?text=No+Image',
            description: catalog.description || '',
            specifications: catalog.specifications || {},
            rating: shop.rating || null,
            reviewCount: shop.review_count || null,
            area: shop.area || null,
            inStock: sp.in_stock || false,
            category: catalog.category || null,
          });
        }
      }

      console.log(`✅ Found ${opportunities.length} opportunities`);
      return opportunities;
    } catch (error) {
      console.error('Error in getOpportunities:', error);
      throw error;
    }
  },

  // Get opportunities by category
  async getOpportunitiesByCategory(categoryId: string): Promise<Opportunity[]> {
    try {
      // Get all shop products
      const { data: shopProducts, error: shopProductsError } = await supabase
        .from('shop_products')
        .select(`
          id,
          regular_price,
          in_stock,
          catalog_id,
          shop_id,
          created_at
        `)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (shopProductsError) {
        console.error('Error fetching shop products:', shopProductsError);
        throw shopProductsError;
      }

      if (!shopProducts || shopProducts.length === 0) {
        return [];
      }

      // Get catalog items filtered by category
      const catalogIds = shopProducts.map(sp => sp.catalog_id).filter(Boolean);
      const { data: catalogItems, error: catalogError } = await supabase
        .from('catalog')
        .select('*')
        .in('id', catalogIds)
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (catalogError) {
        console.error('Error fetching catalog by category:', catalogError);
        throw catalogError;
      }

      // Get all shops
      const shopIds = shopProducts.map(sp => sp.shop_id).filter(Boolean);
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .in('id', shopIds);

      if (shopsError) {
        console.error('Error fetching shops:', shopsError);
        throw shopsError;
      }

      // Combine data
      const opportunities: Opportunity[] = [];

      for (const sp of shopProducts) {
        const catalog = catalogItems?.find(c => c.id === sp.catalog_id);
        const shop = shops?.find(s => s.id === sp.shop_id);

        if (catalog && shop) {
          opportunities.push({
            id: catalog.id,
            title: catalog.name || 'Product',
            shopName: shop.name || 'Shop',
            shopId: shop.id,
            price: sp.regular_price || 0,
            currency: 'UGX',
            imageUrl: catalog.images?.[0] || 'https://via.placeholder.com/400x800/1F2F5F/FFFFFF?text=No+Image',
            description: catalog.description || '',
            specifications: catalog.specifications || {},
            rating: shop.rating || null,
            reviewCount: shop.review_count || null,
            area: shop.area || null,
            inStock: sp.in_stock || false,
            category: catalog.category || null,
          });
        }
      }

      return opportunities;
    } catch (error) {
      console.error('Error in getOpportunitiesByCategory:', error);
      throw error;
    }
  },

  // Get a single opportunity by ID
  async getOpportunityById(id: string): Promise<Opportunity | null> {
    const opportunities = await this.getOpportunities();
    return opportunities.find(opp => opp.id === id) || null;
  },
};