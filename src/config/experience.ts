export interface ExperienceConfig {
  id: string;
  title: string;
  description: string;
  targetSrc: string;
  posterImageSrc: string;
  modelSrc: string;
  modelScale: [number, number, number];
  modelPosition: [number, number, number];
  modelRotation: [number, number, number];
  autoPlayAnimation: boolean;
  filterMinCF?: number;
  filterBeta?: number;
  warmupTolerance?: number;
  missTolerance?: number;
}

export const DEFAULT_EXPERIENCE: ExperienceConfig = {
  id: 'sample-poster-experience',
  title: 'WebAR Poster Experience',
  description: 'Point your camera at the AR poster to trigger the 3D animated avatar.',
  targetSrc: './targets/sample-poster.mind',
  posterImageSrc: './targets/sample-poster.jpg',
  modelSrc: './models/sample-animation.glb',
  modelScale: [1.85, 1.85, 1.85], // Enlarged to fill the target poster width with prominent presence
  modelPosition: [0, 0, 0],
  modelRotation: [0, 0, 0],
  autoPlayAnimation: true,
  filterMinCF: 0.0001,            // Zero stationary jitter
  filterBeta: 0.05,               // Smooth pose interpolation
  warmupTolerance: 1,             // Instant lock at long distance (1 frame match)
  missTolerance: 15               // Resilient tracking through hand shake
};
