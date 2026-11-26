import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';

describe('Navigation Component (5-Hub Architecture: C-18, C-20, F-39)', () => {
  it('renders exactly 5 top-level desktop navigation hub links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );

    const hubItems = screen.getAllByTestId('hub-nav-item');
    expect(hubItems).toHaveLength(5);

    const labels = hubItems.map((item) => item.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining('Home'),
      expect.stringContaining('Archive'),
      expect.stringContaining('Telemetry & Strategy'),
      expect.stringContaining('3D Lab'),
      expect.stringContaining('SQL Historian'),
    ]);
  });

  it('marks Home hub active when on "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );

    const hubItems = screen.getAllByTestId('hub-nav-item');
    const homeItem = hubItems[0];
    expect(homeItem).toHaveAttribute('aria-current', 'page');
    expect(homeItem.className).toContain('active');
  });

  it('marks Archive hub active when visiting "/drivers/compare"', () => {
    render(
      <MemoryRouter initialEntries={['/drivers/compare']}>
        <Navigation />
      </MemoryRouter>
    );

    const hubItems = screen.getAllByTestId('hub-nav-item');
    const archiveItem = hubItems[1];
    expect(archiveItem).toHaveAttribute('aria-current', 'page');
    expect(archiveItem.className).toContain('active');
  });

  it('marks Archive hub active when visiting other archive routes like "/circuits/monza"', () => {
    render(
      <MemoryRouter initialEntries={['/circuits/monza']}>
        <Navigation />
      </MemoryRouter>
    );

    const hubItems = screen.getAllByTestId('hub-nav-item');
    const archiveItem = hubItems[1];
    expect(archiveItem).toHaveAttribute('aria-current', 'page');
    expect(archiveItem.className).toContain('active');
  });

  it('marks Telemetry & Strategy hub active when visiting "/pitwall"', () => {
    render(
      <MemoryRouter initialEntries={['/pitwall']}>
        <Navigation />
      </MemoryRouter>
    );

    const hubItems = screen.getAllByTestId('hub-nav-item');
    const telemetryItem = hubItems[2];
    expect(telemetryItem).toHaveAttribute('aria-current', 'page');
    expect(telemetryItem.className).toContain('active');
  });

  it('calls onOpenSearch when search button is clicked', () => {
    const handleOpenSearch = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation onOpenSearch={handleOpenSearch} />
      </MemoryRouter>
    );

    const searchBtn = screen.getByRole('button', { name: /search database/i });
    fireEvent.click(searchBtn);
    expect(handleOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenShortcuts when shortcuts button is clicked', () => {
    const handleOpenShortcuts = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation onOpenShortcuts={handleOpenShortcuts} />
      </MemoryRouter>
    );

    const shortcutsBtn = screen.getByRole('button', { name: /keyboard shortcuts/i });
    fireEvent.click(shortcutsBtn);
    expect(handleOpenShortcuts).toHaveBeenCalledTimes(1);
  });
});
