import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserPreferencesProvider } from '../../../contexts/UserPreferencesContext';
import { CarsArchive } from '../CarsArchive';

const { mockUseGLTF } = vi.hoisted(() => {
  const fn: any = vi.fn(() => ({
    scene: {
      clone: () => ({
        traverse: vi.fn(),
        rotation: { set: vi.fn() },
        scale: { set: vi.fn() },
        position: { set: vi.fn() },
      }),
    },
  }));
  fn.preload = vi.fn();
  return { mockUseGLTF: fn };
});

// Mock R3F & Drei canvas internals in JSDOM
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-r3f-canvas">{children}</div>
  ),
  useFrame: () => {},
  useThree: () => ({ invalidate: vi.fn(), camera: {}, gl: {} }),
}));

vi.mock('@react-three/drei', () => ({
  CameraControls: React.forwardRef((_props, ref: any) => {
    if (ref) {
      ref.current = {
        setLookAt: vi.fn(),
        rotate: vi.fn(),
        reset: vi.fn(),
      };
    }
    return <div data-testid="mock-camera-controls" />;
  }),
  ContactShadows: () => <div data-testid="mock-contact-shadows" />,
  Environment: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-environment">{children}</div>
  ),
  Lightformer: () => <div data-testid="mock-lightformer" />,
  Html: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-html">{children}</div>
  ),
  useGLTF: mockUseGLTF,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderCarsArchive = (initialUrl = '/lab/ferrari') => {
  const queryClient = createTestQueryClient();
  const search = initialUrl.includes('?') ? initialUrl.slice(initialUrl.indexOf('?')) : '';
  return render(
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <MemoryRouter
          initialEntries={[initialUrl]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <NuqsTestingAdapter searchParams={search} hasMemory>
            <Routes>
              <Route path="/lab/:teamId?" element={<CarsArchive />} />
            </Routes>
          </NuqsTestingAdapter>
        </MemoryRouter>
      </UserPreferencesProvider>
    </QueryClientProvider>
  );
};

describe('CarsArchive Component (P7-FIX-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title, 5-era timeline bar, and team selectors', () => {
    renderCarsArchive('/lab/ferrari');

    expect(screen.getByText(/3D VEHICLE EVOLUTION LAB/i)).toBeInTheDocument();
    expect(screen.getByText(/SELECT TECHNICAL ERA/i)).toBeInTheDocument();
    expect(screen.getByText(/SELECT CONSTRUCTOR LIVERY/i)).toBeInTheDocument();

    // Verify all 5 eras are represented
    expect(screen.getByRole('button', { name: /1950s/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1988/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2004/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2024/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2026/i })).toBeInTheDocument();
  });

  it('hydrates 2026 active aero era and displays experimental badge', async () => {
    renderCarsArchive('/lab/mclaren?era=2026_active_aero');

    await waitFor(() => {
      expect(screen.getAllByText(/2026 REGULATION SIMULATION/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Active Aero & 50\/50 Hybrid Concept/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/768 KG/i)).toBeInTheDocument();
    });
  });

  it('renders N/A for unregulated minimum weight on 1950s era', async () => {
    renderCarsArchive('/lab/ferrari?era=1950s_front_engine');

    await waitFor(() => {
      expect(screen.getAllByText(/Front-Engine Grand Prix Era/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/N\/A \(Unregulated\)/i)).toBeInTheDocument();
      expect(screen.getByText(/None \(Pre-2018\)/i)).toBeInTheDocument();
    });
  });

  it('allows switching era and updates specification readout', async () => {
    renderCarsArchive('/lab/ferrari');

    const era2004Btn = screen.getByRole('button', { name: /2004/i });
    fireEvent.click(era2004Btn);

    await waitFor(() => {
      expect(screen.getAllByText(/3.0L V10 High-Downforce Pinnacle/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/605 KG/i)).toBeInTheDocument();
    });
  });
});
