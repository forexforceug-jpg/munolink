import { Opportunity } from '../../../services/feed.service';
import { SceneSelector } from './SceneSelector';
import { DataFormatter } from './DataFormatter';
import { StoryTemplate } from '../templates/base/StoryTemplate';

export interface Scene {
  id: string;
  type: 'cover' | 'specs' | 'seller' | 'benefits' | 'ai_summary' | 'custom';
  title?: string;
  content: any;
  image?: string;
  order: number;
}

export interface Story {
  id: string;
  opportunityId: string;
  scenes: Scene[];
  template: string;
  totalCards: number;
}

export class StoryEngine {
  private template: StoryTemplate;

  constructor(opportunity: Opportunity) {
    this.template = SceneSelector.selectTemplate(opportunity);
  }

  async generateStory(opportunity: Opportunity): Promise<Story> {
    const scenes: Scene[] = [];

    // Scene 1: Cover
    scenes.push({
      id: `cover-${opportunity.id}`,
      type: 'cover',
      content: {
        title: opportunity.title,
        shop: opportunity.shopName,
        price: opportunity.price,
        distance: opportunity.area,
        image: opportunity.imageUrl,
        rating: opportunity.rating,
      },
      order: 1,
    });

    // Scene 2: Specifications (AI-selected highlights)
    const specs = await DataFormatter.formatSpecs(opportunity.specifications);
    scenes.push({
      id: `specs-${opportunity.id}`,
      type: 'specs',
      content: specs,
      order: 2,
    });

    // Scene 3: Seller Info
    scenes.push({
      id: `seller-${opportunity.id}`,
      type: 'seller',
      content: {
        name: opportunity.shopName,
        rating: opportunity.rating,
        area: opportunity.area,
        trust: this.template.getTrustSignals(opportunity),
      },
      order: 3,
    });

    // Scene 4: Benefits (why buy here)
    const benefits = this.template.getBenefits(opportunity);
    scenes.push({
      id: `benefits-${opportunity.id}`,
      type: 'benefits',
      content: benefits,
      order: 4,
    });

    // Scene 5: AI Summary
    const aiSummary = await this.template.generateAISummary(opportunity);
    scenes.push({
      id: `ai-${opportunity.id}`,
      type: 'ai_summary',
      content: aiSummary,
      order: 5,
    });

    // Add custom scenes from template
    const customScenes = this.template.getCustomScenes(opportunity);
    customScenes.forEach((s: Partial<Scene>, index: number) => {
      scenes.push({
        id: `custom-${opportunity.id}-${index}`,
        type: s.type || 'custom',
        title: s.title,
        content: s.content || {},
        order: 5 + index + 1,
      });
    });

    return {
      id: `story-${opportunity.id}`,
      opportunityId: opportunity.id,
      scenes: scenes.sort((a, b) => a.order - b.order),
      template: this.template.name,
      totalCards: scenes.length,
    };
  }
}