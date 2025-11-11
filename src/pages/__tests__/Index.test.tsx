import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import Index from '../Index';

// Mock the SyncPanel component
vi.mock('../components/SyncPanel', () => ({
  SyncPanel: () => <div data-testid="sync-panel">SyncPanel</div>,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Index Page', () => {
  it('renders main dashboard components', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Check for main title
    expect(screen.getByText('Windows Device Inventory Dashboard')).toBeInTheDocument();

    // Check for description
    expect(
      screen.getByText('Explore and analyze your Windows device inventory data')
    ).toBeInTheDocument();

    // Check for SyncPanel
    expect(screen.getByTestId('sync-panel')).toBeInTheDocument();

  // Check for file upload component (heading + drop text)
  expect(screen.getByText('Upload Device Inventory Files')).toBeInTheDocument();
  expect(screen.getByText(/drag and drop json files here/i)).toBeInTheDocument();
  });

  it('renders theme toggle', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    // Theme toggle should be present
    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();
  });
});
