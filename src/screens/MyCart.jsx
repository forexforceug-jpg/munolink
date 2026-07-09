import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LogoImage from '../../assets/logo.png';

const C = {
  primary: '#1F2F5F',
  accent: '#4A7DFF',
  white: '#FFFFFF',
  background: '#F5F6FA',
  border: '#DCE5FF',
  muted: '#8E99B3',
  text: '#1F2F5F',
  success: '#4CAF50',
  danger: '#F44336',
  lightBg: '#EEF3FF',
};

export default function MyCart({ navigation }) {
  const { user } = useAuth();
  const { cartItems, selectedShopName, cartTotal, cartSavings, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();

  const handleCheckout = () => {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to checkout.', [{ text: 'Cancel' }, { text: 'Sign In', onPress: () => navigation.navigate('SignIn') }]); return; }
    if (cartItems.length === 0) { Alert.alert('Empty Cart'); return; }
    navigation.navigate('PaymentConfirm', { shopId: cartItems[0]?.shopId, shopName: selectedShopName, items: cartItems, total: cartTotal, savings: cartSavings });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color={C.text} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>My Cart</Text>
        <Text style={styles.pageSubtitle}>{itemCount} item{itemCount !== 1 ? 's' : ''}{selectedShopName ? ` from ${selectedShopName}` : ''}</Text>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}><Ionicons name="cart-outline" size={64} color="#CCC" /><Text style={styles.emptyTitle}>Your cart is empty</Text><Text style={styles.emptySubtitle}>Browse products and add items.</Text><TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Connections')}><Text style={styles.browseBtnText}>Browse Products</Text></TouchableOpacity></View>
        ) : (
          <>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemImage}>{item.images?.[0] ? <Image source={{ uri: item.images[0] }} style={{ width: 60, height: 60, borderRadius: 12 }} /> : <Ionicons name="cube-outline" size={30} color={C.accent} />}</View>
                <View style={styles.itemInfo}><Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text><Text style={styles.itemPrice}>UGX {item.munolinkPrice.toLocaleString()}</Text><Text style={styles.itemRegularPrice}>UGX {item.regularPrice.toLocaleString()}</Text><Text style={styles.itemSavings}>Save UGX {(item.regularPrice - item.munolinkPrice).toLocaleString()}</Text></View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)}><Ionicons name="trash-outline" size={18} color={C.danger} /></TouchableOpacity>
                  <View style={styles.quantityRow}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}><Ionicons name="remove" size={18} color={C.accent} /></TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}><Ionicons name="add" size={18} color={C.accent} /></TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text><Text style={styles.summaryValue}>UGX {cartTotal.toLocaleString()}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Regular Price</Text><Text style={styles.summaryOldValue}>UGX {(cartTotal + cartSavings).toLocaleString()}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Munolink Savings</Text><Text style={styles.summarySavings}>− UGX {cartSavings.toLocaleString()}</Text></View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Total</Text><Text style={styles.summaryTotalValue}>UGX {cartTotal.toLocaleString()}</Text></View>
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={() => { Alert.alert('Clear Cart', 'Remove all items?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: clearCart }]); }}><Text style={styles.clearBtnText}>Clear Cart</Text></TouchableOpacity>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.checkoutBar}>
          <View><Text style={styles.checkoutLabel}>Total</Text><Text style={styles.checkoutPrice}>UGX {cartTotal.toLocaleString()}</Text></View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}><Text style={styles.checkoutBtnText}>Proceed to Checkout</Text><Ionicons name="arrow-forward" size={18} color={C.white} /></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLogo: { width: 110, height: 28, resizeMode: 'contain' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: C.muted, marginBottom: 16 },
  emptyCart: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.muted, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: C.muted },
  browseBtn: { marginTop: 16, backgroundColor: C.accent, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 25 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
  cartItem: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  itemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  itemPrice: { fontSize: 15, fontWeight: '800', color: C.primary },
  itemRegularPrice: { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
  itemSavings: { fontSize: 10, color: C.success, fontWeight: '500', marginTop: 2 },
  itemActions: { alignItems: 'center', gap: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700', color: C.text },
  summaryCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginTop: 10, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { fontSize: 12, color: C.muted },
  summaryValue: { fontSize: 12, fontWeight: '600', color: C.text },
  summaryOldValue: { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
  summarySavings: { fontSize: 12, fontWeight: '600', color: C.success },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: 6 },
  summaryTotalLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: C.primary },
  clearBtn: { alignItems: 'center', paddingVertical: 10 },
  clearBtnText: { fontSize: 13, color: C.danger, fontWeight: '600' },
  checkoutBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 30 },
  checkoutLabel: { fontSize: 11, color: C.muted },
  checkoutPrice: { fontSize: 18, fontWeight: '800', color: C.text },
  checkoutBtn: { flexDirection: 'row', backgroundColor: C.accent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25, alignItems: 'center', gap: 6 },
  checkoutBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
});