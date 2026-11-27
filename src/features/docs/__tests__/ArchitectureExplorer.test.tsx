import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ArchitectureExplorer } from '../ArchitectureExplorer';
import { InspectQueryProvider, useInspectQuery } from '../../../contexts/InspectQueryContext';

// Mock sqlClient
vi.mock('../../historian/sqlClient', () => ({
  sqlClient: {
    executeQuery: vi.fn().mockResolvedValue({
      columns: ['name', 'sql'],
      rows: [
        { name: 'circuit', sql: 'CREATE TABLE circuit (id TEXT PRIMARY KEY, name TEXT);' },
        { name: 'driver', sql: 'CREATE TABLE driver (id TEXT PRIMARY KEY, name TEXT, abbreviation TEXT);' },
        { name: 'race', sql: 'CREATE TABLE race (id TEXT PRIMARY KEY, year INT, official_name TEXT);' },
      ],
      executionTimeMs: 1.5,
    }),
  },
}));

// Test helper to observe openQuery
let capturedQuery: { title: string; sql: string } | null = null;
const TestQueryConsumer: React.FC = () => {
  const { activeQuery } = useInspectQuery();
  capturedQuery = activeQuery;
  return null;
};

describe('ArchitectureExplorer Component', () => {
  beforeEach(() => {
    capturedQuery = null;
    vi.clearAllMocks();
  });

  it('renders architecture header and tab triggers', () => {
    render(
      <MemoryRouter>
        <InspectQueryProvider>
          <ArchitectureExplorer />
        </InspectQueryProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/ARCHITECTURE/i);
    expect(screen.getByRole('tab', { name: /Data Pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /SQLite Schema/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /3D & Performance/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ADRs & Legal/i })).toBeInTheDocument();
  });

  it('displays Data Pipeline architecture overview by default', () => {
    render(
      <MemoryRouter>
        <InspectQueryProvider>
          <ArchitectureExplorer />
        </InspectQueryProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/01 \/\/ SOURCES/i)).toBeInTheDocument();
    expect(screen.getByText(/02 \/\/ ETL PIPELINE/i)).toBeInTheDocument();
    expect(screen.getByText(/03 \/\/ CLIENT STORAGE/i)).toBeInTheDocument();
    expect(screen.getByText(/04 \/\/ EXECUTION/i)).toBeInTheDocument();
    expect(screen.getByText(/F1DB CC-BY-4\.0/i)).toBeInTheDocument();
  });

  it('allows navigating to SQLite Schema tab and queries table schema', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <InspectQueryProvider>
          <ArchitectureExplorer />
          <TestQueryConsumer />
        </InspectQueryProvider>
      </MemoryRouter>
    );

    const schemaTab = screen.getByRole('tab', { name: /SQLite Schema/i });
    await user.click(schemaTab);

    // Should display table names
    expect(await screen.findByText('driver')).toBeInTheDocument();
    expect(screen.getByText('circuit')).toBeInTheDocument();

    // Query table button triggers inspect query drawer
    const queryButtons = screen.getAllByRole('button', { name: /Query Table/i });
    expect(queryButtons.length).toBeGreaterThan(0);

    await user.click(queryButtons[0]);
    expect(capturedQuery).not.toBeNull();
    expect(capturedQuery?.sql).toMatch(/^SELECT \* FROM .* LIMIT 20;$/);
  });

  it('displays 3D Graphics & Performance specifications', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <InspectQueryProvider>
          <ArchitectureExplorer />
        </InspectQueryProvider>
      </MemoryRouter>
    );

    const graphicsTab = screen.getByRole('tab', { name: /3D & Performance/i });
    await user.click(graphicsTab);

    expect(await screen.findByText(/Three\.js Procedural Circuit Ribbon/i)).toBeInTheDocument();
    expect(screen.getByText(/Blender MCP 5-Era Vehicle Lab/i)).toBeInTheDocument();
  });

  it('displays Architectural Decision Records (ADRs) and legal attributions', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <InspectQueryProvider>
          <ArchitectureExplorer />
        </InspectQueryProvider>
      </MemoryRouter>
    );

    const adrTab = screen.getByRole('tab', { name: /ADRs & Legal/i });
    await user.click(adrTab);

    expect(await screen.findByText('ADR-0001')).toBeInTheDocument();
    expect(screen.getByText('ADR-0002')).toBeInTheDocument();
    expect(screen.getByText('ADR-0003')).toBeInTheDocument();
    expect(screen.getByText('ADR-0004')).toBeInTheDocument();
    expect(screen.getByText('ADR-0005')).toBeInTheDocument();

    // Trademarks
    expect(screen.getByText(/Formula One Licensing B\.V\./i)).toBeInTheDocument();
    expect(screen.getByText(/Open-Meteo SRTM/i)).toBeInTheDocument();
  });
});
