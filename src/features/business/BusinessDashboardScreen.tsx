import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

const { width, height } = Dimensions.get('window');

type Shop = Database['public']['Tables']['shops']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

// --- Business Type Configuration ---
const BUSINESS_CONFIGS: Record<string, any> = {
  shop: {
    offeringLabel: 'Products',
    offeringIcon: 'cube-outline',
    activityLabel: 'Orders',
    activityIcon: 'receipt-outline',
    statuses: ['New', 'Confirmed', 'Preparing', 'Ready', 'Shipped', 'Completed', 'Cancelled'],
    actions: {
      'New': ['Accept', 'Decline'],
      'Confirmed': ['Mark Preparing'],
      'Preparing': ['Mark Ready'],
      'Ready': ['Mark Shipped'],
      'Shipped': ['Mark Completed'],
    },
    stats: ['Revenue', 'Orders', 'Customers', 'Products'],
    quickActions: ['Add Product', 'View Orders', 'Analytics', 'Business Settings'],
    addModal: 'product',
    catalogSearch: true,
  },
  service: {
    offeringLabel: 'Services',
    offeringIcon: 'construct-outline',
    activityLabel: 'Bookings',
    activityIcon: 'calendar-outline',
    statuses: ['Requested', 'Accepted', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    actions: {
      'Requested': ['Accept', 'Decline'],
      'Accepted': ['Schedule', 'Contact Customer'],
      'Scheduled': ['Start Service'],
      'In Progress': ['Mark Completed'],
    },
    stats: ['Revenue', 'Bookings', 'Customers', 'Services'],
    quickActions: ['Add Service', 'View Bookings', 'Set Availability', 'Business Settings'],
    addModal: 'service',
    catalogSearch: false,
  },
  institution: {
    offeringLabel: 'Offerings',
    offeringIcon: 'business-outline',
    activityLabel: 'Reservations',
    activityIcon: 'calendar-outline',
    statuses: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    actions: {
      'Pending': ['Confirm', 'Decline'],
      'Confirmed': ['Mark In Progress'],
      'In Progress': ['Mark Completed'],
    },
    stats: ['Revenue', 'Reservations', 'Customers', 'Offerings'],
    quickActions: ['Add Offering', 'View Reservations', 'Business Hours', 'Business Settings'],
    addModal: 'offering',
    catalogSearch: false,
  },
};

// --- Main Component ---
export const BusinessDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Shop | null>(null);
  const [businessType, setBusinessType] = useState<string>('shop');
  const [category, setCategory] = useState<string>('');
  const [config, setConfig] = useState<any>(BUSINESS_CONFIGS.shop);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [newOffering, setNewOffering] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([]);

  // Load dashboard data
const loadDashboard = useCallback(async () => {
  if (!user?.id) {
    setLoading(false);
    return;
  }

  try {
    // 1. Get business data - Get all shops and use the most recent
    const { data: businessData, error: businessError } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (businessError) {
      console.error('Business load error:', businessError);
      setLoading(false);
      return;
    }

    if (!businessData || businessData.length === 0) {
      console.log('No business found for user:', user.id);
      setLoading(false);
      return;
    }

    // Use the most recent shop
    const shop = businessData[0];
    setBusiness(shop);
    
    const bizType = shop.business_type || 'shop';
    setBusinessType(bizType);
    setCategory(shop.category || '');

    // Set config based on business type
    const bizConfig = BUSINESS_CONFIGS[bizType] || BUSINESS_CONFIGS.shop;
    setConfig(bizConfig);

    // 2. Get wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('transactions')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (walletError) {
      console.error('Wallet load error:', walletError);
    } else if (walletData) {
      const totalBalance = walletData
        .filter((transaction) => transaction.status === 'completed')
        .reduce(
          (sum: number, transaction) =>
            sum + (transaction.seller_received ?? transaction.amount ?? 0),
          0,
        );
      setWalletBalance(totalBalance);
      setWalletTransactions(walletData);
    }

    // 3. Get activity
    const { data: activityData, error: activityError } = await supabase
      .from('transactions')
      .select(`
        *,
        users:user_id (
          full_name,
          phone_number
        )
      `)
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activityError) {
      console.error('Activity load error:', activityError);
    } else if (activityData) {
      setRecentActivity(activityData);
    }

    // 4. Get offerings based on business type
    if (bizType === 'shop') {
      const { data: productData, error: productError } = await supabase
        .from('shop_products')
        .select(`
          *,
          catalog:catalog_id (
            id,
            name,
            description,
            images,
            specifications
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (productError) {
        console.error('Product load error:', productError);
      } else if (productData) {
        setOfferings(productData);
      }
    } else if (bizType === 'service' || bizType === 'institution') {
      if (shop.owner_id) {
        const { data: serviceData, error: serviceError } = await supabase
          .from('provider_services')
          .select(`
            *,
            service_catalog:service_id (
              id,
              name,
              description,
              images,
              duration,
              category
            )
          `)
          .eq('user_id', shop.owner_id)
          .order('created_at', { ascending: false });

        if (serviceError) {
          console.error('Service load error:', serviceError);
        } else if (serviceData) {
          setOfferings(serviceData);
        }
      }
    }

    // 5. Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayActivity: Transaction[] =
      activityData?.filter(
        (activity) => activity.created_at?.startsWith(today),
      ) ?? [];

    const todayRevenue = todayActivity.reduce(
      (sum: number, activity: Transaction) =>
        sum + (activity.seller_received ?? activity.amount ?? 0),
      0,
    );

    setStats({
      revenue: todayRevenue,
      activityCount: activityData?.length || 0,
      customers: new Set(activityData?.map((a: any) => a.user_id)).size || 0,
      offerings: offerings.length,
      rating: shop.rating || 0,
      reviews: shop.review_count || 0,
    });

  } catch (error) {
    console.error('Error loading dashboard:', error);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // --- Search Catalog (for shops) ---
  const searchCatalog = async (query: string) => {
    if (!query.trim()) {
      setCatalogResults([]);
      return;
    }

    const { data } = await supabase
      .from('catalog')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);

    setCatalogResults(data || []);
  };

  // --- Add Offering ---
  const handleAddOffering = async () => {
    if (!business) return;

    if (businessType === 'shop') {
      if (!selectedCatalogItem) {
        Alert.alert('Error', 'Please select a product from the catalog');
        return;
      }

      setSaving(true);
      try {
        const { error } = await supabase
          .from('shop_products')
          .insert({
            shop_id: business.id,
            catalog_id: selectedCatalogItem.id,
            regular_price: parseFloat(newOffering.price) || 0,
            in_stock: true,
          });

        if (error) throw error;

        Alert.alert('Success', 'Product added successfully!');
        setShowAddModal(false);
        setSelectedCatalogItem(null);
        setNewOffering({});
        loadDashboard();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to add product');
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        let serviceId = newOffering.service_id;
        
        if (!serviceId) {
          const { data: serviceData, error: serviceError } = await supabase
            .from('service_catalog')
            .insert({
              name: newOffering.name || 'Untitled Service',
              category: category || 'General',
              description: newOffering.description || '',
              duration: newOffering.duration || '',
              is_active: true,
            })
            .select('id')
            .single();

          if (serviceError) throw serviceError;
          serviceId = serviceData.id;
        }

        if (!business.owner_id) {
          Alert.alert('Error', 'Business owner not found');
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from('provider_services')
          .insert({
            user_id: business.owner_id,
            service_id: serviceId,
            price: parseFloat(newOffering.price) || 0,
            is_active: true,
          });

        if (error) throw error;

        Alert.alert('Success', `${config.offeringLabel.slice(0, -1)} added successfully!`);
        setShowAddModal(false);
        setNewOffering({});
        loadDashboard();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to add offering');
      } finally {
        setSaving(false);
      }
    }
  };

  // --- Render Stats ---
  const renderStats = () => {
    const statItems = [
      { 
        icon: '💰', 
        label: config.stats[0] || 'Revenue', 
        value: `UGX ${stats.revenue?.toLocaleString() || 0}`,
        color: '#4A7DFF' 
      },
      { 
        icon: '📦', 
        label: config.stats[1] || 'Orders', 
        value: stats.activityCount?.toString() || '0',
        color: '#2ECC71' 
      },
      { 
        icon: '👥', 
        label: config.stats[2] || 'Customers', 
        value: stats.customers?.toString() || '0',
        color: '#F1C40F' 
      },
      { 
        icon: '📋', 
        label: config.stats[3] || 'Products', 
        value: stats.offerings?.toString() || '0',
        color: '#E74C3C' 
      },
    ];

    const lastStatIndex = statItems.length - 1;
    statItems[lastStatIndex].label = config.offeringLabel || 'Offerings';

    return (
      <View style={styles.statsGrid}>
        {statItems.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: stat.color + '10' }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  // --- Render Quick Actions ---
  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {(config.quickActions || []).map((action: string, index: number) => {
        let icon = '';
        let onPress = () => {};

        switch(action) {
          case 'Add Product':
          case 'Add Service':
          case 'Add Offering':
            icon = 'add-circle-outline';
            onPress = () => setShowAddModal(true);
            break;
          case 'View Orders':
          case 'View Bookings':
          case 'View Reservations':
            icon = 'list-outline';
            onPress = () => setActiveTab('activity');
            break;
          case 'Set Availability':
          case 'Business Hours':
            icon = 'time-outline';
            onPress = () => console.log('Set availability');
            break;
          case 'Analytics':
            icon = 'analytics-outline';
            onPress = () => console.log('Analytics');
            break;
          case 'Business Settings':
            icon = 'settings-outline';
            onPress = () => setActiveTab('business');
            break;
          default:
            icon = 'apps-outline';
        }

        return (
          <TouchableOpacity key={index} style={styles.quickAction} onPress={onPress}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(74, 125, 255, 0.1)' }]}>
              <Ionicons name={icon as any} size={24} color="#4A7DFF" />
            </View>
            <Text style={styles.quickActionLabel}>{action}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // --- Render Recent Activity ---
  const renderRecentActivity = () => (
    <View style={styles.recentActivity}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent {config.activityLabel}</Text>
        <TouchableOpacity onPress={() => setActiveTab('activity')}>
          <Text style={styles.sectionLink}>View All</Text>
        </TouchableOpacity>
      </View>
      {recentActivity.length === 0 ? (
        <Text style={styles.noDataText}>No {config.activityLabel.toLowerCase()} yet.</Text>
      ) : (
        recentActivity.map((item, index) => {
          const status = item.status || 'pending';
          const statusColors: Record<string, any> = {
            completed: { bg: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71' },
            pending: { bg: 'rgba(241, 196, 15, 0.1)', color: '#F1C40F' },
            confirmed: { bg: 'rgba(74, 125, 255, 0.1)', color: '#4A7DFF' },
            cancelled: { bg: 'rgba(231, 76, 60, 0.1)', color: '#E74C3C' },
          };
          const statusStyle = statusColors[status] || statusColors.pending;

          return (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>
                  {item.type || config.activityLabel.slice(0, -1)}
                </Text>
                <Text style={styles.activityAmount}>UGX {item.amount?.toLocaleString() || 0}</Text>
              </View>
              <View style={styles.activityFooter}>
                <Text style={styles.activityCustomer}>
                  {item.users?.full_name || 'Customer'}
                </Text>
                <View style={[styles.activityStatus, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.activityStatusText, { color: statusStyle.color }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // --- Render Offerings ---
  const renderOfferings = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{config.offeringLabel} ({offerings.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {offerings.length === 0 ? (
        <Text style={styles.noDataText}>No {config.offeringLabel.toLowerCase()} yet.</Text>
      ) : (
        offerings.map((item, index) => (
          <View key={index} style={styles.offeringCard}>
            {item.catalog?.images && item.catalog.images.length > 0 ? (
              <Image source={{ uri: item.catalog.images[0] }} style={styles.offeringImage} />
            ) : item.service_catalog?.images && item.service_catalog.images.length > 0 ? (
              <Image source={{ uri: item.service_catalog.images[0] }} style={styles.offeringImage} />
            ) : (
              <View style={[styles.offeringImage, styles.offeringImagePlaceholder]}>
                <Text style={styles.offeringImageText}>📦</Text>
              </View>
            )}
            <View style={styles.offeringInfo}>
              <Text style={styles.offeringName}>
                {item.catalog?.name || item.service_catalog?.name || item.name || 'Offering'}
              </Text>
              <Text style={styles.offeringPrice}>
                UGX {(item.regular_price || item.price || 0).toLocaleString()}
              </Text>
              <View style={styles.offeringStats}>
                {businessType === 'shop' ? (
                  <>
                    <Text style={styles.offeringStat}>👁️ {item.views || 0}</Text>
                    <Text style={styles.offeringStat}>🛒 {item.sales || 0}</Text>
                    <Text style={[styles.offeringStock, { color: item.in_stock ? '#2ECC71' : '#E74C3C' }]}>
                      {item.in_stock ? 'In Stock' : 'Out of Stock'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.offeringStat}>📅 {item.service_catalog?.duration || item.duration || 'N/A'}</Text>
                    <Text style={[styles.offeringStock, { color: item.is_active ? '#2ECC71' : '#E74C3C' }]}>
                      {item.is_active ? 'Available' : 'Unavailable'}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.offeringAction}>
              <Ionicons name="create-outline" size={20} color="#4A7DFF" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  // --- Render Activity ---
  const renderActivity = () => {
    const statuses = config.statuses || ['All', 'Pending', 'Completed', 'Cancelled'];

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{config.activityLabel}</Text>
          <View style={styles.filterChips}>
            {statuses.slice(0, 4).map((status: string) => (
              <TouchableOpacity key={status} style={[styles.filterChip, status === 'All' && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, status === 'All' && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {recentActivity.length === 0 ? (
          <Text style={styles.noDataText}>No {config.activityLabel.toLowerCase()} found.</Text>
        ) : (
          recentActivity.map((item, index) => {
            const status = item.status || 'pending';
            const statusColors: Record<string, any> = {
              completed: { bg: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71' },
              pending: { bg: 'rgba(241, 196, 15, 0.1)', color: '#F1C40F' },
              confirmed: { bg: 'rgba(74, 125, 255, 0.1)', color: '#4A7DFF' },
              cancelled: { bg: 'rgba(231, 76, 60, 0.1)', color: '#E74C3C' },
              'in progress': { bg: 'rgba(74, 125, 255, 0.1)', color: '#4A7DFF' },
            };
            const statusStyle = statusColors[status] || statusColors.pending;
            const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

            const actions = config.actions?.[status] || [];

            return (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityCardHeader}>
                  <Text style={styles.activityCardId}>#{item.reference || item.id?.slice(0, 8)}</Text>
                  <View style={[styles.activityCardStatus, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.activityCardStatusText, { color: statusStyle.color }]}>
                      {statusDisplay}
                    </Text>
                  </View>
                </View>
                <View style={styles.activityCardBody}>
                  <Text style={styles.activityCardCustomer}>
                    {item.users?.full_name || 'Customer'}
                  </Text>
                  <Text style={styles.activityCardAmount}>
                    UGX {item.amount?.toLocaleString() || 0}
                  </Text>
                </View>
                <View style={styles.activityCardActions}>
                  {actions.map((action: string) => (
                    <TouchableOpacity key={action} style={styles.activityCardAction}>
                      <Text style={styles.activityCardActionText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  // --- Render Wallet ---
  const renderWallet = () => (
    <View style={styles.tabContent}>
      <View style={styles.walletSummary}>
        <View style={styles.walletBalanceCard}>
          <Text style={styles.walletBalanceLabel}>Available Balance</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalanceAmount}>
              {balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}
            </Text>
            <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
              <Ionicons 
                name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#8A8AAE" 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.walletBalanceActions}>
            <TouchableOpacity style={styles.walletActionBtn}>
              <Ionicons name="arrow-down-outline" size={16} color="#FFFFFF" />
              <Text style={styles.walletActionBtnText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.walletActionBtn, styles.walletActionBtnSecondary]}>
              <Ionicons name="arrow-up-outline" size={16} color="#4A7DFF" />
              <Text style={styles.walletActionBtnTextSecondary}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.walletStats}>
          <View style={styles.walletStat}>
            <Text style={styles.walletStatValue}>UGX {walletBalance.toLocaleString()}</Text>
            <Text style={styles.walletStatLabel}>Total Earnings</Text>
          </View>
          <View style={styles.walletStatDivider} />
          <View style={styles.walletStat}>
            <Text style={styles.walletStatValue}>{recentActivity.length}</Text>
            <Text style={styles.walletStatLabel}>Transactions</Text>
          </View>
          <View style={styles.walletStatDivider} />
          <View style={styles.walletStat}>
            <Text style={styles.walletStatValue}>UGX 0</Text>
            <Text style={styles.walletStatLabel}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>View All</Text>
        </TouchableOpacity>
      </View>

      {walletTransactions.length === 0 ? (
        <Text style={styles.noDataText}>No transactions yet.</Text>
      ) : (
        walletTransactions.map((item, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionIcon, { backgroundColor: item.amount > 0 ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' }]}>
                <Ionicons name={item.amount > 0 ? 'arrow-down' : 'arrow-up'} size={16} color={item.amount > 0 ? '#2ECC71' : '#E74C3C'} />
              </View>
              <View>
                <Text style={styles.transactionTitle}>{item.type || 'Transaction'}</Text>
                <Text style={styles.transactionDate}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                </Text>
              </View>
            </View>
            <Text style={[styles.transactionAmount, { color: item.amount > 0 ? '#2ECC71' : '#E74C3C' }]}>
              {item.amount > 0 ? '+' : ''}UGX {Math.abs(item.amount || 0).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  // --- Render Business Settings ---
  const renderBusiness = () => (
    <View style={styles.tabContent}>
      <View style={styles.businessProfile}>
        <View style={styles.businessHeader}>
          <View style={styles.businessLogoContainer}>
            <View style={styles.businessLogo}>
              <Text style={styles.businessLogoText}>
                {business?.name?.charAt(0)?.toUpperCase() || 'B'}
              </Text>
            </View>
            <View style={[styles.businessVerified, { backgroundColor: business?.is_verified ? '#2ECC71' : '#F1C40F' }]}>
              <Text style={styles.businessVerifiedText}>
                {business?.is_verified ? '✓' : '⏳'}
              </Text>
            </View>
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business?.name || 'Business'}</Text>
            <Text style={styles.businessType}>{category || 'Uncategorized'}</Text>
            <Text style={styles.businessJoin}>
              {business?.is_active ? '🟢 Active' : '⏸️ Inactive'}
            </Text>
          </View>
          <TouchableOpacity style={styles.businessEditButton}>
            <Ionicons name="create-outline" size={20} color="#4A7DFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.businessStats}>
          <View style={styles.businessStat}>
            <Text style={styles.businessStatValue}>{stats.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.businessStatLabel}>⭐ Rating</Text>
          </View>
          <View style={styles.businessStatDivider} />
          <View style={styles.businessStat}>
            <Text style={styles.businessStatValue}>{stats.activityCount || 0}</Text>
            <Text style={styles.businessStatLabel}>{config.activityLabel}</Text>
          </View>
          <View style={styles.businessStatDivider} />
          <View style={styles.businessStat}>
            <Text style={styles.businessStatValue}>{offerings.length}</Text>
            <Text style={styles.businessStatLabel}>{config.offeringLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="image-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Logo & Cover</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="information-circle-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Business Description</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Operations</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="time-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Business Hours</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="location-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Location & Service Area</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Payments</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="wallet-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Payout Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="card-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Accepted Payment Methods</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.verificationItem}>
          <View style={[styles.verificationIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
          </View>
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Phone Verified</Text>
            <Text style={styles.verificationDesc}>Your phone number is verified</Text>
          </View>
        </View>
        <View style={[styles.verificationItem, { opacity: 0.6 }]}>
          <View style={[styles.verificationIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="document-text-outline" size={20} color="#FF9800" />
          </View>
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Business Documents</Text>
            <Text style={styles.verificationDesc}>Upload business registration</Text>
          </View>
          <TouchableOpacity style={styles.verificationButton}>
            <Text style={styles.verificationButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // --- Render Add Modal ---
  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowAddModal(false);
        setSelectedCatalogItem(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {businessType === 'shop' ? 'Add Product' : `Add ${config.offeringLabel.slice(0, -1)}`}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              setSelectedCatalogItem(null);
            }}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {businessType === 'shop' ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Search Catalog</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Search for a product..."
                    placeholderTextColor="#8A8AAE"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      searchCatalog(text);
                    }}
                  />
                </View>

                {catalogResults.length > 0 && (
                  <View style={styles.catalogResults}>
                    {catalogResults.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.catalogItem, selectedCatalogItem?.id === item.id && styles.catalogItemSelected]}
                        onPress={() => setSelectedCatalogItem(item)}
                      >
                        <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/40' }} style={styles.catalogImage} />
                        <View style={styles.catalogInfo}>
                          <Text style={styles.catalogName}>{item.name}</Text>
                          <Text style={styles.catalogCategory}>{item.category}</Text>
                        </View>
                        {selectedCatalogItem?.id === item.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedCatalogItem && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Price (UGX) *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Enter your price"
                        placeholderTextColor="#8A8AAE"
                        keyboardType="numeric"
                        value={newOffering.price}
                        onChangeText={(text) => setNewOffering({ ...newOffering, price: text })}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Stock Quantity *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Enter stock quantity"
                        placeholderTextColor="#8A8AAE"
                        keyboardType="numeric"
                        value={newOffering.stock}
                        onChangeText={(text) => setNewOffering({ ...newOffering, stock: text })}
                      />
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{config.offeringLabel.slice(0, -1)} Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={`Enter ${config.offeringLabel.slice(0, -1).toLowerCase()} name`}
                    placeholderTextColor="#8A8AAE"
                    value={newOffering.name}
                    onChangeText={(text) => setNewOffering({ ...newOffering, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Price (UGX) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter price"
                    placeholderTextColor="#8A8AAE"
                    keyboardType="numeric"
                    value={newOffering.price}
                    onChangeText={(text) => setNewOffering({ ...newOffering, price: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Duration</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 1 hour, 30 mins"
                    placeholderTextColor="#8A8AAE"
                    value={newOffering.duration}
                    onChangeText={(text) => setNewOffering({ ...newOffering, duration: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    placeholder="Describe your offering..."
                    placeholderTextColor="#8A8AAE"
                    multiline
                    numberOfLines={3}
                    value={newOffering.description}
                    onChangeText={(text) => setNewOffering({ ...newOffering, description: text })}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalSubmit, saving && styles.modalSubmitDisabled]}
              onPress={handleAddOffering}
              disabled={saving}
            >
              <LinearGradient
                colors={['#4A7DFF', '#6B94FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalSubmitGradient}
              >
                <Text style={styles.modalSubmitText}>
                  {saving ? 'Adding...' : `Add ${config.offeringLabel.slice(0, -1)}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // --- Render Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {renderStats()}
            {renderQuickActions()}
            {renderRecentActivity()}
          </>
        );
      case 'offerings':
        return renderOfferings();
      case 'activity':
        return renderActivity();
      case 'wallet':
        return renderWallet();
      case 'business':
        return renderBusiness();
      default:
        return null;
    }
  };

  // --- Tabs Configuration ---
  const getTabs = () => {
    return [
      { key: 'overview', icon: 'home-outline', label: 'Overview' },
      { key: 'offerings', icon: config.offeringIcon || 'cube-outline', label: config.offeringLabel },
      { key: 'activity', icon: config.activityIcon || 'receipt-outline', label: config.activityLabel },
      { key: 'wallet', icon: 'wallet-outline', label: 'Wallet' },
      { key: 'business', icon: 'business-outline', label: 'Business' },
    ];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={48} color="#8A8AAE" />
          <Text style={styles.emptyTitle}>No business found</Text>
          <Text style={styles.emptySubtitle}>Set up your business to start selling on Munolink.</Text>
          <TouchableOpacity style={styles.setupBtn} onPress={() => navigation.navigate('BusinessRegistration')}>
            <Text style={styles.setupBtnText}>Set Up Business</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = getTabs();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Dashboard</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#1F2F5F" />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerName}>{business.name}</Text>
          <Text style={styles.bannerType}>{category || 'Uncategorized'}</Text>
        </View>
        <View style={styles.bannerStatus}>
          <View style={[styles.bannerDot, { backgroundColor: business.is_active ? '#2ECC71' : '#F1C40F' }]} />
          <Text style={[styles.bannerStatusText, { color: business.is_active ? '#2ECC71' : '#F1C40F' }]}>
            {business.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.walletCompact} onPress={() => setActiveTab('wallet')}>
        <View style={styles.walletCompactLeft}>
          <Text style={styles.walletCompactLabel}>Wallet Balance</Text>
          <Text style={styles.walletCompactAmount}>
            {balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}
          </Text>
        </View>
        <View style={styles.walletCompactRight}>
          <Ionicons name="chevron-forward" size={20} color="#4A7DFF" />
        </View>
      </TouchableOpacity>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? '#4A7DFF' : '#8A8AAE'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
        }
      >
        {renderTabContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderAddModal()}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  bannerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  bannerType: {
    fontSize: 12,
    color: '#8A8AAE',
    marginTop: 2,
  },
  bannerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bannerStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  walletCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  walletCompactLeft: {
    flex: 1,
  },
  walletCompactLabel: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  walletCompactAmount: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  walletCompactRight: {
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A7DFF',
  },
  tabLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#4A7DFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContent: {
    paddingBottom: 8,
  },
  bottomSpacer: {
    height: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 42) / 2,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  statValue: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    minWidth: (width - 40) / 4 - 8,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    color: '#1F2F5F',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#1F2F5F',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionLink: {
    color: '#4A7DFF',
    fontSize: 12,
  },
  noDataText: {
    color: '#8A8AAE',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  recentActivity: {
    marginBottom: 8,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  activityAmount: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCustomer: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activityStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityCardId: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '600',
  },
  activityCardStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activityCardStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activityCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityCardCustomer: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  activityCardAmount: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  activityCardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  activityCardAction: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityCardActionText: {
    color: '#4A7DFF',
    fontSize: 11,
    fontWeight: '500',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 10,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#4A7DFF',
  },
  offeringCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    alignItems: 'center',
  },
  offeringImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
  },
  offeringImagePlaceholder: {
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offeringImageText: {
    fontSize: 24,
  },
  offeringInfo: {
    flex: 1,
  },
  offeringName: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  offeringPrice: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  offeringStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  offeringStat: {
    color: '#8A8AAE',
    fontSize: 10,
  },
  offeringStock: {
    fontSize: 10,
    fontWeight: '500',
  },
  offeringAction: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  walletSummary: {
    marginBottom: 16,
  },
  walletBalanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginBottom: 12,
  },
  walletBalanceLabel: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  walletBalanceAmount: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
  },
  walletBalanceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  walletActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4A7DFF',
    paddingVertical: 8,
    borderRadius: 8,
  },
  walletActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  walletActionBtnSecondary: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  walletActionBtnTextSecondary: {
    color: '#4A7DFF',
  },
  walletStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  walletStat: {
    flex: 1,
    alignItems: 'center',
  },
  walletStatValue: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  walletStatLabel: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 2,
  },
  walletStatDivider: {
    width: 1,
    backgroundColor: '#E8ECF4',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTitle: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  transactionDate: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 1,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  businessProfile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  businessLogoContainer: {
    position: 'relative',
  },
  businessLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessLogoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A7DFF',
  },
  businessVerified: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  businessVerifiedText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
  },
  businessType: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  businessJoin: {
    fontSize: 12,
    marginTop: 2,
  },
  businessEditButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  businessStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
  },
  businessStat: {
    alignItems: 'center',
  },
  businessStatValue: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  businessStatLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  businessStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8ECF4',
  },
  businessSections: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  settingsLabel: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 13,
    marginLeft: 10,
  },
  settingsArrow: {
    marginLeft: 8,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  verificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  verificationDesc: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  verificationButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  catalogResults: {
    marginBottom: 12,
    maxHeight: 200,
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8F9FC',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  catalogItemSelected: {
    borderColor: '#4A7DFF',
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
  },
  catalogImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 10,
  },
  catalogInfo: {
    flex: 1,
  },
  catalogName: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  catalogCategory: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubmit: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  formGroup: {
    gap: 4,
    marginBottom: 12,
  },
  formLabel: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F2F5F',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A8AAE',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  setupBtn: {
    backgroundColor: '#4A7DFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  setupBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});