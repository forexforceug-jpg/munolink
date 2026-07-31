import { Opportunity } from '../../../services/feed.service';
import { StoryTemplate } from '../templates/base/StoryTemplate';
import { ElectronicsTemplate } from '../templates/products/ElectronicsTemplate';
import { FashionTemplate } from '../templates/products/FashionTemplate';
import { FoodTemplate } from '../templates/products/FoodTemplate';
import { LuxuryTemplate } from '../templates/products/LuxuryTemplate';
import { ProfessionalTemplate } from '../templates/services/ProfessionalTemplate';
import { MedicalTemplate } from '../templates/services/MedicalTemplate';
import { BeautyTemplate } from '../templates/services/BeautyTemplate';
import { IndustrialTemplate } from '../templates/services/IndustrialTemplate';

export class SceneSelector {
  static selectTemplate(opportunity: Opportunity): StoryTemplate {
    const category = opportunity.category?.toLowerCase() || '';
    const tags = opportunity.specifications?.tags || [];
    
    // Product Categories
    if (category.includes('electronics') || tags.includes('tech')) {
      return new ElectronicsTemplate();
    }
    if (category.includes('fashion') || category.includes('clothing')) {
      return new FashionTemplate();
    }
    if (category.includes('restaurant') || category.includes('food')) {
      return new FoodTemplate();
    }
    if (category.includes('hotel') || category.includes('real estate')) {
      return new LuxuryTemplate();
    }
    
    // Service Categories
    if (category.includes('doctor') || category.includes('medical')) {
      return new MedicalTemplate();
    }
    if (category.includes('beauty') || category.includes('salon')) {
      return new BeautyTemplate();
    }
    if (category.includes('mechanic') || category.includes('industrial')) {
      return new IndustrialTemplate();
    }
    if (category.includes('consultant') || category.includes('lawyer')) {
      return new ProfessionalTemplate();
    }
    
    // Default
    return new ElectronicsTemplate();
  }
}