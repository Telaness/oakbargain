import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

describe('LoadingScreen', () => {
  it('ブランド名が表示される', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('OAK BARGAIN')).toBeInTheDocument();
  });

  it('Loadingテキストが表示される', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
