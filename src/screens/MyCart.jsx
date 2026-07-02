import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MyCart({ navigation }) {
  const [promoCode, setPromoCode] = useState('');

  const cartItems = [
    {
      id: 1,
      name: 'Paracetamol 500mg',
      pack: '10 tablets',
      shop: 'QuickMart Pharmacy',
      distance: '0.4 km',
      regularPrice: 3000,
      munolinkPrice: 2700,
      discount: 10,
      quantity: 2,
    },
    {
      id: 2,
      name: 'Fresh Milk 500ml',
      pack: '1 bottle',
      shop: 'Fresh Mart',
      distance: '1.2 km',
      regularPrice: 3500,
      munolinkPrice: 2800,
      discount: 20,
      quantity: 1,
    },
    {
      id: 3,
      name: 'Cough Syrup 100ml',
      pack: '1 bottle',
      shop: 'QuickMart Pharmacy',
      distance: '0.4 km',
      regularPrice: 8000,
      munolinkPrice: 7200,
      discount: 10,
      quantity: 1,
    },
  ];

  const [items, setItems] = useState(cartItems);

  const updateQuantity = (id, change) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.regularPrice * item.quantity,
    0
  );
  const munolinkTotal = items.reduce(
    (sum, item) => sum + item.munolinkPrice * item.quantity,
    0
  );
  const totalSavings = subtotal - munolinkTotal;
  const serviceFee = 500;
  const finalTotal = munolinkTotal + serviceFee;

  const recommendations = [
    { name: 'Vitamin C', price: '12,000', oldPrice: '15,000' },
    { name: 'Bandages', price: '2,000', oldPrice: '2,500' },
    { name: 'Hand Sanitizer', price: '15,000', oldPrice: '18,000' },
    { name: 'First Aid Kit', price: '25,000', oldPrice: '30,000' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View>
            <Text style={styles.logo}>MUNOLINK</Text>
            <Text style={styles.tagline}>Your partner, linked.</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>My Cart</Text>
            <Text style={styles.pageSubtitle}>Items selected before payment</Text>
          </View>
          <View style={styles.cartSummary}>
            <Text style={styles.cartItemCount}>{items.length} items</Text>
            <Text style={styles.cartTotal}>UGX {munolinkTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Location & Payment Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoLeft}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={20} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Pickup Location</Text>
              <Text style={styles.infoValue}>Nile Avenue, Jinja City</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRight}>
            <View style={styles.infoIcon}>
              <Ionicons name="card-outline" size={20} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>Pay at shop with code</Text>
            </View>
          </View>
        </View>

        {/* Cart Items */}
        {items.map((item) => {
          const itemSavings = (item.regularPrice - item.munolinkPrice) * item.quantity;
          return (
            <View key={item.id} style={styles.cartItemCard}>
              {/* Product Image */}
              <View style={styles.itemImage}>
                <Ionicons name="cube-outline" size={32} color="#006B3F" />
              </View>

              {/* Item Details */}
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPack}>{item.pack}</Text>
                <View style={styles.itemShopRow}>
                  <Ionicons name="storefront-outline" size={11} color="#888" />
                  <Text style={styles.itemShop}>{item.shop}</Text>
                  <Text style={styles.itemDistance}>· {item.distance}</Text>
                </View>
                <View style={styles.itemDiscountBadge}>
                  <Text style={styles.itemDiscountText}>Save {item.discount}%</Text>
                </View>
              </View>

              {/* Price & Controls */}
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeItem(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                </TouchableOpacity>

                <Text style={styles.itemMunolinkPrice}>
                  UGX {(item.munolinkPrice * item.quantity).toLocaleString()}
                </Text>
                <Text style={styles.itemRegularPrice}>
                  UGX {(item.regularPrice * item.quantity).toLocaleString()}
                </Text>

                {/* Quantity Controls */}
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Ionicons name="remove" size={14} color="#212121" />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Ionicons name="add" size={14} color="#212121" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemSavings}>
                  Save UGX {itemSavings.toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Promo Code */}
        <View style={styles.promoSection}>
          <View style={styles.promoInputRow}>
            <View style={styles.promoIcon}>
              <Ionicons name="pricetag-outline" size={18} color="#006B3F" />
            </View>
            <TextInput
              style={styles.promoInput}
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Enter promo code"
              placeholderTextColor="#CCCCCC"
            />
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>UGX {subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discounts</Text>
            <Text style={styles.summaryDiscount}>− UGX {totalSavings.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>UGX {serviceFee.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryFinalLabel}>Total</Text>
            <Text style={styles.summaryFinalValue}>UGX {finalTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.savingsMessage}>
            <Ionicons name="happy-outline" size={14} color="#006B3F" />
            <Text style={styles.savingsMessageText}>
              You're saving UGX {totalSavings.toLocaleString()} on this order!
            </Text>
          </View>
        </View>

        {/* Trust Strip */}
        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={14} color="#006B3F" />
            <Text style={styles.trustText}>Secure Payment</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="pricetag" size={14} color="#006B3F" />
            <Text style={styles.trustText}>Lowest Prices</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={14} color="#006B3F" />
            <Text style={styles.trustText}>Trusted Shops</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="chatbubble-ellipses" size={14} color="#006B3F" />
            <Text style={styles.trustText}>Real-Time Support</Text>
          </View>
        </View>

        {/* You May Also Like */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>You May Also Like</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recommendScroll}
        >
          {recommendations.map((item, index) => (
            <View key={index} style={styles.recommendCard}>
              <TouchableOpacity style={styles.recommendFav}>
                <Ionicons name="heart-outline" size={14} color="#888" />
              </TouchableOpacity>
              <View style={styles.recommendImage}>
                <Ionicons name="cube-outline" size={28} color="#006B3F" />
              </View>
              <Text style={styles.recommendName}>{item.name}</Text>
              <View style={styles.recommendPriceRow}>
                <Text style={styles.recommendOldPrice}>UGX {item.oldPrice}</Text>
                <Text style={styles.recommendNewPrice}>UGX {item.price}</Text>
              </View>
              <TouchableOpacity style={styles.recommendAddBtn}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Bottom spacing */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.saveLaterBtn}>
          <Ionicons name="bookmark-outline" size={18} color="#006B3F" />
          <Text style={styles.saveLaterText}>Save for Later</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.proceedBtn}>
          <Text style={styles.proceedText}>Proceed to Pay</Text>
          <Text style={styles.proceedSubtext}>Show code at shop</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payNavButton}>
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetag-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  cartSummary: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  cartItemCount: {
    fontSize: 11,
    color: '#006B3F',
    fontWeight: '600',
  },
  cartTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#006B3F',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  infoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: '#888',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#212121',
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  itemPack: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  itemShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  itemShop: {
    fontSize: 11,
    color: '#888',
  },
  itemDistance: {
    fontSize: 10,
    color: '#888',
  },
  itemDiscountBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  itemDiscountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#006B3F',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  itemMunolinkPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#006B3F',
  },
  itemRegularPrice: {
    fontSize: 11,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
  },
  itemSavings: {
    fontSize: 9,
    color: '#006B3F',
    fontWeight: '600',
  },
  promoSection: {
    marginBottom: 18,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  promoIcon: {
    marginRight: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
  },
  applyBtn: {
    backgroundColor: '#006B3F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  summaryDiscount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006B3F',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  summaryFinalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  summaryFinalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006B3F',
  },
  savingsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  savingsMessageText: {
    fontSize: 12,
    color: '#006B3F',
    fontWeight: '600',
    flex: 1,
  },
  trustStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#006B3F',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
  },
  viewAll: {
    fontSize: 13,
    color: '#006B3F',
    fontWeight: '600',
  },
  recommendScroll: {
    marginBottom: 16,
  },
  recommendCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  recommendFav: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  recommendImage: {
    width: '100%',
    height: 70,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  recommendPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendOldPrice: {
    fontSize: 10,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  recommendNewPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006B3F',
  },
  recommendAddBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  saveLaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#006B3F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
  },
  saveLaterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006B3F',
  },
  proceedBtn: {
    flex: 1,
    backgroundColor: '#006B3F',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proceedSubtext: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  payNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});