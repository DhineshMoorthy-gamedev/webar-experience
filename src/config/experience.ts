export interface ExperienceConfig {
  id: string;
  title: string;
  description: string;
  targetSrc: string;
  targetJsonSrc: string;
  posterImageSrc: string;
  modelSrc: string;
  modelScale: [number, number, number];
  modelPosition: [number, number, number];
  modelRotation: [number, number, number];
  autoPlayAnimation: boolean;
}

export const DEFAULT_EXPERIENCE: ExperienceConfig = {
  id: 'sample-poster-experience',
  title: 'WebAR Poster Experience',
  description: 'Point your camera at the AR poster to trigger the 3D animated avatar.',
  targetSrc: './targets/sample-poster.jpg',
  targetJsonSrc: './targets/sample-poster.json',
  posterImageSrc: './targets/sample-poster.jpg',
  modelSrc: './models/sample-animation.glb',
  modelScale: [1.2, 1.2, 1.2],
  modelPosition: [0, 0, 0],
  modelRotation: [0, 0, 0],
  autoPlayAnimation: true
};
