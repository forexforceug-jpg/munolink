import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccess({ navigation, route }) {
  const amount = route?.params?.amount || 0;
  const savings = route?.params?.savings || 0;
  const orderId = route?.params?.orderId || 'MUNO-00000000';
  const shopName = route?.params?.shopName || 'Shop';
  const items = route?.params?.items || [];
  const newBalance = route?.params?.newBalance || 0;
  const originalTotal = amount + savings;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Connections')}>
          <Ionicons name="close" size={24} color="#212121" />
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
        <View style={styles.successIconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={44} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>Your payment has been completed.</Text>

        <View style={styles.transactionCard}>
          <View style={styles.shopRow}>
            <View style={styles.shopIcon}><Ionicons name="storefront" size={22} color="#006B3F" /></View>
            <View style={styles.shopInfo}><Text style={styles.shopName}>{shopName}</Text></View>
          </View>
          <View style={styles.transDivider} />
          <View style={styles.transDetailRow}><Ionicons name="receipt-outline" size={14} color="#888" /><Text style={styles.transDetailLabel}>Order ID</Text><Text style={styles.transDetailValue}>#{orderId}</Text></View>
          <View style={styles.transDetailRow}><Ionicons name="calendar-outline" size={14} color="#888" /><Text style={styles.transDetailLabel}>Date</Text><Text style={styles.transDetailValue}>{new Date().toLocaleDateString()}</Text></View>
          <View style={styles.transDetailRow}><Ionicons name="wallet-outline" size={14} color="#888" /><Text style={styles.transDetailLabel}>New Balance</Text><Text style={styles.transDetailValue}>UGX {newBalance.toLocaleString()}</Text></View>
        </View>

        <View style={styles.savingsCard}>
          <View style={styles.savingsMain}>
            <View style={styles.savingsIcon}><Ionicons name="pricetag" size={22} color="#006B3F" /></View>
            <View>
              <Text style={styles.savingsTitle}>You Saved UGX {savings.toLocaleString()}</Text>
              <Text style={styles.savingsSubtitle}>with Munolink Pay</Text>
            </View>
          </View>
          <View style={styles.savingsDivider} />
          <View style={styles.savingsRow}><Text style={styles.savingsLabel}>Original Total</Text><Text style={styles.savingsOldValue}>UGX {originalTotal.toLocaleString()}</Text></View>
          <View style={styles.savingsRow}><Text style={styles.savingsLabel}>Discount</Text><Text style={styles.savingsDiscountValue}>− UGX {savings.toLocaleString()}</Text></View>
          <View style={styles.savingsRow}><Text style={styles.savingsFinalLabel}>Amount Paid</Text><Text style={styles.savingsFinalValue}>UGX {amount.toLocaleString()}</Text></View>
        </View>

        {items.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.orderItemIcon}><Ionicons name="cube-outline" size={20} color="#006B3F" /></View>
                <View style={styles.orderItemInfo}><Text style={styles.orderItemName}>{item.productName}</Text></View>
                <Text style={styles.orderItemQty}>x{item.quantity}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Connections')}>
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ordersBtn} onPress={() => navigation.navigate('MyOrders')}>
            <Ionicons name="receipt-outline" size={18} color="#006B3F" />
            <Text style={styles.ordersBtnText}>View Orders</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  successIconContainer: { alignItems: 'center', marginBottom: 16 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#212121', textAlign: 'center', marginBottom: 4 },
  successSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20 },
  transactionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  transDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  transDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  transDetailLabel: { fontSize: 12, color: '#888', flex: 1 },
  transDetailValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
  savingsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 2, borderColor: '#E8F5E9' },
  savingsMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  savingsIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  savingsTitle: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  savingsSubtitle: { fontSize: 12, color: '#006B3F', fontWeight: '500' },
  savingsDivider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 10 },
  savingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  savingsLabel: { fontSize: 12, color: '#888' },
  savingsOldValue: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  savingsDiscountValue: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  savingsFinalLabel: { fontSize: 13, fontWeight: '700', color: '#212121' },
  savingsFinalValue: { fontSize: 15, fontWeight: '800', color: '#006B3F' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 10 },
  orderItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 12, padding: 10, marginBottom: 6, gap: 10 },
  orderItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontSize: 13, fontWeight: '600', color: '#212121' },
  orderItemQty: { fontSize: 12, color: '#888', fontWeight: '500' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  homeBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', gap: 6 },
  homeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  ordersBtn: { flex: 1, flexDirection: 'row', borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', gap: 6 },
  ordersBtnText: { fontSize: 14, fontWeight: '700', color: '#006B3F' },
});