// src/features/feed/components/DirectionsBottomSheet.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Opportunity } from '../../../services/feed.service';

const { width, height } = Dimensions.get('window');

interface DirectionsBottomSheetProps {
  visible?: boolean;  // Made optional for desktop view
  opportunity: Opportunity | null;
  onClose: () => void;
  isDesktopView?: boolean;
  panelWidth?: number;
}

interface TransportOption {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  action: () => void;
}

export const DirectionsBottomSheet: React.FC<DirectionsBottomSheetProps> = ({
  visible = false,
  opportunity,
  onClose,
  isDesktopView = false,
  panelWidth = 340,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [distance, setDistance] = useState<string>('Calculating...');

  useEffect(() => {
    if ((visible || isDesktopView) && opportunity) {
      calculateDistance();
    }
  }, [visible, isDesktopView, opportunity]);

  const calculateDistance = () => {
    setLoading(true);
    setTimeout(() => {
      const distances = ['1.2 km', '2.5 km', '0.8 km', '3.1 km', '1.8 km'];
      const randomDistance = distances[Math.floor(Math.random() * distances.length)];
      setDistance(randomDistance);
      setLoading(false);
    }, 800);
  };

  const openMaps = (provider: 'google' | 'apple' | 'waze') => {
    if (!opportunity) return;

    const destination = encodeURIComponent(
      `${opportunity.shopName}, ${opportunity.area || 'Jinja, Uganda'}`
    );
    
    let url = '';

    switch (provider) {
      case 'google':
        url = Platform.OS === 'ios' 
          ? `comgooglemaps://?daddr=${destination}&directionsmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?daddr=${destination}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?q=${destination}&navigate=yes`;
        break;
    }

    setSelectedOption(provider);
    
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`);
    });
  };

  const getTransportOptions = (): TransportOption[] => [
    {
      id: 'driving',
      icon: 'car-outline',
      label: 'Driving',
      description: `~${distance}`,
      color: '#4A7DFF',
      action: () => openMaps('google'),
    },
    {
      id: 'walking',
      icon: 'walk-outline',
      label: 'Walking',
      description: `~${parseFloat(distance) * 3} min`,
      color: '#2ECC71',
      action: () => openMaps('google'),
    },
    {
      id: 'transit',
      icon: 'bus-outline',
      label: 'Public Transit',
      description: 'Available nearby',
      color: '#F1C40F',
      action: () => openMaps('google'),
    },
    {
      id: 'bicycle',
      icon: 'bicycle-outline',
      label: 'Bicycle',
      description: `~${parseFloat(distance) * 1.5} min`,
      color: '#E67E22',
      action: () => openMaps('google'),
    },
  ];

  const getMapAppOptions = (): TransportOption[] => [
    {
      id: 'google_maps',
      icon: 'logo-google',
      label: 'Google Maps',
      description: 'Turn-by-turn navigation',
      color: '#4285F4',
      action: () => openMaps('google'),
    },
    {
      id: 'apple_maps',
      icon: 'logo-apple',
      label: 'Apple Maps',
      description: 'Integrated navigation',
      color: '#34C759',
      action: () => openMaps('apple'),
    },
    {
      id: 'waze',
      icon: 'car-sport-outline',
      label: 'Waze',
      description: 'Real-time traffic',
      color: '#33CCFF',
      action: () => openMaps('waze'),
    },
  ];

  const transportOptions = getTransportOptions();
  const mapAppOptions = getMapAppOptions();

  // ============================================================
  // DESKTOP VIEW
  // ============================================================
  if (isDesktopView) {
    return (
      <View style={[styles.desktopContainer, { width: panelWidth }]}>
        <View style={styles.desktopHeader}>
          <View style={styles.desktopHeaderLeft}>
            <Ionicons name="location-outline" size={20} color="#4A7DFF" />
            <Text style={styles.desktopHeaderTitle}>Directions</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.desktopCloseButton}>
            <Ionicons name="close" size={20} color="#8A8AAE" />
          </TouchableOpacity>
        </View>

        {opportunity ? (
          <ScrollView style={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.shopInfoCard}>
              <View style={styles.shopIconContainer}>
                <Text style={styles.shopIconText}>
                  {opportunity.shopName?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </View>
              <View style={styles.shopInfoContent}>
                <Text style={styles.shopName}>{opportunity.shopName}</Text>
                <Text style={styles.shopAddress}>
                  {opportunity.area || 'Jinja, Uganda'}
                </Text>
                <View style={styles.distanceBadge}>
                  <Ionicons name="location-outline" size={12} color="#4A7DFF" />
                  <Text style={styles.distanceText}>{distance}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>🚗 How to get there</Text>
            <View style={styles.optionsGrid}>
              {transportOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    selectedOption === option.id && styles.optionCardSelected,
                  ]}
                  onPress={option.action}
                >
                  <View style={[styles.optionIconContainer, { backgroundColor: option.color + '20' }]}>
                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>🗺️ Open in Maps</Text>
            <View style={styles.mapAppsGrid}>
              {mapAppOptions.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.mapAppCard}
                  onPress={app.action}
                >
                  <View style={[styles.mapAppIconContainer, { backgroundColor: app.color + '20' }]}>
                    <Ionicons name={app.icon as any} size={24} color={app.color} />
                  </View>
                  <Text style={styles.mapAppLabel}>{app.label}</Text>
                  <Text style={styles.mapAppDescription}>{app.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="#4A7DFF" />
              <Text style={styles.shareButtonText}>Share Location</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No location selected</Text>
            <Text style={styles.emptySubtext}>Select an opportunity to get directions</Text>
          </View>
        )}
      </View>
    );
  }

  // ============================================================
  // MOBILE VIEW - Modal
  // ============================================================
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#8A8AAE" />
          </TouchableOpacity>

          {opportunity ? (
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📍 Directions</Text>
                <Text style={styles.modalSubtitle}>
                  Get directions to {opportunity.shopName}
                </Text>
              </View>

              <View style={styles.shopInfoCard}>
                <View style={styles.shopIconContainer}>
                  <Text style={styles.shopIconText}>
                    {opportunity.shopName?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                </View>
                <View style={styles.shopInfoContent}>
                  <Text style={styles.shopName}>{opportunity.shopName}</Text>
                  <Text style={styles.shopAddress}>
                    {opportunity.area || 'Jinja, Uganda'}
                  </Text>
                  {loading ? (
                    <View style={styles.loadingDistance}>
                      <ActivityIndicator size="small" color="#4A7DFF" />
                      <Text style={styles.loadingDistanceText}>Calculating...</Text>
                    </View>
                  ) : (
                    <View style={styles.distanceBadge}>
                      <Ionicons name="location-outline" size={12} color="#4A7DFF" />
                      <Text style={styles.distanceText}>{distance}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.sectionTitle}>🚗 How to get there</Text>
              <View style={styles.optionsGrid}>
                {transportOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      selectedOption === option.id && styles.optionCardSelected,
                    ]}
                    onPress={option.action}
                  >
                    <View style={[styles.optionIconContainer, { backgroundColor: option.color + '20' }]}>
                      <Ionicons name={option.icon as any} size={24} color={option.color} />
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>🗺️ Open in Maps</Text>
              <View style={styles.mapAppsGrid}>
                {mapAppOptions.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.mapAppCard}
                    onPress={app.action}
                  >
                    <View style={[styles.mapAppIconContainer, { backgroundColor: app.color + '20' }]}>
                      <Ionicons name={app.icon as any} size={24} color={app.color} />
                    </View>
                    <Text style={styles.mapAppLabel}>{app.label}</Text>
                    <Text style={styles.mapAppDescription}>{app.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={20} color="#4A7DFF" />
                <Text style={styles.shareButtonText}>Share Location</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyTitle}>No location selected</Text>
              <Text style={styles.emptySubtext}>Select an opportunity to get directions</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 16,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  desktopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  desktopCloseButton: {
    padding: 4,
  },
  desktopContent: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2A4F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    paddingVertical: 12,
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 2,
  },
  shopInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  shopIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74,125,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopIconText: {
    color: '#4A7DFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  shopInfoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  shopName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  shopAddress: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  loadingDistanceText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionCardSelected: {
    borderColor: '#4A7DFF',
    backgroundColor: 'rgba(74,125,255,0.05)',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  optionDescription: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  mapAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mapAppCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  mapAppIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  mapAppLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  mapAppDescription: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(74,125,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,125,255,0.15)',
    marginTop: 8,
  },
  shareButtonText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});