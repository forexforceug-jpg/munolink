// Normalized Opportunity Object - Database agnostic
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
  };
  location: {
    area: string;
    distance?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  price: number;
  currency?: string;
  images: string[];  // Max 5 - mapped to scenes
  attributes: Record<string, any>;  // Flexible key-value pairs
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
    secondary?: ('share' | 'save' | 'compare')[];
    custom?: Record<string, any>;
  };
  source: 'product' | 'catalog' | 'shop' | 'user';
  createdAt: string;
}