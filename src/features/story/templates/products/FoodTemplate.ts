import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class FoodTemplate extends BaseTemplate {
  name = 'Food';
  primaryColor = '#2C1810';
  accentColor = '#E74C3C';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.0) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Rating`);
    }
    signals.push('🍽️ Freshly Made');
    signals.push('✅ Hygienic');
    return signals;
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.cuisine) {
      benefits.push(`🍜 Cuisine: ${opportunity.specifications.cuisine}`);
    }
    if (opportunity.specifications?.ingredients) {
      benefits.push(`🥬 Fresh Ingredients`);
    }
    if (opportunity.specifications?.delivery) {
      benefits.push(`🚚 ${opportunity.specifications.delivery}`);
    }
    benefits.push('⭐ Customer Favorites');
    return benefits;
  }

  getCustomScenes(opportunity: Opportunity): Partial<Scene>[] {
    return [];
  }

  async generateAISummary(opportunity: Opportunity): Promise<string> {
    const specs = opportunity.specifications || {};
    const details = [
      specs.cuisine && `Cuisine: ${specs.cuisine}`,
      specs.ingredients && `Fresh Ingredients`,
    ].filter(Boolean);

    const detailsText = details.length > 0 ? details.join(', ') : 'delicious food';
    
    return `✨ AI Summary\n\n${opportunity.title} offers ${detailsText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}