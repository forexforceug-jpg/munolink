import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, RefreshControl, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ServiceProviderServices({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All Services');
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [catalogServices, setCatalogServices] = useState([]);
  const [addingService, setAddingService] = useState(null);

  const tabs = ['All Services', 'Active', 'Inactive'];

  const iconMap = {
    'Plumbing': 'water-outline',
    'Electrical': 'flash-outline',
    'Beauty': 'cut-outline',
    'Healthcare': 'medkit-outline',
    'Education': 'school-outline',
    'Transport': 'car-outline',
    'Cleaning': 'sparkles-outline',
    'Automotive': 'construct-outline',
    'Events': 'calendar-outline',
  };

  const loadServices = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    // Fetch provider_services
    const { data: providerServices, error: psError } = await supabase
      .from('provider_services')
      .select('id, service_id, price, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (psError) {
      console.error('Services error:', psError.message);
      setLoading(false);
      return;
    }

    if (providerServices && providerServices.length > 0) {
      // Fetch service_catalog entries
      const serviceIds = [...new Set(providerServices.map(s => s.service_id))];
      const { data: catalogData } = await supabase
        .from('service_catalog')
        .select('id, name, category')
        .in('id', serviceIds);

      const catalogMap = {};
      if (catalogData) catalogData.forEach(c => { catalogMap[c.id] = c; });

      setServices(providerServices.map(s => ({
        id: s.id,
        serviceName: catalogMap[s.service_id]?.name || 'Service',
        category: catalogMap[s.service_id]?.category || 'General',
        icon: iconMap[catalogMap[s.service_id]?.category] || 'briefcase-outline',
        price: Number(s.price),
        isActive: s.is_active,
      })));
    } else {
      setServices([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  const loadCatalogForAdd = async () => {
    const { data } = await supabase
      .from('service_catalog')
      .select('id, name, category')
      .order('category');

    if (data) {
      // Get existing service_ids to mark as already added
      const existingIds = new Set(services.map(s => s.serviceName));
      setCatalogServices(data.map(c => ({
        ...c,
        icon: iconMap[c.category] || 'briefcase-outline',
        alreadyAdded: services.some(s => s.serviceName === c.name),
      })));
    }
    setShowAddModal(true);
  };

  const handleAddService = async (catalogItem) => {
    if (!user?.id) return;

    setAddingService(catalogItem.id);

    const { error } = await supabase
      .from('provider_services')
      .insert({
        user_id: user.id,
        service_id: catalogItem.id,
        price: 50000,
        is_active: true,
      });

    setAddingService(null);

    if (error) {
      Alert.alert('Error', 'Failed to add service: ' + error.message);
      return;
    }

    Alert.alert('Success', `${catalogItem.name} added to your services!`);
    setShowAddModal(false);
    loadServices();
  };

  useEffect(() => { loadServices(); }, [loadServices]);

  const onRefresh = () => { setRefreshing(true); loadServices(); };

  const toggleService = async (serviceId, currentStatus) => {
    const { error } = await supabase
      .from('provider_services')
      .update({ is_active: !currentStatus })
      .eq('id', serviceId);

    if (!error) {
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, isActive: !currentStatus } : s));
    } else {
      Alert.alert('Error', 'Failed to update service status.');
    }
  };

  const activeCount = services.filter(s => s.isActive).length;
  const inactiveCount = services.filter(s => !s.isActive).length;

  const filteredServices = services.filter(s => {
    const matchesSearch = s.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'Active') return s.isActive && matchesSearch;
    if (activeTab === 'Inactive') return !s.isActive && matchesSearch;
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Services</Text>
            <Text style={styles.pageSubtitle}>Manage the services you offer to customers.</Text>
          </View>
          <TouchableOpacity style={styles.addServiceBtn} onPress={loadCatalogForAdd}>
            <Ionicons name="add" size={18} color="#006B3F" />
            <Text style={styles.addServiceText}>Add Service</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {[
            { name: 'All Services', count: services.length },
            { name: 'Active', count: activeCount, color: '#4CAF50' },
            { name: 'Inactive', count: inactiveCount, color: '#F57C00' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, activeTab === tab.name && styles.tabActive]}
              onPress={() => setActiveTab(tab.name)}
            >
              {tab.color && <View style={[styles.tabDot, { backgroundColor: tab.color }]} />}
              <Text style={[styles.tabText, activeTab === tab.name && styles.tabTextActive]}>{tab.name}</Text>
              <Text style={[styles.tabCountText, activeTab === tab.name && styles.tabCountActive]}>({tab.count})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search your services..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#006B3F" style={{ paddingVertical: 30 }} />
        ) : filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No services yet</Text>
            <Text style={styles.emptySubtitle}>Add services from the catalog to start receiving bookings.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={loadCatalogForAdd}>
              <Text style={styles.emptyAddText}>Browse Service Catalog</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredServices.map((service) => (
            <View key={service.id} style={[styles.serviceCard, !service.isActive && styles.serviceCardInactive]}>
              <View style={styles.serviceTop}>
                <View style={styles.serviceIcon}>
                  <Ionicons name={service.icon} size={24} color="#006B3F" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.serviceName}</Text>
                  <Text style={styles.servicePrice}>UGX {service.price?.toLocaleString() || '0'}</Text>
                  <Text style={styles.serviceCategory}>{service.category}</Text>
                </View>
                <View style={styles.serviceRight}>
                  <View style={[styles.statusBadge, { backgroundColor: service.isActive ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Text style={[styles.statusText, { color: service.isActive ? '#4CAF50' : '#F57C00' }]}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.serviceBottom}>
                <Switch
                  value={service.isActive}
                  onValueChange={() => toggleService(service.id, service.isActive)}
                  trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                  thumbColor={service.isActive ? '#4CAF50' : '#CCC'}
                />
              </View>
            </View>
          ))
        )}

        <View style={styles.boostBanner}>
          <View style={styles.boostLeft}>
            <View style={styles.boostIcon}><Ionicons name="ribbon-outline" size={28} color="#006B3F" /></View>
            <View>
              <Text style={styles.boostTitle}>Boost Your Visibility</Text>
              <Text style={styles.boostSubtitle}>Promote your services and reach more customers.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.boostBtn}>
            <Text style={styles.boostBtnText}>Promote</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Add Service Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Service</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select a service from the catalog to add to your profile.</Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {catalogServices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.catalogItem, item.alreadyAdded && styles.catalogItemAdded]}
                  onPress={() => !item.alreadyAdded && handleAddService(item)}
                  disabled={item.alreadyAdded || addingService === item.id}
                >
                  <View style={[styles.catalogIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name={item.icon} size={20} color="#006B3F" />
                  </View>
                  <View style={styles.catalogInfo}>
                    <Text style={styles.catalogName}>{item.name}</Text>
                    <Text style={styles.catalogCategory}>{item.category}</Text>
                  </View>
                  {item.alreadyAdded ? (
                    <View style={styles.addedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={styles.addedText}>Added</Text>
                    </View>
                  ) : addingService === item.id ? (
                    <ActivityIndicator size="small" color="#006B3F" />
                  ) : (
                    <TouchableOpacity style={styles.addCatalogBtn} onPress={() => handleAddService(item)}>
                      <Ionicons name="add-circle-outline" size={22} color="#006B3F" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderDashboard')}>
          <Ionicons name="grid-outline" size={22} color="#888" /><Text style={styles.navLabel}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderBookings')}>
          <Ionicons name="calendar-outline" size={22} color="#888" /><Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="briefcase" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderEarnings')}>
          <Ionicons name="wallet-outline" size={22} color="#888" /><Text style={styles.navLabel}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderProfileScreen')}>
          <Ionicons name="person-outline" size={22} color="#888" /><Text style={styles.navLabel}>Profile</Text>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  emptyAddBtn: { backgroundColor: '#006B3F', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  emptyAddText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  addServiceBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, gap: 6 },
  addServiceText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  tabsScroll: { marginBottom: 14 },
  tab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 4, borderWidth: 1, borderColor: '#E0E0E0' },
  tabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  tabDot: { width: 8, height: 8, borderRadius: 4 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  tabCountText: { fontSize: 11, fontWeight: '600', color: '#888' },
  tabCountActive: { color: '#FFFFFF' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ECECEC' },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  serviceCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  serviceCardInactive: { opacity: 0.7 },
  serviceTop: { flexDirection: 'row', marginBottom: 10 },
  serviceIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 2 },
  servicePrice: { fontSize: 15, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  serviceCategory: { fontSize: 12, color: '#888' },
  serviceRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  serviceBottom: { alignItems: 'flex-end' },
  boostBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 8 },
  boostLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  boostIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  boostTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  boostSubtitle: { fontSize: 11, color: '#666' },
  boostBtn: { borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  boostBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  modalList: { maxHeight: 400 },
  catalogItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  catalogItemAdded: { opacity: 0.5 },
  catalogIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  catalogInfo: { flex: 1 },
  catalogName: { fontSize: 14, fontWeight: '600', color: '#212121' },
  catalogCategory: { fontSize: 11, color: '#888' },
  addedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addedText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  addCatalogBtn: { padding: 4 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});