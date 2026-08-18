// src/utils/typeHelpers.ts

export type ItemType = 'product' | 'service' | 'event' | 'other';

/**
 * Map item type to a valid type for tracking
 * Events and others are mapped to 'service' for now
 */
export const mapItemType = (type?: string): 'product' | 'service' => {
  if (type === 'product') return 'product';
  // Map 'event', 'other', and any other types to 'service'
  return 'service';
};

/**
 * Check if a type is valid for tracking
 */
export const isValidItemType = (type?: string): boolean => {
  return type === 'product' || type === 'service' || type === 'event';
};