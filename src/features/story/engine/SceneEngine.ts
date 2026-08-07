import { Opportunity } from '../../../services/feed.service';

export interface Scene {
  id: string;
  type: 'hero' | 'details' | 'reviews' | 'location' | 'cta';
  title: string;
  content: string;
  image?: string;
  data?: any;
}

export class SceneEngine {
  private opportunity: Opportunity;

  constructor(opportunity: Opportunity) {
    this.opportunity = opportunity;
  }

  generateScenes(): Scene[] {
    return [
      this.createHeroScene(),
      this.createDetailsScene(),
      this.createReviewsScene(),
      this.createLocationScene(),
      this.createCTAScene(),
    ];
  }

  private createHeroScene(): Scene {
    return {
      id: 'hero',
      type: 'hero',
      title: this.opportunity.title,
      content: this.generateHeroContent(),
      image: this.opportunity.imageUrl,
      data: {
        price: this.opportunity.price,
        shopName: this.opportunity.shopName,
        rating: this.opportunity.rating,
      }
    };
  }

  private createDetailsScene(): Scene {
    return {
      id: 'details',
      type: 'details',
      title: 'Product Details',
      content: this.generateDetailsContent(),
      data: {
        category: this.opportunity.category,
        inStock: this.opportunity.inStock,
        specifications: this.opportunity.specifications || [],
      }
    };
  }

  private createReviewsScene(): Scene {
    return {
      id: 'reviews',
      type: 'reviews',
      title: 'What Others Say',
      content: this.generateReviewsContent(),
      data: {
        rating: this.opportunity.rating,
        reviewCount: this.opportunity.reviewCount || 0,
        topReview: this.opportunity.topReview || null,
      }
    };
  }

  private createLocationScene(): Scene {
    return {
      id: 'location',
      type: 'location',
      title: 'Location & Availability',
      content: this.generateLocationContent(),
      data: {
        area: this.opportunity.area,
        distance: this.opportunity.distance || '0.6 km',
        inStock: this.opportunity.inStock,
      }
    };
  }

  private createCTAScene(): Scene {
    return {
      id: 'cta',
      type: 'cta',
      title: 'Ready to Buy?',
      content: `Get ${this.opportunity.title} at ${this.opportunity.shopName}`,
      data: {
        shopId: this.opportunity.shopId,
        shopName: this.opportunity.shopName,
        price: this.opportunity.price,
      }
    };
  }

  private generateHeroContent(): string {
    const headlines = [
      `🔥 Best price on ${this.opportunity.title} today`,
      `⭐ Top-rated ${this.opportunity.category || 'product'} in your area`,
      `📦 ${this.opportunity.shopName} has it in stock now`,
      `🚚 Check out this amazing deal on ${this.opportunity.title}`,
    ];
    return headlines[Math.floor(Math.random() * headlines.length)];
  }

  private generateDetailsContent(): string {
    return `Complete specifications and features of ${this.opportunity.title}. Check availability and options.`;
  }

  private generateReviewsContent(): string {
    if (this.opportunity.rating && this.opportunity.rating > 4.0) {
      return `⭐ ${this.opportunity.rating.toFixed(1)}/5 - Highly recommended by customers!`;
    }
    return `Read what others are saying about ${this.opportunity.title}`;
  }

  private generateLocationContent(): string {
    return `📍 Located in ${this.opportunity.area || 'your area'} - ${this.opportunity.inStock ? 'In Stock!' : 'Check availability'}`;
  }
}