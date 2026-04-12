import type { LineConfig, LineType } from '@/types/line';

// ===== Three.js シーン設定 =====
export const SCENE_CONFIG = {
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    initialPosition: [0, 80, 120] as const,
  },
  ambientLight: {
    intensity: 0.3,
    color: '#4A3520',
  },
  directionalLight: {
    intensity: 1.2,
    position: [10, 50, 30] as const,
  },
  fog: {
    color: '#1A0E00',
    density: 0.008,
  },
  background: '#0A0604',
  renderer: {
    toneMappingExposure: 1.2,
  },
} as const;

// ===== パーティクル設定 =====
export const DUST_CONFIG = {
  pc: {
    count: 4000,
  },
  sp: {
    count: 2000,
  },
  mouseRadius: 120,
  friction: 0.95,
  autoFadeThreshold: 0.7,
  autoFadeDuration: 2,
  sizeRange: { min: 0.3, max: 1.2 },
  colors: ['#8B7355', '#6B5B45', '#9E9E9E', '#A0926B', '#7A6B5A'],
} as const;

// ===== 木のジオメトリ設定 =====
export const TREE_CONFIG = {
  trunk: {
    bottomRadius: 4,
    topRadius: 2.5,
    height: 60,
    radialSegments: 12,
    heightSegments: 8,
  },
  branches: {
    mainRadius: { min: 0.8, max: 1.5 },
    subRadius: { min: 0.2, max: 0.5 },
    count: 8,
  },
  leaves: {
    pc: 8000,
    sp: 3000,
    radiusRange: { min: 15, max: 35 },
    baseY: 20,
  },
  flowers: {
    count: 200,
  },
} as const;

// ===== ロゴ設定 =====
export const LOGO_CONFIG = {
  startY: 80,
  endY: -40,
  rotationSpeed: 0.015,
  lerpFactor: 0.05,
  material: {
    color: '#B8964E',
    metalness: 0.8,
    roughness: 0.2,
  },
  bloom: {
    threshold: 0.8,
    intensity: 1.5,
  },
} as const;

// ===== LINE設定 =====
export const LINE_CONFIGS: Record<LineType, LineConfig> = {
  luxury: {
    id: 'luxury',
    name: 'LUXURY LINE',
    nameSub: 'ラグジュアリーライン',
    treePart: 'flower',
    concept: 'その輝きに、価値がある。',
    description:
      'K18やプラチナなど、素材そのものにも高い価値を持つ最上位ライン。時を経てなお輝き続ける、至高のヴィンテージジュエリーをお届けします。',
    colors: { bg: '#F8F0E3', text: '#1A1A1A', accent: '#D4AF37' },
    scrollTarget: 0.73,
    path: '/lines/luxury',
  },
  premium: {
    id: 'premium',
    name: 'PREMIUM LINE',
    nameSub: 'プレミアムライン',
    treePart: 'leaf',
    concept: '特別感を、日常に。',
    description:
      'デザイン性・存在感・希少性を高めた中上位ライン。特別な日にも、日常にも寄り添う、選ばれたヴィンテージジュエリーです。',
    colors: { bg: '#1A2B1A', text: '#F0EDE6', accent: '#8BA888' },
    scrollTarget: 0.53,
    path: '/lines/premium',
  },
  standard: {
    id: 'standard',
    name: 'STANDARD LINE',
    nameSub: 'スタンダードライン',
    treePart: 'branch',
    concept: '毎日つけたい定番。',
    description:
      '日常使いのしやすさとヴィンテージの存在感のバランスを意識したライン。あなたの毎日に、さりげない特別感を。',
    colors: { bg: '#2C1A0E', text: '#F0EDE6', accent: '#B8964E' },
    scrollTarget: 0.33,
    path: '/lines/standard',
  },
  entry: {
    id: 'entry',
    name: 'ENTRY LINE',
    nameSub: 'エントリーライン',
    treePart: 'trunk',
    concept: 'はじめての1つ、ここから。',
    description:
      'ヴィンテージジュエリーを初めて手に取る方にも親しみやすい入門ライン。あなたの物語の始まりに。',
    colors: { bg: '#3D2B1F', text: '#F0EDE6', accent: '#C4956A' },
    scrollTarget: 0.13,
    path: '/lines/entry',
  },
} as const;

// ===== LINE表示順序（根元→頂上） =====
export const LINE_ORDER: LineType[] = [
  'entry',
  'standard',
  'premium',
  'luxury',
];

// ===== ゾーン設定（根元→頂上: ENTRY→STANDARD→PREMIUM→LUXURY） =====
export const ZONE_CONFIGS = [
  { id: 'entry' as const, scrollStart: 0.06, scrollEnd: 0.18, label: 'ENTRY' },
  { id: 'standard' as const, scrollStart: 0.28, scrollEnd: 0.40, label: 'STANDARD' },
  { id: 'premium' as const, scrollStart: 0.50, scrollEnd: 0.62, label: 'PREMIUM' },
  { id: 'luxury' as const, scrollStart: 0.72, scrollEnd: 0.84, label: 'LUXURY' },
] as const;

// ===== ブレイクポイント =====
export const BREAKPOINTS = {
  sp: 375,
  tablet: 768,
  pc: 1280,
} as const;
