// src/services/location.service.ts (Simplified version)

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

  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      if (this.currentLocation) {
        return this.currentLocation;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Location permission denied');
        // Return default location
        return this.getDefaultLocation();
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Try to get city name, but fallback gracefully
      let city = null;
      let region = null;
      let country = null;

      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        city = geocode?.city || geocode?.district || geocode?.subregion || null;
        region = geocode?.region || null;
        country = geocode?.country || null;
      } catch (geocodeError) {
        console.warn('Geocoding failed, using coordinates only');
        // Use coordinates as fallback location name
        city = `Lat ${location.coords.latitude.toFixed(2)}, Lng ${location.coords.longitude.toFixed(2)}`;
        region = 'Uganda';
        country = 'Uganda';
      }

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: city,
        region: region,
        country: country,
        formattedAddress: null,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      return this.getDefaultLocation();
    }
  }

  getDefaultLocation(): UserLocation {
    return {
      latitude: 0.4200,
      longitude: 33.2040,
      city: 'Jinja',
      region: 'Eastern',
      country: 'Uganda',
      formattedAddress: 'Jinja, Uganda',
    };
  }

  getCachedLocation(): UserLocation | null {
    return this.currentLocation;
  }

  formatLocation(location: UserLocation | null): string {
    if (!location) return 'Unknown location';
    return [location.city, location.region, location.country]
      .filter(Boolean)
      .join(', ');
  }

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

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
export default locationService;