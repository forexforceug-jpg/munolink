import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class BeautyTemplate extends BaseTemplate {
  name = 'Beauty';
  primaryColor = '#1A0A1A';
  accentColor = '#E91E8C';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.0) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Rating`);
    }
    signals.push('✅ Professional Products');
    signals.push('✨ Quality Service');
    return signals;
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.services) {
      benefits.push(`💄 ${opportunity.specifications.services}`);
    }
    if (opportunity.specifications?.products) {
      benefits.push(`🧴 ${opportunity.specifications.products}`);
    }
    if (opportunity.specifications?.experience) {
      benefits.push(`📅 ${opportunity.specifications.experience}`);
    }
    benefits.push('✨ Premium Experience');
    return benefits;
  }

  getCustomScenes(opportunity: Opportunity): Partial<Scene>[] {
    return [];
  }

  async generateAISummary(opportunity: Opportunity): Promise<string> {
    const specs = opportunity.specifications || {};
    const details = [
      specs.services && `Services: ${specs.services}`,
      specs.products && `Products: ${specs.products}`,
      specs.experience && `Experience: ${specs.experience}`,
    ].filter(Boolean);

    const detailsText = details.length > 0 ? details.join(', ') : 'beauty service';
    
    return `✨ AI Summary\n\n${opportunity.title} offers ${detailsText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}