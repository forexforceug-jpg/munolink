// src/features/feed/components/LocationPicker.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { locationService, UserLocation } from '../../../services/location.service';

const { height: screenHeight } = Dimensions.get('window');

interface LocationOption {
  id: string;
  label: string;
  location: UserLocation | null;
  region?: string;
  isDefault?: boolean;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: UserLocation | null, label: string) => void;
  currentLocationLabel: string;
  isLocationLoading: boolean;
}

// ✅ Common Ugandan cities for quick selection (not hardcoded, just suggestions)
const SUGGESTED_LOCATIONS: LocationOption[] = [
  { id: 'kampala', label: 'Kampala', location: { latitude: 0.3476, longitude: 32.5825, city: 'Kampala', region: 'Central', country: 'Uganda', formattedAddress: 'Kampala, Uganda' } as UserLocation, region: 'Central' },
  { id: 'jinja', label: 'Jinja', location: { latitude: 0.4200, longitude: 33.2040, city: 'Jinja', region: 'Eastern', country: 'Uganda', formattedAddress: 'Jinja, Uganda' } as UserLocation, region: 'Eastern' },
  { id: 'entebbe', label: 'Entebbe', location: { latitude: 0.0512, longitude: 32.4637, city: 'Entebbe', region: 'Central', country: 'Uganda', formattedAddress: 'Entebbe, Uganda' } as UserLocation, region: 'Central' },
  { id: 'gulu', label: 'Gulu', location: { latitude: 2.7808, longitude: 32.2999, city: 'Gulu', region: 'Northern', country: 'Uganda', formattedAddress: 'Gulu, Uganda' } as UserLocation, region: 'Northern' },
  { id: 'mbarara', label: 'Mbarara', location: { latitude: -0.6072, longitude: 30.6545, city: 'Mbarara', region: 'Western', country: 'Uganda', formattedAddress: 'Mbarara, Uganda' } as UserLocation, region: 'Western' },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  currentLocationLabel,
  isLocationLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<UserLocation | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  // ✅ Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Get actual GPS location for "Current Location"
  const getCurrentLocation = useCallback(async () => {
    setIsGettingGps(true);
    try {
      const loc = await locationService.getHighAccuracyLocation();
      if (loc) {
        setGpsLocation(loc);
      }
    } catch (error) {
      console.error('Error getting GPS location:', error);
    } finally {
      setIsGettingGps(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible, getCurrentLocation]);

  // ✅ Search for locations using OpenStreetMap Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use OpenStreetMap Nominatim for free geocoding
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Uganda')}&format=json&limit=10&addressdetails=1&countrycodes=UG`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Munolink-App/1.0',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data && data.length > 0) {
        const results: LocationOption[] = data.map((item: any, index: number) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const address = item.address || {};
          
          return {
            id: `search-${index}`,
            label: item.display_name.split(',')[0] || item.display_name,
            location: {
              latitude: lat,
              longitude: lng,
              city: address.city || address.town || address.village || address.hamlet || null,
              region: address.state || address.region || address.county || null,
              country: address.country || 'Uganda',
              formattedAddress: item.display_name || null,
            } as UserLocation,
            region: address.state || address.region || address.county || null,
          };
        });
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ✅ Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchLocations]);

  const handleSelect = (option: LocationOption) => {
    if (option.id === 'current') {
      const location = gpsLocation || null;
      const label = gpsLocation 
        ? locationService.formatLocation(gpsLocation)
        : 'Current Location';
      onSelectLocation(location, label);
    } else {
      onSelectLocation(option.location, option.label);
    }
    onClose();
  };

  const renderLocationItem = ({ item }: { item: LocationOption }) => {
    const isCurrent = item.id === 'current';
    const isSelected = item.label === currentLocationLabel || 
      (item.label && currentLocationLabel?.includes(item.label));

    return (
      <TouchableOpacity
        style={[
          styles.locationItem,
          isSelected && styles.locationItemSelected,
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.locationItemContent}>
          <View style={styles.locationItemLeft}>
            <Ionicons 
              name={isCurrent ? 'locate' : 'location-outline'} 
              size={20} 
              color={isCurrent ? '#4A7DFF' : (isSelected ? '#4A7DFF' : '#8A8AAE')} 
            />
            <Text style={[
              styles.locationItemLabel,
              isSelected && styles.locationItemLabelSelected,
              isCurrent && styles.currentLocationLabelText,
            ]}>
              {isCurrent && isGettingGps ? 'Getting GPS...' : item.label}
            </Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color="#4A7DFF" />
          )}
        </View>
        {item.region && !isCurrent && (
          <Text style={styles.locationRegion}>{item.region}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderCurrentLocation = () => {
    const isSelected = currentLocationLabel === 'Current Location' || 
      (gpsLocation && currentLocationLabel === locationService.formatLocation(gpsLocation));

    return (
      <TouchableOpacity
        style={[
          styles.currentLocationCard,
          isSelected && styles.locationItemSelected,
        ]}
        onPress={() => {
          if (gpsLocation) {
            handleSelect({ id: 'current', label: 'Current Location', location: gpsLocation });
          } else {
            getCurrentLocation();
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.currentLocationContent}>
          <View style={styles.currentLocationIcon}>
            <Ionicons name="locate" size={24} color="#4A7DFF" />
          </View>
          <View style={styles.currentLocationInfo}>
            <Text style={styles.currentLocationTitle}>Use Current Location</Text>
            <Text style={styles.currentLocationSubtitle}>
              {isGettingGps ? 'Getting GPS position...' : 
                gpsLocation ? locationService.formatLocation(gpsLocation) : 'Tap to detect'}
            </Text>
          </View>
          {isGettingGps && (
            <ActivityIndicator size="small" color="#4A7DFF" />
          )}
          {isSelected && !isGettingGps && (
            <Ionicons name="checkmark-circle" size={20} color="#4A7DFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Combine suggested locations with search results
  const displayLocations = useMemo(() => {
    if (searchQuery.length >= 2) {
      return searchResults;
    }
    return SUGGESTED_LOCATIONS;
  }, [searchQuery, searchResults]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#8A8AAE" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a city, town, or area..."
            placeholderTextColor="#6A7A9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            selectionColor="#4A7DFF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6A7A9E" />
            </TouchableOpacity>
          )}
          {isSearching && (
            <ActivityIndicator size="small" color="#4A7DFF" style={{ marginLeft: 8 }} />
          )}
        </View>

        {/* Current Location */}
        {renderCurrentLocation()}

        {/* Location List */}
        <FlatList
          data={displayLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          style={styles.locationList}
          contentContainerStyle={styles.locationListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            searchQuery.length >= 2 && displayLocations.length > 0 ? (
              <Text style={styles.searchResultHeader}>
                Search results for "{searchQuery}"
              </Text>
            ) : searchQuery.length >= 2 && displayLocations.length === 0 && !isSearching ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#3A3A4A" />
                <Text style={styles.emptyText}>No locations found</Text>
                <Text style={styles.emptySubtext}>Try searching for a different city or town</Text>
              </View>
            ) : (
              <Text style={styles.suggestedHeader}>Suggested Locations</Text>
            )
          }
        />

        {/* Bottom Hint */}
        <View style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>
            {searchQuery.length >= 2 
              ? `${displayLocations.length} locations found` 
              : `${SUGGESTED_LOCATIONS.length} suggested locations`}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  currentLocationCard: {
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  currentLocationSubtitle: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  locationList: {
    flex: 1,
  },
  locationListContent: {
    paddingBottom: 100,
  },
  searchResultHeader: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    marginBottom: 4,
  },
  suggestedHeader: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  locationItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#15151F',
  },
  locationItemSelected: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#4A7DFF',
  },
  locationItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationItemLabel: {
    fontSize: 15,
    color: '#D0D0E0',
  },
  locationItemLabelSelected: {
    color: '#4A7DFF',
    fontWeight: '600',
  },
  currentLocationLabelText: {
    color: '#4A7DFF',
  },
  locationRegion: {
    fontSize: 11,
    color: '#6A7A9E',
    marginTop: 2,
    marginLeft: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6A7A9E',
    marginTop: 4,
  },
  bottomHint: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A1A2E',
    backgroundColor: '#0D0D1A',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomHintText: {
    fontSize: 12,
    color: '#6A7A9E',
  },
});

export default LocationPicker;