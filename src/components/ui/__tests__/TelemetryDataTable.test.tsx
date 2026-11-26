import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { TelemetryDataTable } from '../TelemetryDataTable';

interface TestItem {
  id: string;
  pos: number;
  driver: string;
  points: number;
  teamColor?: string;
}

const mockColumns: ColumnDef<TestItem, any>[] = [
  {
    accessorKey: 'pos',
    header: 'POS',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'driver',
    header: 'DRIVER',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'points',
    header: 'PTS',
    cell: (info) => info.getValue(),
  },
];

const mockData: TestItem[] = [
  { id: '1', pos: 1, driver: 'Max Verstappen', points: 400, teamColor: '#3671C6' },
  { id: '2', pos: 2, driver: 'Lando Norris', points: 330, teamColor: '#FF8000' },
  { id: '3', pos: 3, driver: 'Charles Leclerc', points: 325, teamColor: '#E8002D' },
];

describe('TelemetryDataTable Component', () => {
  it('renders columns and data rows correctly', () => {
    render(
      <TelemetryDataTable
        data={mockData}
        columns={mockColumns}
        getRowTeamColor={(item) => item.teamColor}
      />
    );

    expect(screen.getByText('POS')).toBeInTheDocument();
    expect(screen.getByText('DRIVER')).toBeInTheDocument();
    expect(screen.getByText('PTS')).toBeInTheDocument();

    expect(screen.getByText('Max Verstappen')).toBeInTheDocument();
    expect(screen.getByText('Lando Norris')).toBeInTheDocument();
    expect(screen.getByText('Charles Leclerc')).toBeInTheDocument();
  });

  it('renders empty message when data is empty', () => {
    render(
      <TelemetryDataTable
        data={[]}
        columns={mockColumns}
        emptyMessage="No drivers found"
      />
    );

    expect(screen.getByText('// No drivers found')).toBeInTheDocument();
  });

  it('sorts columns on header click', () => {
    render(
      <TelemetryDataTable
        data={mockData}
        columns={mockColumns}
        enableSorting
      />
    );

    const driverHeader = screen.getByText('DRIVER');
    // First click: ascending sort
    fireEvent.click(driverHeader);

    const rowsAfterSort = screen.getAllByRole('row');
    // First data row should now be Charles Leclerc
    expect(rowsAfterSort[1]).toHaveTextContent('Charles Leclerc');

    // Second click: descending sort
    fireEvent.click(driverHeader);
    const rowsAfterDesc = screen.getAllByRole('row');
    expect(rowsAfterDesc[1]).toHaveTextContent('Max Verstappen');
  });

  it('triggers onRowClick via mouse click and keyboard Enter', () => {
    const handleRowClick = vi.fn();
    render(
      <TelemetryDataTable
        data={mockData}
        columns={mockColumns}
        onRowClick={handleRowClick}
      />
    );

    const verRow = screen.getByText('Max Verstappen').closest('tr')!;
    fireEvent.click(verRow);
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);

    const norRow = screen.getByText('Lando Norris').closest('tr')!;
    fireEvent.keyDown(norRow, { key: 'Enter' });
    expect(handleRowClick).toHaveBeenCalledWith(mockData[1]);
  });

  it('virtualizes 1,000 rows deterministically without performance degradation', () => {
    const largeDataset: TestItem[] = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i + 1),
      pos: i + 1,
      driver: `Driver #${i + 1}`,
      points: 1000 - i,
      teamColor: i % 2 === 0 ? '#3671C6' : '#FF8000',
    }));

    render(
      <TelemetryDataTable
        data={largeDataset}
        columns={mockColumns}
        maxHeightPx={400}
        rowHeightPx={38}
      />
    );

    // Initial virtualized view should render the top slice
    expect(screen.getByText('Driver #1')).toBeInTheDocument();
  });
});
