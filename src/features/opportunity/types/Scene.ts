export interface Scene {
  id: 'hero' | 'details' | 'trust' | 'gallery' | 'action';
  type: 'hero' | 'details' | 'trust' | 'gallery' | 'action';
  image?: string;
  title: string;
  content: string;
  data?: Record<string, any>;
}