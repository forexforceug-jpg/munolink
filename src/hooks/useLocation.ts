// src/hooks/useLocation.ts

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService, UserLocation } from '../services/location.service';

const LOCATION_STORAGE_KEY = '@user_location';

export const useLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [gpsHistory, setGpsHistory] = useState<UserLocation[]>([]);

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

  const saveLocation = useCallback(async (loc: UserLocation) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } catch (e) {
      console.error('Error saving location:', e);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('Location permission denied');
        const saved = await loadSavedLocation();
        if (saved) {
          setLocation(saved);
        }
        setIsLoading(false);
        return saved;
      }

      const locationData = await locationService.getHighAccuracyLocation();
      
      if (locationData) {
        setLocation(locationData);
        await saveLocation(locationData);
        setGpsHistory(locationService.getLocationHistory());
      }

      setIsLoading(false);
      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
      const saved = await loadSavedLocation();
      if (saved) {
        setLocation(saved);
      }
      setIsLoading(false);
      return saved;
    }
  }, [loadSavedLocation, saveLocation]);

  const startTracking = useCallback(async (options?: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  }) => {
    try {
      const subscription = await locationService.watchGPSLocation(
        (newLocation) => {
          setLocation(newLocation);
          setGpsHistory(locationService.getLocationHistory());
        },
        options
      );
      setIsTracking(true);
      return subscription;
    } catch (error) {
      console.error('Error starting tracking:', error);
      setError('Failed to start GPS tracking');
      return null;
    }
  }, []);

  const stopTracking = useCallback(() => {
    locationService.stopGPSWatch();
    setIsTracking(false);
  }, []);

  const getGPSStatus = useCallback(async () => {
    return await locationService.getGPSStatus();
  }, []);

  const searchPlaces = useCallback(async (query: string) => {
    const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(query)}` +
        `&components=country:ug` +
        `&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      return data.predictions || [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string) => {
    const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}` +
        `&fields=geometry,formatted_address,address_component` +
        `&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const locationData: UserLocation = {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          city: null,
          region: null,
          country: null,
          formattedAddress: result.formatted_address || null,
          placeId: placeId,
          accuracy: null,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          timestamp: Date.now(),
          gpsProvider: 'unknown',
          horizontalAccuracy: null,
          verticalAccuracy: null,
        };
        
        const components = result.address_components || [];
        for (const component of components) {
          if (component.types.includes('locality') || component.types.includes('postal_town')) {
            locationData.city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            locationData.region = component.long_name;
          }
          if (component.types.includes('country')) {
            locationData.country = component.long_name;
          }
        }
        
        return locationData;
      }
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }, []);

  const updateLocation = useCallback(async (newLocation: UserLocation) => {
    setLocation(newLocation);
    await saveLocation(newLocation);
    return newLocation;
  }, [saveLocation]);

  useEffect(() => {
    const initLocation = async () => {
      const saved = await loadSavedLocation();
      if (saved) {
        setLocation(saved);
        setIsLoading(false);
        getCurrentLocation();
      } else {
        await getCurrentLocation();
      }
    };
    initLocation();

    return () => {
      stopTracking();
    };
  }, [getCurrentLocation, loadSavedLocation, stopTracking]);

  return {
    location,
    isLoading,
    isTracking,
    error,
    permissionStatus,
    gpsHistory,
    getCurrentLocation,
    startTracking,
    stopTracking,
    updateLocation,
    getGPSStatus,
    searchPlaces,
    getPlaceDetails,
  };
};