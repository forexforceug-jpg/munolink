// src/features/opportunity/engine/OpportunityFormatter.ts
import { Opportunity as NormalizedOpportunity } from '../types/Opportunity';
import { Opportunity as RawOpportunity } from '../../../services/feed.service';

export class OpportunityFormatter {
  static format(raw: RawOpportunity): NormalizedOpportunity {
    const images = this.normalizeImages(raw);
    
    return {
      id: raw.id,
      type: this.determineType(raw),
      title: raw.title,
      subtitle: this.generateSubtitle(raw),
      provider: {
        name: raw.shopName,
        id: raw.shopId,
        verified: (raw.rating || 0) > 4.0,
        yearsInBusiness: 1,
      },
      location: {
        area: raw.area || 'Near you',
        distance: raw.distance || '0.6 km',
      },
      price: raw.price,
      currency: raw.currency || 'UGX',
      images: images,  // ✅ NOW USES ALL 5 IMAGES
      attributes: this.buildAttributes(raw),
      reviews: {
        rating: raw.rating || 0,
        count: raw.reviewCount || 0,
        topReview: raw.topReview || undefined,
      },
      category: raw.category || 'General',
      delivery: this.buildDelivery(raw),
      warranty: undefined,
      actions: {
        primary: 'buy',
        secondary: ['share', 'save'],
      },
      source: 'product',
      createdAt: new Date().toISOString(),
    };
  }

  private static determineType(raw: RawOpportunity): 'product' | 'service' | 'event' {
    if (raw.category?.toLowerCase().includes('service')) return 'service';
    if (raw.category?.toLowerCase().includes('event')) return 'event';
    return 'product';
  }

  private static generateSubtitle(raw: RawOpportunity): string {
    const phrases = [
      `From ${raw.shopName}`,
      `⭐ ${raw.rating?.toFixed(1) || 'New'} · ${raw.area || 'Near you'}`,
      `🚚 ${raw.inStock ? 'In Stock' : 'Check Availability'}`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // ✅ UPDATED: Use the 5 images from catalogImages
  private static normalizeImages(raw: RawOpportunity): string[] {
    // Use the 5 images from catalog
    if (raw.catalogImages && raw.catalogImages.length > 0) {
      return raw.catalogImages.slice(0, 5);
    }
    
    // Fallback: single image
    if (raw.imageUrl) {
      return [raw.imageUrl];
    }
    
    // Final fallback: placeholder
    return ['https://via.placeholder.com/800x800/1F2F5F/FFFFFF?text=No+Image'];
  }

  private static buildAttributes(raw: RawOpportunity): Record<string, any> {
    const attrs: Record<string, any> = {};
    if (raw.category) attrs.category = raw.category;
    if (raw.inStock !== undefined) attrs.inStock = raw.inStock;
    if (raw.description) attrs.description = raw.description;
    if (raw.specifications) attrs.specifications = raw.specifications;
    return attrs;
  }

  private static buildDelivery(raw: RawOpportunity): { available: boolean; fee?: number; estimatedTime?: string } | undefined {
    if (!raw.inStock) return undefined;
    return {
      available: true,
      estimatedTime: '2-4 days',
    };
  }
}