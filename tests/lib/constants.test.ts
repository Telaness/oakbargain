import { describe, it, expect } from 'vitest';
import {
  LINE_CONFIGS,
  LINE_ORDER,
  SCENE_CONFIG,
  DUST_CONFIG,
  TREE_CONFIG,
  LOGO_CONFIG,
  BREAKPOINTS,
} from '@/lib/constants';

describe('LINE_CONFIGS', () => {
  it('4つのラインが定義されている', () => {
    expect(Object.keys(LINE_CONFIGS)).toHaveLength(4);
  });

  it('全ラインに必要なプロパティが存在する', () => {
    const requiredKeys = [
      'id',
      'name',
      'nameSub',
      'treePart',
      'concept',
      'description',
      'colors',
      'scrollTarget',
      'path',
    ];

    Object.values(LINE_CONFIGS).map((config) => {
      requiredKeys.map((key) => {
        expect(config).toHaveProperty(key);
      });
    });
  });

  it('各ラインのcolorsにbg, text, accentが存在する', () => {
    Object.values(LINE_CONFIGS).map((config) => {
      expect(config.colors).toHaveProperty('bg');
      expect(config.colors).toHaveProperty('text');
      expect(config.colors).toHaveProperty('accent');
    });
  });

  it('scrollTargetが0〜1の範囲内', () => {
    Object.values(LINE_CONFIGS).map((config) => {
      expect(config.scrollTarget).toBeGreaterThanOrEqual(0);
      expect(config.scrollTarget).toBeLessThanOrEqual(1);
    });
  });

  it('pathが/lines/で始まる', () => {
    Object.values(LINE_CONFIGS).map((config) => {
      expect(config.path).toMatch(/^\/lines\//);
    });
  });

  it('treePartが正しい木の部位に対応している', () => {
    expect(LINE_CONFIGS.luxury.treePart).toBe('flower');
    expect(LINE_CONFIGS.premium.treePart).toBe('leaf');
    expect(LINE_CONFIGS.standard.treePart).toBe('branch');
    expect(LINE_CONFIGS.entry.treePart).toBe('trunk');
  });
});

describe('LINE_ORDER', () => {
  it('4つのラインが正しい順序で定義されている', () => {
    expect(LINE_ORDER).toEqual(['luxury', 'premium', 'standard', 'entry']);
  });

  it('LINE_CONFIGSのキーと一致する', () => {
    LINE_ORDER.map((lineId) => {
      expect(LINE_CONFIGS).toHaveProperty(lineId);
    });
  });
});

describe('SCENE_CONFIG', () => {
  it('カメラ設定が正しい', () => {
    expect(SCENE_CONFIG.camera.fov).toBe(60);
    expect(SCENE_CONFIG.camera.near).toBe(0.1);
    expect(SCENE_CONFIG.camera.far).toBe(1000);
  });

  it('初期カメラ位置が設定されている', () => {
    expect(SCENE_CONFIG.camera.initialPosition).toHaveLength(3);
  });
});

describe('DUST_CONFIG', () => {
  it('PC・SPのパーティクル数が正しい', () => {
    expect(DUST_CONFIG.pc.count).toBe(4000);
    expect(DUST_CONFIG.sp.count).toBe(2000);
  });

  it('自動消滅しきい値が0〜1の範囲内', () => {
    expect(DUST_CONFIG.autoFadeThreshold).toBeGreaterThan(0);
    expect(DUST_CONFIG.autoFadeThreshold).toBeLessThanOrEqual(1);
  });

  it('摩擦係数が0〜1の範囲内', () => {
    expect(DUST_CONFIG.friction).toBeGreaterThan(0);
    expect(DUST_CONFIG.friction).toBeLessThan(1);
  });
});

describe('TREE_CONFIG', () => {
  it('幹のパラメータが正しい', () => {
    expect(TREE_CONFIG.trunk.bottomRadius).toBe(4);
    expect(TREE_CONFIG.trunk.topRadius).toBe(2.5);
    expect(TREE_CONFIG.trunk.height).toBe(60);
  });

  it('葉のPC・SP数が正しい', () => {
    expect(TREE_CONFIG.leaves.pc).toBe(8000);
    expect(TREE_CONFIG.leaves.sp).toBe(3000);
  });
});

describe('LOGO_CONFIG', () => {
  it('開始Y座標が終了Y座標より大きい', () => {
    expect(LOGO_CONFIG.startY).toBeGreaterThan(LOGO_CONFIG.endY);
  });

  it('マテリアル設定が正しい', () => {
    expect(LOGO_CONFIG.material.metalness).toBeGreaterThan(0);
    expect(LOGO_CONFIG.material.roughness).toBeGreaterThanOrEqual(0);
  });
});

describe('BREAKPOINTS', () => {
  it('ブレイクポイントが昇順に定義されている', () => {
    expect(BREAKPOINTS.sp).toBeLessThan(BREAKPOINTS.tablet);
    expect(BREAKPOINTS.tablet).toBeLessThan(BREAKPOINTS.pc);
  });
});
