import { Opportunity } from '../../../../services/feed.service';
import { Scene } from '../../engine/StoryEngine';

export interface StoryTemplate {
  name: string;
  primaryColor: string;
  accentColor: string;
  
  getTrustSignals(opportunity: Opportunity): string[];
  getBenefits(opportunity: Opportunity): string[];
  getCustomScenes(opportunity: Opportunity): Partial<Scene>[];
  generateAISummary(opportunity: Opportunity): Promise<string>;
}

export abstract class BaseTemplate implements StoryTemplate {
  name: string = 'base';
  primaryColor: string = '#1F2F5F';
  accentColor: string = '#4A7DFF';

  abstract getTrustSignals(opportunity: Opportunity): string[];
  abstract getBenefits(opportunity: Opportunity): string[];
  abstract getCustomScenes(opportunity: Opportunity): Partial<Scene>[];
  
  async generateAISummary(opportunity: Opportunity): Promise<string> {
    // Base AI summary - can be overridden by templates
    return `✨ AI Summary\n\n${opportunity.title} from ${opportunity.shopName}. ${opportunity.description || 'A great opportunity!'}`;
  }
}