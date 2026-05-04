import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound, { metadata } from '@/app/not-found';

describe('NotFound page', () => {
  it('404 見出しと案内文を表示する', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
    expect(
      screen.getByText('ページが見つかりませんでした'),
    ).toBeInTheDocument();
  });

  it('トップページへのリンクを持つ', () => {
    render(<NotFound />);
    const backLink = screen.getByText('BACK TO TOP').closest('a');
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('検索エンジンにインデックスされない設定になっている', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('title に 404 を含む', () => {
    expect(typeof metadata.title === 'string' && metadata.title).toMatch(/404/);
  });
});
