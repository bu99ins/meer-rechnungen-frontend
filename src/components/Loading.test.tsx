import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './Loading';

// Smoke test for the Vitest + jsdom + React Testing Library harness itself — proves the
// toolchain (JSX/TSX transform, jsdom DOM, RTL queries, jest-dom matchers) works end to end
// before anything product-specific depends on it.
describe('Loading', () => {
  it('renders the default label', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<Loading label="Loading customer..." />);
    expect(screen.getByText('Loading customer...')).toBeInTheDocument();
  });
});
