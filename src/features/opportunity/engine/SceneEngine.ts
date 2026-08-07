// src/features/opportunity/engine/SceneEngine.ts
import { Opportunity } from '../types/Opportunity';
import { Scene } from '../types/Scene';
import { SceneFactory } from './SceneFactory';

export class SceneEngine {
  private opportunity: Opportunity;

  constructor(opportunity: Opportunity) {
    this.opportunity = opportunity;
  }

  compose(): Scene[] {
    const images = this.opportunity.images || [];
    
    const getImageForScene = (sceneIndex: number): string => {
      if (images.length === 0) {
        return 'https://via.placeholder.com/800x800/1F2F5F/FFFFFF?text=No+Image';
      }
      if (images.length >= 5) {
        return images[sceneIndex] || images[0];
      }
      const cycleIndex = sceneIndex % images.length;
      return images[cycleIndex];
    };

    return [
      SceneFactory.createHero(this.opportunity, getImageForScene(0)),
      SceneFactory.createDetails(this.opportunity, getImageForScene(1)),
      SceneFactory.createTrust(this.opportunity, getImageForScene(2)),
      SceneFactory.createGallery(this.opportunity, getImageForScene(3)),
      SceneFactory.createAction(this.opportunity, getImageForScene(4)),
    ];
  }
}