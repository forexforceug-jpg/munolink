import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function PaymentConfirm({ navigation, route }) {
  const { user } = useAuth();
  const { cartItems, selectedShopName, cartTotal, cartSavings, clearCart } = useCart();
  const [codeTimer, setCodeTimer] = useState(300);

  const items = route?.params?.items || cartItems;
  const total = route?.params?.total || cartTotal;
  const savings = route?.params?.savings || cartSavings;
  const shopName = route?.params?.shopName || selectedShopName || 'Shop';

  useEffect(() => {
    if (codeTimer <= 0) return;
    const timer = setTimeout(() => setCodeTimer(codeTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const serviceFee = 500;
  const finalTotal = total + serviceFee;

  const handleConfirm = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to continue.');
      return;
    }
    navigation.navigate('EnterPin', {
      amount: finalTotal,
      savings: savings,
      items: items,
      shopName: shopName,
      type: 'order',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#212121" />
          <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Confirm Payment</Text>
        <Text style={styles.pageSubtitle}>Review your order from {shopName}</Text>

        <View style={styles.shopCard}>
          <View style={styles.shopTopRow}>
            <View style={styles.shopIcon}><Ionicons name="storefront" size={22} color="#006B3F" /></View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.shopMeta}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order Items</Text>
        {items.map((item, index) => (
          <View key={item.id || index} style={styles.orderItem}>
            <View style={styles.itemIcon}><Ionicons name="cube-outline" size={22} color="#006B3F" /></View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.productName || item.name}</Text>
              <Text style={styles.itemQty}>Qty: {item.quantity || 1}</Text>
            </View>
            <Text style={styles.itemPrice}>UGX {((item.munolinkPrice || item.price) * (item.quantity || 1)).toLocaleString()}</Text>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>UGX {total.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Munolink Savings</Text><Text style={styles.summarySavings}>− UGX {savings.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service Fee</Text><Text style={styles.summaryValue}>UGX {serviceFee.toLocaleString()}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Total to Pay</Text><Text style={styles.summaryTotalValue}>UGX {finalTotal.toLocaleString()}</Text></View>
          {user && <View style={styles.walletRow}><Ionicons name="wallet-outline" size={14} color="#888" /><Text style={styles.walletText}>Balance: UGX {Number(user.walletBalance || 0).toLocaleString()}</Text></View>}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>Confirm & Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 18 },
  shopCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  shopTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  shopMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 10 },
  orderItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 8, gap: 10 },
  itemIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#212121' },
  itemQty: { fontSize: 11, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { fontSize: 12, color: '#888' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
  summarySavings: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: '#212121' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', color: '#006B3F' },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  walletText: { fontSize: 11, color: '#888' },
  actionBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0 },
  backBtn: { borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#006B3F' },
  confirmBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});