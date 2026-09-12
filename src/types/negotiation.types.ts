// src/types/negotiation.types.ts

export interface NegotiationThread {
  id: string;
  cart_item_id: string;
  buyer_id: string;
  seller_id: string;
  seller_shop_id?: string;
  item_id: string;
  item_type: 'product' | 'service';
  original_price: number;
  current_offer?: number;
  quantity: number;
  delivery_needed: boolean;
  delivery_fee: number;
  delivery_address?: string;
  want_date?: string;
  specifications?: string;
  status: 'active' | 'accepted' | 'declined' | 'expired' | 'completed';
  accepted_price?: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface NegotiationMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: 'offer' | 'counter_offer' | 'accept' | 'decline' | 'text' | 'counter_offer_with_price' | 'initial_offer';
  price?: number;
  quantity?: number;
  delivery_needed?: boolean;
  delivery_fee?: number;
  delivery_address?: string;
  want_date?: string;
  specifications?: string;
  custom_message?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithNegotiation {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'product' | 'service';
  quantity: number;
  price: number;
  shop_id: string;
  negotiated_price?: number;
  negotiation_status: 'pending' | 'negotiating' | 'accepted' | 'declined' | 'completed' | 'checkout_ready';
  selected_seller_id?: string;
  delivery_needed: boolean;
  delivery_address?: string;
  want_date?: string;
  specifications?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  item_name?: string;
  item_image?: string;
  shop_name?: string;
  seller_name?: string;
  available_sellers?: SellerOption[];
  thread?: NegotiationThread;
}

export interface SellerOption {
  seller_id: string;
  seller_name: string;
  shop_id: string;
  shop_name: string;
  price: number;
  distance_km?: number;
  is_available: boolean;
  is_selected: boolean;
  rating?: number;
  avatar?: string;
}

export interface NegotiationOffer {
  price: number;
  quantity: number;
  delivery_needed: boolean;
  delivery_address?: string;
  want_date?: string;
  specifications?: string;
  custom_message?: string;
}

export interface CounterOffer {
  price: number;
  custom_message?: string;
}

export interface NegotiationResponse {
  thread_id: string;
  action: 'accept' | 'decline' | 'counter';
  price?: number;
  custom_message?: string;
}