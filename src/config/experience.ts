import { PortfolioConfig, PORTFOLIO_DATA } from './portfolio.ts';

export interface ExperienceConfig {
  title: string;
  posterImageSrc: string;
  targetJsonSrc: string;
  targetName: string;
  modelSrc: string;
  modelScale: [number, number, number];
  modelPosition: [number, number, number];
  modelRotation: [number, number, number];
  autoPlayAnimation: boolean;
  portfolio: PortfolioConfig;
}

export const DEFAULT_EXPERIENCE: ExperienceConfig = {
  title: "Dhinesh Moorthy — AR Portfolio & Career Journey",
  posterImageSrc: './targets/business-card.jpg',
  targetJsonSrc: './targets/business-card.json',
  targetName: 'business-card',
  modelSrc: './models/character.glb',
  modelScale: [1.1, 1.1, 1.1],
  modelPosition: [0, -0.25, 0],
  modelRotation: [0, 0, 0],
  autoPlayAnimation: true,
  portfolio: PORTFOLIO_DATA
};
