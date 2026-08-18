// src/services/location.service.ts

import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string | null;
  region: string | null;
  country: string | null;
  formattedAddress: string | null;
}

class LocationService {
  private currentLocation: UserLocation | null = null;
  private watchId: Location.LocationSubscription | null = null;

  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      if (this.currentLocation) {
        return this.currentLocation;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: geocode?.city || geocode?.district || null,
        region: geocode?.region || null,
        country: geocode?.country || null,
        formattedAddress: geocode?.formattedAddress || null,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async startWatchingLocation(
    onLocationUpdate: (location: UserLocation) => void
  ): Promise<void> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 100,
        },
        async (location) => {
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          const userLocation: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            city: geocode?.city || geocode?.district || null,
            region: geocode?.region || null,
            country: geocode?.country || null,
            formattedAddress: geocode?.formattedAddress || null,
          };

          this.currentLocation = userLocation;
          onLocationUpdate(userLocation);
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
    }
  }

  stopWatchingLocation(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  getCachedLocation(): UserLocation | null {
    return this.currentLocation;
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  formatLocation(location: UserLocation | null): string {
    if (!location) return 'Unknown location';
    return [location.city, location.region, location.country]
      .filter(Boolean)
      .join(', ');
  }

  isWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusKm;
  }

  async isLocationAvailable(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }
}

export const locationService = new LocationService();
export default locationService;