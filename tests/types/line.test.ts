import { describe, it, expectTypeOf } from 'vitest';
import type { LineType, TreePart, LineConfig } from '@/types/line';

describe('Line型定義', () => {
  it('LineTypeが正しいユニオン型', () => {
    expectTypeOf<LineType>().toEqualTypeOf<
      'entry' | 'standard' | 'premium' | 'luxury'
    >();
  });

  it('TreePartが正しいユニオン型', () => {
    expectTypeOf<TreePart>().toEqualTypeOf<
      'trunk' | 'branch' | 'leaf' | 'flower'
    >();
  });

  it('LineConfigが必要なプロパティを持つ', () => {
    expectTypeOf<LineConfig>().toHaveProperty('id');
    expectTypeOf<LineConfig>().toHaveProperty('name');
    expectTypeOf<LineConfig>().toHaveProperty('nameSub');
    expectTypeOf<LineConfig>().toHaveProperty('treePart');
    expectTypeOf<LineConfig>().toHaveProperty('concept');
    expectTypeOf<LineConfig>().toHaveProperty('description');
    expectTypeOf<LineConfig>().toHaveProperty('colors');
    expectTypeOf<LineConfig>().toHaveProperty('scrollTarget');
    expectTypeOf<LineConfig>().toHaveProperty('path');
  });
});
