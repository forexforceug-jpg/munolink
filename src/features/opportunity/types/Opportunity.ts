// src/features/opportunity/types/Opportunity.ts

export interface Opportunity {
  id: string;
  type: 'product' | 'service' | 'event';
  title: string;
  subtitle?: string;
  provider: {
    name: string;
    id: string;
    verified: boolean;
    yearsInBusiness?: number;
    type?: 'shop' | 'service_provider' | 'institution';
  };
  location: {
    area: string;
    distance?: string;
  };
  price: number;
  currency: string;
  images: string[];
  attributes: Record<string, any>;
  reviews: {
    rating: number;
    count: number;
    topReview?: string;
  };
  category: string;
  delivery?: {
    available: boolean;
    fee?: number;
    estimatedTime?: string;
  };
  warranty?: string;
  actions: {
    primary: 'buy' | 'book' | 'contact' | 'view';
    secondary: string[];
  };
  source: 'product' | 'service' | 'event';
  createdAt: string;
  // Service-specific fields
  duration?: string;
  duration_minutes?: number;
  // Product-specific fields
  brand?: string;
  inStock?: boolean;
}