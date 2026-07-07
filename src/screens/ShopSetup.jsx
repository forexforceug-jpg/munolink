import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ShopSetup({ navigation, route }) {
  const phoneNumber = route?.params?.phoneNumber;
  const { user, login } = useAuth();

  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Pharmacy');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Jinja');
  const [landmark, setLandmark] = useState('');
  const [shopPhone, setShopPhone] = useState(phoneNumber || '');
  const [openingHours, setOpeningHours] = useState('Mon-Sat, 7AM-9PM');
  const [loading, setLoading] = useState(false);

  const categories = ['Pharmacy', 'Grocery', 'Hardware', 'Electronics', 'Clothing', 'Restaurant', 'Services', 'Other'];

  const handleSubmit = async () => {
    if (!shopName.trim()) {
      Alert.alert('Required', 'Please enter your shop name.');
      return;
    }

    setLoading(true);

    // Get current user ID
    let userId = user?.id;

    if (!userId) {
      // Fallback: look up by phone
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (!userData) {
        // Try phone column instead
        const { data: userData2 } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phoneNumber)
          .maybeSingle();
        userId = userData2?.id;
      } else {
        userId = userData.id;
      }
    }

    if (!userId) {
      Alert.alert('Error', 'User account not found. Please sign in again.');
      setLoading(false);
      return;
    }

    // Check if shop already exists — use maybeSingle to avoid errors
    const { data: existingShop } = await supabase
      .from('shops')
      .select('id, name')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existingShop) {
      login({ ...user, id: userId, shopId: existingShop.id, role: 'shop_owner' });
      setLoading(false);
      navigation.replace('ShopOwnerDashboard');
      return;
    }

    // Create new shop
    const { data: shop, error } = await supabase
      .from('shops')
      .insert({
        owner_id: userId,
        name: shopName.trim(),
        category: category,
        address: address.trim() || null,
        area: area || 'Jinja',
        landmark: landmark.trim() || null,
        phone: shopPhone || phoneNumber,
        opening_hours: openingHours,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to create shop: ' + error.message);
      return;
    }

    if (shop) {
      login({ ...user, id: userId, shopId: shop.id, role: 'shop_owner' });
      navigation.replace('ShopOwnerDashboard');
    }
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
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Set Up Your Shop</Text>
        <Text style={styles.pageSubtitle}>Tell us about your business so customers can find you.</Text>

        <Text style={styles.label}>Shop Name *</Text>
        <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="e.g. Green Pharmacy" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="e.g. Plot 15, Main Street" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Area / Neighborhood</Text>
        <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="e.g. Jinja City" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Landmark</Text>
        <TextInput style={styles.input} value={landmark} onChangeText={setLandmark} placeholder="e.g. Near the clock tower" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Business Phone</Text>
        <TextInput style={styles.input} value={shopPhone} onChangeText={setShopPhone} keyboardType="phone-pad" placeholder="+256 7XX XXX XXX" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Opening Hours</Text>
        <TextInput style={styles.input} value={openingHours} onChangeText={setOpeningHours} placeholder="e.g. Mon-Sat, 7AM-9PM" placeholderTextColor="#CCC" />

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>{loading ? 'Creating Shop...' : 'Create My Shop'}</Text>
        </TouchableOpacity>

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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#ECECEC' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#888' },
  chipTextActive: { color: '#FFFFFF' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});