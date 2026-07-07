import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function OrderDetails({ navigation, route }) {
  const order = route?.params?.order || {};
  const [shop, setShop] = useState(null);

  useEffect(() => {
    if (order.shop) {
      loadShopDetails();
    }
  }, []);

  const loadShopDetails = async () => {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('name', order.shop)
      .single();
    if (data) setShop(data);
  };

  const orderStatus = order.status || 'Completed';
  const orderDate = order.date || 'N/A';
  const orderAmount = order.amount || '0';
  const orderId = order.id || '#MUNO-001';
  const savings = order.savings || (order.discount || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>All information related to this order.</Text>

        <View style={styles.statusBanner}>
          <View style={styles.statusLeft}>
            <View style={styles.statusCheck}>
              <Ionicons name="checkmark" size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.statusTitle}>Order {orderStatus}</Text>
              <Text style={styles.statusSubtitle}>Transaction successful</Text>
            </View>
          </View>
          <View style={styles.dateCard}>
            <Text style={styles.dateCardLabel}>{orderStatus}</Text>
            <Text style={styles.dateCardValue}>{orderDate}</Text>
          </View>
        </View>

        {shop && (
          <View style={styles.shopCard}>
            <View style={styles.shopTopRow}>
              <View style={styles.shopIcon}><Ionicons name="storefront" size={24} color="#006B3F" /></View>
              <View style={styles.shopInfo}>
                <View style={styles.shopNameRow}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  {shop.is_verified && <View style={styles.partnerBadge}><Ionicons name="shield-checkmark" size={9} color="#006B3F" /><Text style={styles.partnerText}>Official Partner</Text></View>}
                </View>
                <View style={styles.shopMeta}>
                  <Ionicons name="star" size={11} color="#FFB300" />
                  <Text style={styles.shopRating}>{shop.rating || '4.5'}</Text>
                  <Text style={styles.shopDistance}>· {order.distance || '0.4 km'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewShopBtn}><Text style={styles.viewShopText}>View Shop</Text></TouchableOpacity>
            </View>
            <View style={styles.shopDivider} />
            <View style={styles.detailsRow}>
              <View style={styles.detailsLeft}>
                <View style={styles.detailItem}><Ionicons name="receipt-outline" size={14} color="#006B3F" /><Text style={styles.detailLabel}>Order ID</Text><Text style={styles.detailValue}>{orderId}</Text></View>
                <View style={styles.detailItem}><Ionicons name="wallet-outline" size={14} color="#006B3F" /><Text style={styles.detailLabel}>Payment Method</Text><Text style={styles.detailValue}>Munolink Wallet</Text></View>
                <View style={styles.detailItem}><Ionicons name="cash-outline" size={14} color="#006B3F" /><Text style={styles.detailLabel}>Paid Amount</Text><Text style={styles.detailValueBold}>UGX {orderAmount}</Text></View>
              </View>
              {savings > 0 && (
                <View style={styles.savingsCard}>
                  <View style={styles.savingsIcon}><Ionicons name="pricetag" size={20} color="#006B3F" /></View>
                  <Text style={styles.savingsTitle}>You Saved</Text>
                  <Text style={styles.savingsAmount}>UGX {savings.toLocaleString()}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!shop && (
          <View style={styles.shopCard}>
            <View style={styles.shopTopRow}>
              <View style={styles.shopIcon}><Ionicons name="storefront" size={24} color="#006B3F" /></View>
              <View style={styles.shopInfo}><Text style={styles.shopName}>{order.shop || 'Shop'}</Text><Text style={styles.shopDistance}>📍 {order.location || 'Jinja City'}</Text></View>
            </View>
            <View style={styles.shopDivider} />
            <View style={styles.detailsRow}>
              <View style={styles.detailsLeft}>
                <View style={styles.detailItem}><Ionicons name="receipt-outline" size={14} color="#006B3F" /><Text style={styles.detailLabel}>Order ID</Text><Text style={styles.detailValue}>{orderId}</Text></View>
                <View style={styles.detailItem}><Ionicons name="wallet-outline" size={14} color="#006B3F" /><Text style={styles.detailLabel}>Payment Method</Text><Text style={styles.detailValue}>Munolink Wallet</Text></View>
                <View style={styles.detailItem}><Ionicons name="cash-outline" size={14} color="#006B3F" /><Text style={styles.detailLabel}>Paid Amount</Text><Text style={styles.detailValueBold}>UGX {orderAmount}</Text></View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.downloadBtn}><Ionicons name="download-outline" size={18} color="#006B3F" /><Text style={styles.downloadText}>Download Receipt</Text></TouchableOpacity>
          <TouchableOpacity style={styles.shopAgainBtn} onPress={() => navigation.navigate('Connections')}><Text style={styles.shopAgainText}>Shop Again</Text></TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  statusBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16, marginBottom: 14 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusCheck: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  statusSubtitle: { fontSize: 12, color: '#006B3F', fontWeight: '500' },
  dateCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, alignItems: 'center' },
  dateCardLabel: { fontSize: 9, color: '#888', fontWeight: '500' },
  dateCardValue: { fontSize: 13, fontWeight: '700', color: '#212121' },
  shopCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  shopTopRow: { flexDirection: 'row', alignItems: 'center' },
  shopIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  shopInfo: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  shopName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  partnerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 2 },
  partnerText: { fontSize: 8, fontWeight: '700', color: '#006B3F' },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  shopDistance: { fontSize: 11, color: '#888' },
  viewShopBtn: { borderWidth: 1.5, borderColor: '#006B3F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  viewShopText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  shopDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  detailsRow: { flexDirection: 'row', gap: 12 },
  detailsLeft: { flex: 1, gap: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 12, color: '#888', flex: 1 },
  detailValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
  detailValueBold: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  savingsCard: { width: 140, backgroundColor: '#F8FFF8', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8F5E9' },
  savingsIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  savingsTitle: { fontSize: 11, color: '#006B3F', fontWeight: '600' },
  savingsAmount: { fontSize: 18, fontWeight: '800', color: '#006B3F', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 14, borderRadius: 25, gap: 6 },
  downloadText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  shopAgainBtn: { flex: 1, backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  shopAgainText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});