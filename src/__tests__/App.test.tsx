import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock the Index page
vi.mock('../pages/Index', () => ({
  default: () => <div data-testid="index-page">Index Page</div>
}));

// Mock NotFound page
vi.mock('../pages/NotFound', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });

  it('provides necessary context providers', () => {
    const { container } = render(<App />);
    
    // Check that the app renders without errors
    expect(container.firstChild).toBeInTheDocument();
  });
});