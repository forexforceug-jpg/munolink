// src/hooks/useLocation.ts

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string | null;
  region: string | null;
  country: string | null;
  formattedAddress: string | null;
}

const LOCATION_STORAGE_KEY = '@user_location';

export const useLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // Load saved location from storage
  const loadSavedLocation = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLocation(parsed);
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Error loading saved location:', e);
      return null;
    }
  }, []);

  // Save location to storage
  const saveLocation = useCallback(async (loc: UserLocation) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } catch (e) {
      console.error('Error saving location:', e);
    }
  }, []);

  // Get current location from GPS
  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('Location permission denied');
        // Try to load saved location
        const saved = await loadSavedLocation();
        if (saved) {
          setLocation(saved);
        }
        setIsLoading(false);
        return saved;
      }

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const locationData: UserLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        city: geocode?.city || geocode?.district || null,
        region: geocode?.region || null,
        country: geocode?.country || null,
        formattedAddress: geocode?.formattedAddress || null,
      };

      setLocation(locationData);
      await saveLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
      // Try to load saved location as fallback
      const saved = await loadSavedLocation();
      if (saved) {
        setLocation(saved);
      }
      setIsLoading(false);
      return saved;
    }
  }, [loadSavedLocation, saveLocation]);

  // Update location manually (for dropdown selection)
  const updateLocation = useCallback(async (newLocation: UserLocation) => {
    setLocation(newLocation);
    await saveLocation(newLocation);
    return newLocation;
  }, [saveLocation]);

  // Initialize location on mount
  useEffect(() => {
    const initLocation = async () => {
      // First try to load saved location
      const saved = await loadSavedLocation();
      if (saved) {
        setLocation(saved);
        setIsLoading(false);
        // Still try to get fresh location in background
        getCurrentLocation();
      } else {
        // No saved location, get fresh
        await getCurrentLocation();
      }
    };
    initLocation();
  }, [getCurrentLocation, loadSavedLocation]);

  return {
    location,
    isLoading,
    error,
    permissionStatus,
    getCurrentLocation,
    updateLocation,
  };
};