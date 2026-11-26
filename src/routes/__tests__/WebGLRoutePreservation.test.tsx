import React, { useEffect, useRef, useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link, useParams } from 'react-router-dom';

// Component simulating a 3D canvas viewport that reads URL params
let canvasMountCount = 0;
let canvasCleanupCount = 0;

const MockWebGLView: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  const [activeTeam, setActiveTeam] = useState(teamId);

  useEffect(() => {
    canvasMountCount += 1;
    return () => {
      canvasCleanupCount += 1;
    };
  }, []);

  useEffect(() => {
    setActiveTeam(teamId);
  }, [teamId]);

  return (
    <div data-testid="webgl-container">
      <canvas data-testid="webgl-canvas" data-team={activeTeam} />
      <span data-testid="active-team-label">{activeTeam}</span>
      <nav>
        <Link to="/lab/ferrari" data-testid="link-ferrari">Ferrari</Link>
        <Link to="/lab/mclaren" data-testid="link-mclaren">McLaren</Link>
        <Link to="/circuits/monza" data-testid="link-monza">Monza</Link>
        <Link to="/circuits/spa" data-testid="link-spa">Spa</Link>
      </nav>
    </div>
  );
};

describe('WebGL Route Preservation (F-34, C-14)', () => {
  it('preserves the WebGL canvas DOM element identity across sub-route parameter changes', async () => {
    canvasMountCount = 0;
    canvasCleanupCount = 0;

    render(
      <MemoryRouter initialEntries={['/lab/ferrari']}>
        {/* Unkeyed Routes (P3-FIX-01 pattern) */}
        <Routes>
          <Route path="/lab/:teamId?" element={<MockWebGLView />} />
          <Route path="/circuits/:circuitId?" element={<MockWebGLView />} />
        </Routes>
      </MemoryRouter>
    );

    const canvasBefore = screen.getByTestId('webgl-canvas');
    expect(canvasBefore).toBeInTheDocument();
    expect(screen.getByTestId('active-team-label')).toHaveTextContent('ferrari');
    expect(canvasMountCount).toBe(1);
    expect(canvasCleanupCount).toBe(0);

    // Navigate to McLaren via React Router Link
    const mclarenLink = screen.getByTestId('link-mclaren');
    await act(async () => {
      mclarenLink.click();
    });

    const canvasAfter = screen.getByTestId('webgl-canvas');
    expect(screen.getByTestId('active-team-label')).toHaveTextContent('mclaren');

    // Strict DOM reference equality: WebGL canvas was NOT destroyed or remounted
    expect(canvasAfter).toBe(canvasBefore);
    expect(canvasMountCount).toBe(1);
    expect(canvasCleanupCount).toBe(0);
  });
});
