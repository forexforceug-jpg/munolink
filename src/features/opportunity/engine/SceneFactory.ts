// src/features/opportunity/engine/SceneFactory.ts

import { Opportunity } from '../types/Opportunity';
import { Scene } from '../types/Scene';

export class SceneFactory {
  static createHero(opportunity: Opportunity, image: string): Scene {
    const isService = opportunity.type === 'service';
    
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
        type: opportunity.type,
        duration: opportunity.duration || null,
        isService: isService,
      },
    };
  }

  static createDetails(opportunity: Opportunity, image: string): Scene {
    const isService = opportunity.type === 'service';
    const details = [];
    
    for (const [key, value] of Object.entries(opportunity.attributes)) {
      if (key !== 'description' && value !== undefined) {
        details.push({ label: key, value: String(value) });
      }
    }

    // Add service-specific details
    if (isService && opportunity.duration) {
      details.push({ label: 'Duration', value: opportunity.duration });
    }
    if (isService && opportunity.duration_minutes) {
      details.push({ label: 'Estimated Time', value: `${opportunity.duration_minutes} minutes` });
    }
    if (!isService && opportunity.brand) {
      details.push({ label: 'Brand', value: opportunity.brand });
    }

    return {
      id: 'details',
      type: 'details',
      image: image,
      title: isService ? 'Service Details' : 'What You Need to Know',
      content: opportunity.attributes.description || 
        (isService ? `Professional ${opportunity.category} service` : `Explore this ${opportunity.type} in detail.`),
      data: {
        details,
        category: opportunity.category,
        type: opportunity.type,
        isService: isService,
        duration: opportunity.duration || null,
      },
    };
  }

  static createTrust(opportunity: Opportunity, image: string): Scene {
    const isService = opportunity.type === 'service';
    const trustSignals = [];
    
    if (opportunity.provider.verified) trustSignals.push('✅ Verified Provider');
    if (opportunity.provider.yearsInBusiness && opportunity.provider.yearsInBusiness > 1) {
      trustSignals.push(`📅 ${opportunity.provider.yearsInBusiness}+ years in business`);
    }
    if (opportunity.reviews.rating > 4.0) {
      trustSignals.push(`⭐ ${opportunity.reviews.rating.toFixed(1)}/5 from ${opportunity.reviews.count} reviews`);
    }
    if (isService && opportunity.duration) {
      trustSignals.push(`⏱️ ${opportunity.duration}`);
    }
    if (!isService && opportunity.attributes.inStock !== false) {
      trustSignals.push('📦 In Stock & Ready');
    }
    if (isService) {
      trustSignals.push('📋 Professional Service');
    }
    if (opportunity.warranty) {
      trustSignals.push(`🛡️ ${opportunity.warranty}`);
    }

    return {
      id: 'trust',
      type: 'trust',
      image: image,
      title: isService ? 'Why Choose This Service' : 'Why You Can Trust This',
      content: trustSignals.length > 0 ? trustSignals.join(' · ') : 'Trusted provider with quality service.',
      data: {
        signals: trustSignals,
        rating: opportunity.reviews.rating,
        reviewCount: opportunity.reviews.count,
        topReview: opportunity.reviews.topReview,
        verified: opportunity.provider.verified,
        isService: isService,
      },
    };
  }

  static createGallery(opportunity: Opportunity, image: string): Scene {
    // Get gallery images (up to 6)
    const galleryImages = opportunity.images.slice(3, 9); // Max 6 images
    const videoUri = opportunity.video || null;
    const isService = opportunity.type === 'service';
    const totalItems = galleryImages.length + (videoUri ? 1 : 0);

    let title = 'Explore More';
    let content = '';

    if (totalItems > 0) {
      if (videoUri && galleryImages.length > 0) {
        content = `${galleryImages.length} images and 1 video`;
      } else if (videoUri) {
        content = '1 video';
      } else {
        content = `${galleryImages.length} images`;
      }
    } else {
      content = isService 
        ? `Professional ${opportunity.category} service at ${opportunity.provider.name}` 
        : `Get this amazing ${opportunity.type} at ${opportunity.provider.name}`;
    }

    return {
      id: 'gallery',
      type: 'gallery',
      image: image,
      title: title,
      content: content,
      data: {
        images: galleryImages,
        video: videoUri,
        totalImages: opportunity.images.length,
        hasMore: galleryImages.length > 0,
        isService: isService,
        totalItems: totalItems,
      },
    };
  }

  static createAction(opportunity: Opportunity, image: string): Scene {
    const isService = opportunity.type === 'service';
    
    return {
      id: 'action',
      type: 'action',
      image: image,
      title: isService ? 'Ready to Book?' : 'Ready to Decide?',
      content: `${opportunity.provider.name} · ${opportunity.location.area}`,
      data: {
        primaryAction: isService ? 'book' : 'buy',
        secondaryActions: opportunity.actions.secondary || [],
        price: opportunity.price,
        currency: opportunity.currency || 'UGX',
        providerId: opportunity.provider.id,
        shopName: opportunity.provider.name,
        area: opportunity.location.area,
        inStock: opportunity.attributes.inStock !== false,
        isService: isService,
        duration: opportunity.duration || null,
      },
    };
  }
}