import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class IndustrialTemplate extends BaseTemplate {
  name = 'Industrial';
  primaryColor = '#1A1A1A';
  accentColor = '#E67E22';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.0) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Rating`);
    }
    if (opportunity.specifications?.certification) {
      signals.push(`🔧 ${opportunity.specifications.certification}`);
    }
    signals.push('✅ Industrial Grade');
    return signals;
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.machinery) {
      benefits.push(`⚙️ ${opportunity.specifications.machinery}`);
    }
    if (opportunity.specifications?.safety) {
      benefits.push(`🛡️ ${opportunity.specifications.safety}`);
    }
    if (opportunity.specifications?.experience) {
      benefits.push(`📅 ${opportunity.specifications.experience}`);
    }
    benefits.push('🔧 Professional Service');
    return benefits;
  }

  getCustomScenes(opportunity: Opportunity): Partial<Scene>[] {
    return [];
  }

  async generateAISummary(opportunity: Opportunity): Promise<string> {
    const specs = opportunity.specifications || {};
    const details = [
      specs.machinery && `Machinery: ${specs.machinery}`,
      specs.safety && `Safety: ${specs.safety}`,
      specs.certification && `Certified: ${specs.certification}`,
    ].filter(Boolean);

    const detailsText = details.length > 0 ? details.join(', ') : 'industrial service';
    
    return `✨ AI Summary\n\n${opportunity.title} provides ${detailsText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}