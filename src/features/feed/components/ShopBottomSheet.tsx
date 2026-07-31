import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { supabase } from '../../../lib/supabase';

interface ShopBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  shopId: string;
  onClose: () => void;
}

interface ShopData {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  area: string | null;
  rating: number | null;
  review_count: number | null;
  discount_percentage: number | null;
}

interface ShopProduct {
  id: string;
  name: string;
  regular_price: number;
  images: string[];
}

export const ShopBottomSheet: React.FC<ShopBottomSheetProps> = ({
  bottomSheetRef,
  shopId,
  onClose,
}) => {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShopData = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      // Fetch shop details
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, name, logo_url, description, area, rating, review_count, discount_percentage')
        .eq('id', shopId)
        .single();

      if (shopError) {
        console.error('Shop fetch error:', shopError);
        throw shopError;
      }
      
      if (shopData) {
        setShop({
          id: shopData.id,
          name: shopData.name,
          logo_url: shopData.logo_url || null,
          description: shopData.description || null,
          area: shopData.area || null,
          rating: shopData.rating || null,
          review_count: shopData.review_count || null,
          discount_percentage: shopData.discount_percentage || null,
        });
      }

      // Fetch shop products - simplified query without nested joins
      const { data: productData, error: productError } = await supabase
        .from('shop_products')
        .select('catalog_id, regular_price')
        .eq('shop_id', shopId)
        .eq('in_stock', true)
        .limit(10);

      if (productError) {
        console.error('Products fetch error:', productError);
        throw productError;
      }

      // Fetch catalog items separately
      if (productData && productData.length > 0) {
        const catalogIds = productData.map(p => p.catalog_id).filter(Boolean);
        const { data: catalogData, error: catalogError } = await supabase
          .from('catalog')
          .select('id, name, images')
          .in('id', catalogIds);

        if (catalogError) {
          console.error('Catalog fetch error:', catalogError);
          throw catalogError;
        }

        const formattedProducts = productData.map((item: any) => {
          const catalog = catalogData?.find(c => c.id === item.catalog_id);
          return {
            id: item.catalog_id,
            name: catalog?.name || 'Product',
            regular_price: item.regular_price,
            images: catalog?.images || [],
          };
        });

        setProducts(formattedProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // Don't render if no bottomSheetRef
  if (!bottomSheetRef) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['50%', '85%']}
      onDismiss={onClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A7DFF" />
            <Text style={styles.loadingText}>Loading shop...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Shop Header */}
            <View style={styles.shopHeader}>
              {shop?.logo_url ? (
                <Image source={{ uri: shop.logo_url }} style={styles.shopLogo} />
              ) : (
                <View style={styles.shopLogoPlaceholder}>
                  <Text style={styles.shopLogoText}>🏪</Text>
                </View>
              )}
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shop?.name || 'Shop'}</Text>
                {shop?.area && (
                  <Text style={styles.shopArea}>📍 {shop.area}</Text>
                )}
                <View style={styles.shopStats}>
                  {shop?.rating && (
                    <Text style={styles.shopRating}>⭐ {shop.rating.toFixed(1)}</Text>
                  )}
                  {shop?.review_count && (
                    <Text style={styles.shopReviews}>({shop.review_count} reviews)</Text>
                  )}
                </View>
              </View>
            </View>

            {shop?.description && (
              <Text style={styles.shopDescription}>{shop.description}</Text>
            )}

            {shop?.discount_percentage && shop.discount_percentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  🎉 {shop.discount_percentage}% off
                </Text>
              </View>
            )}

            {/* Products */}
            {products.length > 0 && (
              <>
                <Text style={styles.productsTitle}>Products from this shop</Text>
                <View style={styles.productsGrid}>
                  {products.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      onPress={() => {
                        console.log('Product pressed:', product.name);
                      }}
                    >
                      {product.images && product.images.length > 0 ? (
                        <Image 
                          source={{ uri: product.images[0] }} 
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.productImagePlaceholder}>
                          <Text style={styles.productImageText}>📦</Text>
                        </View>
                      )}
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productPrice}>
                        UGX {product.regular_price.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#1A2A4F',
  },
  handleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  shopLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  shopLogoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopLogoText: {
    fontSize: 32,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  shopArea: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 2,
  },
  shopStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  shopRating: {
    color: '#F1C40F',
    fontSize: 14,
  },
  shopReviews: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  shopDescription: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  discountBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: '600',
  },
  productsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageText: {
    fontSize: 32,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 8,
  },
  productPrice: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});