import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchPalette } from '../SearchPalette';
import { isSearchIndexLoaded, resetSearchIndexCacheForTesting } from '../searchIndex';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SearchPalette (cmdk + Fuse.js lazy index)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    resetSearchIndexCacheForTesting();
  });

  it('does NOT load search index when isOpen is false', () => {
    render(
      <MemoryRouter>
        <SearchPalette isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(isSearchIndexLoaded()).toBe(false);
  });

  it('loads search index and renders quick actions when opened', async () => {
    render(
      <MemoryRouter>
        <SearchPalette isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(isSearchIndexLoaded()).toBe(true);
    });

    expect(
      screen.getByText('Compare Max Verstappen vs Lewis Hamilton')
    ).toBeInTheDocument();
    expect(screen.getByText('Open Spa-Francorchamps Circuit')).toBeInTheDocument();
  });

  it('matches "verstap" to Max Verstappen via fuzzy search', async () => {
    render(
      <MemoryRouter>
        <SearchPalette isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(isSearchIndexLoaded()).toBe(true);
    });

    const input = screen.getByPlaceholderText(/search archive/i);
    fireEvent.change(input, { target: { value: 'verstap' } });

    await waitFor(() => {
      expect(screen.getByText('Max Verstappen')).toBeInTheDocument();
    });
  });

  it('matches "silverst" to Silverstone circuit via fuzzy search', async () => {
    render(
      <MemoryRouter>
        <SearchPalette isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(isSearchIndexLoaded()).toBe(true);
    });

    const input = screen.getByPlaceholderText(/search archive/i);
    fireEvent.change(input, { target: { value: 'silverst' } });

    await waitFor(() => {
      expect(screen.getByText('Silverstone Circuit')).toBeInTheDocument();
    });
  });

  it('navigates to path and closes when item is selected', async () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <SearchPalette isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(isSearchIndexLoaded()).toBe(true);
    });

    const actionItem = screen.getByText('Compare Max Verstappen vs Lewis Hamilton');
    fireEvent.click(actionItem);

    expect(mockNavigate).toHaveBeenCalledWith('/drivers/compare?d1=VER&d2=HAM');
    expect(handleClose).toHaveBeenCalled();
  });
});
