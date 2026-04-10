import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineSection } from '@/components/sections/LineSection';
import { LINE_CONFIGS } from '@/lib/constants';

describe('LineSection', () => {
  it('ライン名が表示される', () => {
    render(<LineSection config={LINE_CONFIGS.luxury} index={0} />);
    expect(screen.getByText('LUXURY LINE')).toBeInTheDocument();
  });

  it('コンセプトが表示される', () => {
    render(<LineSection config={LINE_CONFIGS.luxury} index={0} />);
    expect(
      screen.getByText(LINE_CONFIGS.luxury.concept)
    ).toBeInTheDocument();
  });

  it('VIEW MOREリンクが表示される', () => {
    render(<LineSection config={LINE_CONFIGS.entry} index={3} />);
    const link = screen.getByText('VIEW MORE');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/lines/entry');
  });

  it('サブネームが表示される', () => {
    render(<LineSection config={LINE_CONFIGS.premium} index={1} />);
    expect(screen.getByText('プレミアムライン')).toBeInTheDocument();
  });
});
