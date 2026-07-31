import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class ProfessionalTemplate extends BaseTemplate {
  name = 'Professional';
  primaryColor = '#1A2A4F';
  accentColor = '#3498DB';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.0) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Rating`);
    }
    if (opportunity.specifications?.experience) {
      signals.push(`📅 ${opportunity.specifications.experience}`);
    }
    signals.push('✅ Professional');
    return signals;
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.specialty) {
      benefits.push(`🎯 ${opportunity.specifications.specialty}`);
    }
    if (opportunity.specifications?.certification) {
      benefits.push(`📜 ${opportunity.specifications.certification}`);
    }
    if (opportunity.specifications?.availability) {
      benefits.push(`📅 ${opportunity.specifications.availability}`);
    }
    benefits.push('🤝 Trusted Service');
    return benefits;
  }

  getCustomScenes(opportunity: Opportunity): Partial<Scene>[] {
    return [];
  }

  async generateAISummary(opportunity: Opportunity): Promise<string> {
    const specs = opportunity.specifications || {};
    const details = [
      specs.specialty && `Specialty: ${specs.specialty}`,
      specs.experience && `Experience: ${specs.experience}`,
      specs.certification && `Certified: ${specs.certification}`,
    ].filter(Boolean);

    const detailsText = details.length > 0 ? details.join(', ') : 'professional service';
    
    return `✨ AI Summary\n\n${opportunity.title} provides ${detailsText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}