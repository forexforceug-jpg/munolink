import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class LuxuryTemplate extends BaseTemplate {
  name = 'Luxury';
  primaryColor = '#0D0D0D';
  accentColor = '#C9A84C';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.5) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Premium`);
    }
    signals.push('👑 Luxury Collection');
    signals.push('✅ Verified Quality');
    return signals;
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.amenities) {
      benefits.push(`🏨 ${opportunity.specifications.amenities}`);
    }
    if (opportunity.specifications?.service) {
      benefits.push(`🤵 ${opportunity.specifications.service}`);
    }
    benefits.push('✨ Exclusive Experience');
    benefits.push('⭐ Premium Service');
    return benefits;
  }

  getCustomScenes(opportunity: Opportunity): Partial<Scene>[] {
    return [];
  }

  async generateAISummary(opportunity: Opportunity): Promise<string> {
    const specs = opportunity.specifications || {};
    const details = [
      specs.amenities && `Amenities: ${specs.amenities}`,
      specs.service && `Service: ${specs.service}`,
    ].filter(Boolean);

    const detailsText = details.length > 0 ? details.join(', ') : 'luxury experience';
    
    return `✨ AI Summary\n\n${opportunity.title} offers a ${detailsText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}