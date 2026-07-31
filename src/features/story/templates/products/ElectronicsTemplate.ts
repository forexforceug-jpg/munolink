import { BaseTemplate } from '../base/StoryTemplate';
import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export class ElectronicsTemplate extends BaseTemplate {
  name = 'Electronics';
  primaryColor = '#1F2F5F';
  accentColor = '#4A7DFF';

  getTrustSignals(opportunity: Opportunity): string[] {
    const signals = [];
    if (opportunity.rating && opportunity.rating > 4.0) {
      signals.push(`⭐ ${opportunity.rating.toFixed(1)} ★ Rating`);
    }
    if (opportunity.specifications?.warranty) {
      signals.push(`✅ Official Warranty`);
    } else {
      signals.push(`✅ Verified Seller`);
    }
    return signals.length > 0 ? signals : ['✅ Verified Shop'];
  }

  getBenefits(opportunity: Opportunity): string[] {
    const benefits = [];
    if (opportunity.specifications?.performance) {
      benefits.push(`⚡ ${opportunity.specifications.performance}`);
    }
    if (opportunity.specifications?.battery) {
      benefits.push(`🔋 ${opportunity.specifications.battery}`);
    }
    if (opportunity.specifications?.camera) {
      benefits.push(`📸 ${opportunity.specifications.camera}`);
    }
    if (opportunity.specifications?.warranty) {
      benefits.push(`🛡️ ${opportunity.specifications.warranty}`);
    }
    if (opportunity.inStock) {
      benefits.push('📦 In Stock');
    }
    return benefits.length > 0 ? benefits : ['✅ Quality Product', '✅ Trusted Seller'];
  }

  getCustomScenes(opportunity: Opportunity): Partial<Scene>[] {
    return [];
  }

  async generateAISummary(opportunity: Opportunity): Promise<string> {
    const specs = opportunity.specifications || {};
    const keyFeatures = [
      specs.processor && `Processor: ${specs.processor}`,
      specs.ram && `RAM: ${specs.ram}`,
      specs.storage && `Storage: ${specs.storage}`,
      specs.battery && `Battery: ${specs.battery}`,
      specs.camera && `Camera: ${specs.camera}`,
    ].filter(Boolean);

    const featuresText = keyFeatures.length > 0 ? keyFeatures.join(', ') : 'great features';
    
    return `✨ AI Summary\n\n${opportunity.title} is a high-performance device featuring ${featuresText}. Available at ${opportunity.shopName} for ${opportunity.currency} ${opportunity.price.toLocaleString()}. ${opportunity.area ? `Located ${opportunity.area}.` : ''}`;
  }
}