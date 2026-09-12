// src/services/delivery.service.ts

export interface DeliveryEstimate {
  baseFee: number;
  perKmFee: number;
  totalFee: number;
  distanceKm: number;
  estimatedTime: string;
}

export class DeliveryService {
  // Base rates (can be configured in settings)
  private readonly BASE_DELIVERY_FEE = 5000;
  private readonly PER_KM_FEE = 1000;
  private readonly FREE_DELIVERY_THRESHOLD = 100000;
  private readonly MAX_DELIVERY_DISTANCE = 50;

  // ============================================================
  // CALCULATE DELIVERY FEE
  // ============================================================
  calculateDeliveryFee(
    sellerLat: number,
    sellerLng: number,
    buyerLat: number,
    buyerLng: number,
    totalPrice: number
  ): DeliveryEstimate {
    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(sellerLat, sellerLng, buyerLat, buyerLng);
    
    let baseFee = this.BASE_DELIVERY_FEE;
    let perKmFee = this.PER_KM_FEE;

    // Free delivery if total price exceeds threshold
    if (totalPrice >= this.FREE_DELIVERY_THRESHOLD) {
      baseFee = 0;
      perKmFee = 0;
    }

    // Distance-based calculation
    let totalFee = baseFee + (distance * perKmFee);

    // Cap at max distance
    if (distance > this.MAX_DELIVERY_DISTANCE) {
      totalFee = baseFee + (this.MAX_DELIVERY_DISTANCE * perKmFee);
    }

    // Estimate delivery time based on distance
    let estimatedTime = '30-45 minutes';
    if (distance > 10) {
      estimatedTime = '45-60 minutes';
    } else if (distance > 20) {
      estimatedTime = '1-2 hours';
    } else if (distance > 30) {
      estimatedTime = '2-3 hours';
    }

    return {
      baseFee,
      perKmFee,
      totalFee: Math.round(totalFee),
      distanceKm: Math.round(distance * 10) / 10,
      estimatedTime,
    };
  }

  // ============================================================
  // CALCULATE DISTANCE (Haversine formula)
  // ============================================================
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ============================================================
  // GET DELIVERY OPTIONS
  // ============================================================
  getDeliveryOptions(
    sellerLat: number,
    sellerLng: number,
    buyerLat: number,
    buyerLng: number,
    totalPrice: number
  ): {
    standard: DeliveryEstimate;
    express?: DeliveryEstimate;
    pickup?: { available: boolean; address: string };
  } {
    const standard = this.calculateDeliveryFee(
      sellerLat,
      sellerLng,
      buyerLat,
      buyerLng,
      totalPrice
    );

    // Express delivery (50% more expensive but faster)
    let express: DeliveryEstimate | undefined;
    if (standard.distanceKm < 20) {
      express = {
        ...standard,
        totalFee: Math.round(standard.totalFee * 1.5),
        estimatedTime: '15-30 minutes',
      };
    }

    // Pickup option
    const pickup = {
      available: true,
      address: 'Pickup at seller location',
    };

    return {
      standard,
      express,
      pickup,
    };
  }

  // ============================================================
  // VALIDATE DELIVERY ADDRESS
  // ============================================================
  validateAddress(address: string): {
    valid: boolean;
    message?: string;
    parts?: {
      street?: string;
      city?: string;
      district?: string;
      country?: string;
    };
  } {
    if (!address || address.trim().length < 5) {
      return {
        valid: false,
        message: 'Please enter a valid address (minimum 5 characters)',
      };
    }

    // Basic validation - check for common address components
    const hasStreet = /[a-zA-Z]/.test(address);
    const hasNumber = /\d/.test(address);
    const hasCity = /(kampala|jinja|entebbe|gulu|mbarara|masaka|mbale|arua|lira)/i.test(address);

    if (!hasStreet || !hasNumber) {
      return {
        valid: true, // Still valid but warn
        message: 'Please include street name and number for accurate delivery',
        parts: { city: hasCity ? 'Uganda' : undefined },
      };
    }

    return {
      valid: true,
      parts: {
        street: address,
        city: 'Uganda',
      },
    };
  }

  // ============================================================
  // GET DELIVERY ZONE
  // ============================================================
  getDeliveryZone(lat: number, lng: number): {
    zone: 'urban' | 'suburban' | 'rural';
    multiplier: number;
  } {
    // Simplified zone detection based on coordinates
    // In production, this would use a proper geofencing service
    const kampalaCenter = { lat: 0.3476, lng: 32.5825 };
    const distance = this.calculateDistance(lat, lng, kampalaCenter.lat, kampalaCenter.lng);

    if (distance < 10) {
      return { zone: 'urban', multiplier: 1.0 };
    } else if (distance < 25) {
      return { zone: 'suburban', multiplier: 1.3 };
    } else {
      return { zone: 'rural', multiplier: 1.6 };
    }
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;