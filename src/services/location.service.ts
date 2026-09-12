// src/services/location.service.ts

import * as Location from 'expo-location';
import { Platform } from 'react-native';

// ✅ Get Supabase project URL from environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ffbjvrwkvnwocuyapajo.supabase.co';
const SUPABASE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/places-reverse-geocode`;

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
  city: string | null;
  region: string | null;
  country: string | null;
  formattedAddress: string | null;
  placeId?: string | null;
  gpsProvider?: 'gps' | 'network' | 'fused' | 'unknown';
  horizontalAccuracy?: number | null;
  verticalAccuracy?: number | null;
  street?: string | null;
  streetNumber?: string | null;
  district?: string | null;
  subregion?: string | null;
  postalCode?: string | null;
  name?: string | null;
  houseName?: string | null;
}

class LocationService {
  private currentLocation: UserLocation | null = null;
  private watchSubscription: Location.LocationSubscription | null = null;
  private locationUpdates: UserLocation[] = [];

  // ============================================================
  // GET HIGH ACCURACY GPS LOCATION
  // ============================================================
  async getHighAccuracyLocation(): Promise<UserLocation | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return this.getDefaultLocation();
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      console.log('📍 GPS Location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      // ✅ Get exact address from OpenStreetMap via Supabase Edge Function
      const placeInfo = await this.getExactAddressFromCoords(
        location.coords.latitude,
        location.coords.longitude
      );

      const locationData: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude || null,
        altitudeAccuracy: location.coords.altitudeAccuracy || null,
        heading: location.coords.heading || null,
        speed: location.coords.speed || null,
        timestamp: location.timestamp,
        horizontalAccuracy: location.coords.accuracy || null,
        verticalAccuracy: location.coords.altitudeAccuracy || null,
        gpsProvider: this.detectGPSProvider(),
        ...placeInfo,
      };

      this.currentLocation = locationData;
      this.locationUpdates.push(locationData);
      
      if (this.locationUpdates.length > 100) {
        this.locationUpdates.shift();
      }

      return locationData;
    } catch (error) {
      console.error('Error getting high accuracy location:', error);
      return this.currentLocation || this.getDefaultLocation();
    }
  }

  // ============================================================
  // GET EXACT ADDRESS FROM COORDINATES - OpenStreetMap
  // ============================================================
  private async getExactAddressFromCoords(
    lat: number,
    lng: number
  ): Promise<{ 
    city: string | null; 
    region: string | null; 
    country: string | null; 
    formattedAddress: string | null; 
    placeId: string | null;
    street: string | null;
    streetNumber: string | null;
    district: string | null;
    subregion: string | null;
    postalCode: string | null;
    name: string | null;
    houseName: string | null;
  }> {
    
    // ============================================================
    // TRY 1: OpenStreetMap via Supabase Edge Function (FREE)
    // ============================================================
    try {
      const url = `${SUPABASE_FUNCTION_URL}?lat=${lat}&lng=${lng}`;
      console.log('📍 Fetching address from OpenStreetMap via Supabase...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('📍 OpenStreetMap Result:', result);

      if (result.success && result.data) {
        const data = result.data;
        return {
          city: data.city || null,
          region: data.region || null,
          country: data.country || null,
          formattedAddress: data.formatted_address || null,
          placeId: data.place_id || null,
          street: data.street || null,
          streetNumber: data.street_number || null,
          district: data.district || null,
          subregion: data.region || null,
          postalCode: data.postal_code || null,
          name: data.display_name || data.formatted_address || null,
          houseName: data.house_name || null,
        };
      }

      if (result.fallback) {
        console.warn('⚠️ OpenStreetMap returned fallback:', result.fallback);
        return {
          city: null,
          region: null,
          country: null,
          formattedAddress: result.fallback.formatted_address || null,
          placeId: null,
          street: null,
          streetNumber: null,
          district: null,
          subregion: null,
          postalCode: null,
          name: result.fallback.formatted_address || null,
          houseName: null,
        };
      }

      throw new Error(result.error || 'No location found');
      
    } catch (osmError) {
      console.warn('⚠️ OpenStreetMap failed, trying device geocoding:', osmError);
    }

    // ============================================================
    // TRY 2: Device's built-in reverse geocoding (fallback)
    // ============================================================
    try {
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      
      if (geocode) {
        console.log('📍 Device geocoding result:', geocode);
        
        const city = geocode.city || geocode.district || null;
        const region = geocode.region || null;
        const country = geocode.country || null;
        
        return {
          city: city,
          region: region,
          country: country,
          formattedAddress: geocode.formattedAddress || null,
          placeId: null,
          street: geocode.street || null,
          streetNumber: geocode.streetNumber || null,
          district: geocode.district || null,
          subregion: geocode.subregion || null,
          postalCode: geocode.postalCode || null,
          name: geocode.name || null,
          houseName: null,
        };
      }
    } catch (nativeError) {
      console.warn('⚠️ Device geocoding failed:', nativeError);
    }

    // ============================================================
    // TRY 3: Fallback to coordinates
    // ============================================================
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    const latStr = Math.abs(lat).toFixed(6);
    const lngStr = Math.abs(lng).toFixed(6);
    const coordsString = `${latStr}° ${latDir}, ${lngStr}° ${lngDir}`;
    
    console.log(`📍 Using exact GPS coordinates: ${coordsString}`);
    
    return {
      city: null,
      region: null,
      country: null,
      formattedAddress: coordsString,
      placeId: null,
      street: null,
      streetNumber: null,
      district: null,
      subregion: null,
      postalCode: null,
      name: coordsString,
      houseName: null,
    };
  }

  // ============================================================
  // GET EXACT GPS COORDINATES AS STRING
  // ============================================================
  getExactCoordinatesString(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
  }

  // ============================================================
  // GET EXACT LOCATION WITH STREET ADDRESS
  // ============================================================
  getExactLocationDisplay(location: UserLocation | null): string {
    if (!location) return 'Unknown location';
    
    // If we have a formatted address, use it
    if (location.formattedAddress && location.formattedAddress !== '') {
      return location.formattedAddress;
    }
    
    // If we have street info, show exact address
    if (location.street) {
      let address = location.street;
      if (location.streetNumber) {
        address += ` ${location.streetNumber}`;
      }
      if (location.district && location.district !== location.street) {
        address += `, ${location.district}`;
      }
      if (location.city && location.city !== location.district) {
        address += `, ${location.city}`;
      }
      return address;
    }
    
    // If we have city, show it with region
    if (location.city) {
      if (location.region && !location.city.includes(location.region)) {
        return `${location.city}, ${location.region}`;
      }
      return location.city;
    }
    
    // Fallback to exact coordinates
    if (location.latitude && location.longitude) {
      return this.getExactCoordinatesString(location.latitude, location.longitude);
    }
    
    return 'Unknown location';
  }

  // ============================================================
  // GET LOCATION WITH FULL DETAILS
  // ============================================================
  getDetailedLocationDisplay(location: UserLocation | null): {
    primary: string;
    secondary: string;
    coordinates: string;
    accuracy: string;
    fullAddress: string;
  } {
    if (!location) {
      return {
        primary: 'Unknown',
        secondary: '',
        coordinates: '',
        accuracy: 'Unknown',
        fullAddress: '',
      };
    }

    // Use formatted address if available
    if (location.formattedAddress) {
      const parts = location.formattedAddress.split(',');
      return {
        primary: parts[0]?.trim() || location.formattedAddress,
        secondary: parts.slice(1).join(',').trim() || '',
        coordinates: this.getExactCoordinatesString(location.latitude, location.longitude),
        accuracy: this.getAccuracyDescription(location.accuracy),
        fullAddress: location.formattedAddress,
      };
    }

    // Build from components
    let primary = location.street || location.name || location.city || '';
    if (location.street && location.streetNumber) {
      primary = `${location.street} ${location.streetNumber}`;
    }

    let secondary = '';
    if (location.district && location.district !== primary) {
      secondary = location.district;
    }
    if (location.city && location.city !== primary && location.city !== secondary) {
      secondary = secondary ? `${secondary}, ${location.city}` : location.city;
    }
    if (location.region && !secondary.includes(location.region)) {
      secondary = secondary ? `${secondary}, ${location.region}` : location.region;
    }
    if (location.country && !secondary.includes(location.country)) {
      secondary = secondary ? `${secondary}, ${location.country}` : location.country;
    }

    return {
      primary: primary || 'Unknown',
      secondary,
      coordinates: this.getExactCoordinatesString(location.latitude, location.longitude),
      accuracy: this.getAccuracyDescription(location.accuracy),
      fullAddress: [primary, secondary].filter(Boolean).join(', '),
    };
  }

  // ============================================================
  // WATCH GPS LOCATION
  // ============================================================
  async watchGPSLocation(
    callback: (location: UserLocation) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<Location.LocationSubscription | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return null;
      }

      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Highest,
          timeInterval: options?.timeInterval || 2000,
          distanceInterval: options?.distanceInterval || 5,
        },
        async (location) => {
          const placeInfo = await this.getExactAddressFromCoords(
            location.coords.latitude,
            location.coords.longitude
          );

          const locationData: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude || null,
            altitudeAccuracy: location.coords.altitudeAccuracy || null,
            heading: location.coords.heading || null,
            speed: location.coords.speed || null,
            timestamp: location.timestamp,
            gpsProvider: this.detectGPSProvider(),
            ...placeInfo,
          };

          this.currentLocation = locationData;
          this.locationUpdates.push(locationData);
          
          if (this.locationUpdates.length > 100) {
            this.locationUpdates.shift();
          }

          callback(locationData);
        }
      );

      return this.watchSubscription;
    } catch (error) {
      console.error('Error watching GPS location:', error);
      return null;
    }
  }

  // ============================================================
  // STOP GPS WATCH
  // ============================================================
  stopGPSWatch() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  // ============================================================
  // GET CURRENT LOCATION
  // ============================================================
  async getCurrentLocation(): Promise<UserLocation | null> {
    if (this.currentLocation?.timestamp) {
      const age = Date.now() - this.currentLocation.timestamp;
      if (age < 5000) {
        return this.currentLocation;
      }
    }
    return this.getHighAccuracyLocation();
  }

  // ============================================================
  // GET LOCATION HISTORY
  // ============================================================
  getLocationHistory(): UserLocation[] {
    return [...this.locationUpdates];
  }

  // ============================================================
  // DETECT GPS PROVIDER
  // ============================================================
  private detectGPSProvider(): 'gps' | 'network' | 'fused' | 'unknown' {
    if (Platform.OS === 'android') return 'gps';
    if (Platform.OS === 'ios') return 'fused';
    return 'unknown';
  }

  // ============================================================
  // GET GPS STATUS
  // ============================================================
  async getGPSStatus(): Promise<{
    isEnabled: boolean;
    isAuthorized: boolean;
    provider: string;
  }> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const isAuthorized = status === 'granted';
      const isEnabled = await Location.hasServicesEnabledAsync();
      
      return {
        isEnabled,
        isAuthorized,
        provider: Platform.OS === 'android' ? 'GPS' : 'GPS + Network',
      };
    } catch (error) {
      console.error('Error getting GPS status:', error);
      return {
        isEnabled: false,
        isAuthorized: false,
        provider: 'Unknown',
      };
    }
  }

  // ============================================================
  // GET DEFAULT LOCATION
  // ============================================================
  getDefaultLocation(): UserLocation {
    return {
      latitude: 0.4200,
      longitude: 33.2040,
      city: 'Jinja',
      region: 'Eastern',
      country: 'Uganda',
      formattedAddress: 'Jinja, Uganda',
      placeId: null,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      gpsProvider: 'unknown',
      horizontalAccuracy: null,
      verticalAccuracy: null,
      street: null,
      streetNumber: null,
      district: null,
      subregion: null,
      postalCode: null,
      name: null,
      houseName: null,
    };
  }

  // ============================================================
  // GET CACHED LOCATION
  // ============================================================
  getCachedLocation(): UserLocation | null {
    return this.currentLocation;
  }

  // ============================================================
  // FORMAT LOCATION
  // ============================================================
  formatLocation(location: UserLocation | null): string {
    return this.getExactLocationDisplay(location);
  }

  // ============================================================
  // FORMAT GPS COORDINATES
  // ============================================================
  formatGPSCoordinates(lat: number, lng: number): string {
    return this.getExactCoordinatesString(lat, lng);
  }

  // ============================================================
  // GET ACCURACY DESCRIPTION
  // ============================================================
  getAccuracyDescription(accuracy: number | null | undefined): string {
    if (!accuracy) return 'Unknown';
    if (accuracy < 5) return 'Excellent (±5m)';
    if (accuracy < 15) return 'Good (±15m)';
    if (accuracy < 50) return 'Fair (±50m)';
    return 'Poor (±50m+)';
  }

  // ============================================================
  // CALCULATE DISTANCE
  // ============================================================
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ============================================================
  // UTILITY: CONVERT DEGREES TO RADIANS
  // ============================================================
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
export default locationService;