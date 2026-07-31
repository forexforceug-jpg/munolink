import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class MedicalTemplate extends BaseTemplate {
  name = 'Medical';
  primaryColor = '#FFFFFF';
  accentColor = '#2ECC71';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.0) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Rating`);
    }
    if (opportunity.specifications?.certification) {
      signals.push(`🏥 ${opportunity.specifications.certification}`);
    }
    signals.push('✅ Licensed');
    signals.push('⚕️ Qualified Professional');
    return signals;
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.specialty) {
      benefits.push(`💉 ${opportunity.specifications.specialty}`);
    }
    if (opportunity.specifications?.experience) {
      benefits.push(`📅 ${opportunity.specifications.experience}`);
    }
    if (opportunity.specifications?.availability) {
      benefits.push(`📅 ${opportunity.specifications.availability}`);
    }
    benefits.push('🏥 Quality Healthcare');
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

    const detailsText = details.length > 0 ? details.join(', ') : 'medical service';
    
    return `✨ AI Summary\n\n${opportunity.title} is a ${detailsText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}