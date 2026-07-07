import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function MyCart({ navigation }) {
  const { user } = useAuth();
  const {
    cartItems, selectedShopName, cartTotal,
    cartSavings, itemCount,
    updateQuantity, removeFromCart, clearCart,
  } = useCart();

  const handleCheckout = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to checkout.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
      ]);
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Add items to your cart first.');
      return;
    }

    navigation.navigate('PaymentConfirm', {
      shopId: cartItems[0]?.shopId,
      shopName: selectedShopName,
      items: cartItems,
      total: cartTotal,
      savings: cartSavings,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My Cart</Text>
        <Text style={styles.pageSubtitle}>{itemCount} item{itemCount !== 1 ? 's' : ''}{selectedShopName ? ` from ${selectedShopName}` : ''}</Text>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>Browse products and add items to get started.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Connections')}>
              <Text style={styles.browseBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemImage}>
                  {item.images && item.images.length > 0 ? (
                    <Image source={{ uri: item.images[0] }} style={{ width: 60, height: 60, borderRadius: 12 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={30} color="#006B3F" />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                  <Text style={styles.itemPrice}>UGX {item.munolinkPrice.toLocaleString()}</Text>
                  <Text style={styles.itemRegularPrice}>UGX {item.regularPrice.toLocaleString()}</Text>
                  <Text style={styles.itemSavings}>Save UGX {(item.regularPrice - item.munolinkPrice).toLocaleString()} each</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color="#F44336" />
                  </TouchableOpacity>
                  <View style={styles.quantityRow}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={18} color="#006B3F" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={18} color="#006B3F" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
                <Text style={styles.summaryValue}>UGX {cartTotal.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Regular Price</Text>
                <Text style={styles.summaryOldValue}>UGX {(cartTotal + cartSavings).toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Munolink Savings</Text>
                <Text style={styles.summarySavings}>− UGX {cartSavings.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>UGX {cartTotal.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={() => {
              Alert.alert('Clear Cart', 'Remove all items?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCart },
              ]);
            }}>
              <Text style={styles.clearBtnText}>Clear Cart</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Bar */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutLabel}>Total</Text>
            <Text style={styles.checkoutPrice}>UGX {cartTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  emptyCart: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#888', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#AAA' },
  browseBtn: { marginTop: 16, backgroundColor: '#006B3F', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 25 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  cartItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  itemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  itemPrice: { fontSize: 15, fontWeight: '800', color: '#006B3F' },
  itemRegularPrice: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  itemSavings: { fontSize: 10, color: '#4CAF50', fontWeight: '500', marginTop: 2 },
  itemActions: { alignItems: 'center', gap: 8 },
  removeBtn: { padding: 4 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#212121' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 10, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { fontSize: 12, color: '#888' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
  summaryOldValue: { fontSize: 12, color: '#AAA', textDecorationLine: 'line-through' },
  summarySavings: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },
  summaryTotalLabel: { fontSize: 13, fontWeight: '700', color: '#212121' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#006B3F' },
  clearBtn: { alignItems: 'center', paddingVertical: 10 },
  clearBtnText: { fontSize: 13, color: '#F44336', fontWeight: '600' },
  checkoutBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  checkoutLabel: { fontSize: 11, color: '#888' },
  checkoutPrice: { fontSize: 18, fontWeight: '800', color: '#212121' },
  checkoutBtn: { flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25, alignItems: 'center', gap: 6 },
  checkoutBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});