// src/features/opportunity/engine/SceneFactory.ts
import { Opportunity } from '../types/Opportunity';
import { Scene } from '../types/Scene';

export class SceneFactory {
  static createHero(opportunity: Opportunity, image: string): Scene {
    return {
      id: 'hero',
      type: 'hero',
      image: image,
      title: opportunity.title,
      content: `From ${opportunity.provider.name} · ${opportunity.location.area}`,
      data: {
        price: opportunity.price,
        currency: opportunity.currency || 'UGX',
        rating: opportunity.reviews.rating,
        provider: opportunity.provider.name,
        verified: opportunity.provider.verified,
      },
    };
  }

  static createDetails(opportunity: Opportunity, image: string): Scene {
    const details = [];
    for (const [key, value] of Object.entries(opportunity.attributes)) {
      if (key !== 'description' && value !== undefined) {
        details.push({ label: key, value: String(value) });
      }
    }

    return {
      id: 'details',
      type: 'details',
      image: image,
      title: 'What You Need to Know',
      content: opportunity.attributes.description || `Explore this ${opportunity.type} in detail.`,
      data: {
        details,
        category: opportunity.category,
        type: opportunity.type,
      },
    };
  }

  static createTrust(opportunity: Opportunity, image: string): Scene {
    const trustSignals = [];
    if (opportunity.provider.verified) trustSignals.push('✅ Verified Provider');
    if (opportunity.provider.yearsInBusiness && opportunity.provider.yearsInBusiness > 1) {
      trustSignals.push(`📅 ${opportunity.provider.yearsInBusiness}+ years in business`);
    }
    if (opportunity.reviews.rating > 4.0) {
      trustSignals.push(`⭐ ${opportunity.reviews.rating.toFixed(1)}/5 from ${opportunity.reviews.count} reviews`);
    }
    if (opportunity.warranty) trustSignals.push(`🛡️ ${opportunity.warranty}`);

    return {
      id: 'trust',
      type: 'trust',
      image: image,
      title: 'Why You Can Trust This',
      content: trustSignals.length > 0 ? trustSignals.join(' · ') : 'Trusted provider with quality service.',
      data: {
        signals: trustSignals,
        rating: opportunity.reviews.rating,
        reviewCount: opportunity.reviews.count,
        topReview: opportunity.reviews.topReview,
        verified: opportunity.provider.verified,
      },
    };
  }

  static createGallery(opportunity: Opportunity, image: string): Scene {
    const galleryImages = opportunity.images.slice(3, 5);
    const hasImages = galleryImages.length > 0;

    return {
      id: 'gallery',
      type: 'gallery',
      image: image,
      title: hasImages ? 'Explore More' : 'What You Get',
      content: hasImages 
        ? `Swipe to see ${galleryImages.length} more photos` 
        : `Get this amazing ${opportunity.type} at ${opportunity.provider.name}`,
      data: {
        images: galleryImages,
        totalImages: opportunity.images.length,
        hasMore: hasImages,
      },
    };
  }

  static createAction(opportunity: Opportunity, image: string): Scene {
    return {
      id: 'action',
      type: 'action',
      image: image,
      title: 'Ready to Decide?',
      content: `${opportunity.provider.name} · ${opportunity.location.area}`,
      data: {
        primaryAction: opportunity.actions.primary,
        secondaryActions: opportunity.actions.secondary || [],
        price: opportunity.price,
        currency: opportunity.currency || 'UGX',
        providerId: opportunity.provider.id,
        shopName: opportunity.provider.name,
        area: opportunity.location.area,
        inStock: opportunity.attributes.inStock !== false,
      },
    };
  }
}