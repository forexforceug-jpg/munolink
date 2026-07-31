import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class FashionTemplate extends BaseTemplate {
  name = 'Fashion';
  primaryColor = '#1A1A2E';
  accentColor = '#FFD700';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.0) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Rating`);
    }
    signals.push('✅ Premium Quality');
    return signals;
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.material) {
      benefits.push(`👕 Material: ${opportunity.specifications.material}`);
    }
    if (opportunity.specifications?.style) {
      benefits.push(`✨ Style: ${opportunity.specifications.style}`);
    }
    if (opportunity.specifications?.fabric) {
      benefits.push(`🧵 Fabric: ${opportunity.specifications.fabric}`);
    }
    benefits.push('👗 Latest Collection');
    return benefits;
  }

  getCustomScenes(opportunity: Opportunity): Partial<Scene>[] {
    return [];
  }

  async generateAISummary(opportunity: Opportunity): Promise<string> {
    const specs = opportunity.specifications || {};
    const details = [
      specs.material && `Material: ${specs.material}`,
      specs.style && `Style: ${specs.style}`,
      specs.fabric && `Fabric: ${specs.fabric}`,
    ].filter(Boolean);

    const detailsText = details.length > 0 ? details.join(', ') : 'fashionable item';
    
    return `✨ AI Summary\n\n${opportunity.title} is a ${detailsText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}