export type LineType = 'entry' | 'standard' | 'premium' | 'luxury';
export type TreePart = 'trunk' | 'branch' | 'leaf' | 'flower';

export interface LineConfig {
  id: LineType;
  name: string;
  nameSub: string;
  treePart: TreePart;
  concept: string;
  description: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
  scrollTarget: number;
  path: string;
}
