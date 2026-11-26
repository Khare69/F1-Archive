import React, { lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Home } from '../features/home/Home';
import { RouteShell } from '../components/Layout/RouteShell';
import { ArchiveHub } from '../features/hubs/ArchiveHub';
import { EngineeringHub } from '../features/hubs/EngineeringHub';

// Secondary routes lazy-loaded on demand
const SeasonsArchive = lazy(() =>
  import('../features/seasons/SeasonsArchive').then((m) => ({ default: m.SeasonsArchive }))
);
const TeamsArchive = lazy(() =>
  import('../features/teams/TeamsArchive').then((m) => ({ default: m.TeamsArchive }))
);
const DriversArchive = lazy(() =>
  import('../features/drivers/DriversArchive').then((m) => ({ default: m.DriversArchive }))
);
const DriverComparison = lazy(() =>
  import('../features/drivers/DriverComparison').then((m) => ({ default: m.DriverComparison }))
);
const CircuitsArchive = lazy(() =>
  import('../features/circuits/CircuitsArchive').then((m) => ({ default: m.CircuitsArchive }))
);
const LiveStandings = lazy(() =>
  import('../features/standings/LiveStandings').then((m) => ({ default: m.LiveStandings }))
);
const CarsArchive = lazy(() => import('../features/cars/CarsArchive'));
const TelemetryHub = lazy(() =>
  import('../features/telemetry/TelemetryHub').then((m) => ({ default: m.TelemetryHub }))
);
const RaceHistorian = lazy(() =>
  import('../features/historian/RaceHistorian').then((m) => ({ default: m.RaceHistorian }))
);
const PitWallStrategy = lazy(() =>
  import('../features/strategy/PitWallStrategy').then((m) => ({ default: m.PitWallStrategy }))
);
const NotFound = lazy(() =>
  import('../features/notfound/NotFound').then((m) => ({ default: m.NotFound }))
);

const CarsRedirect: React.FC = () => {
  const { teamId } = useParams<{ teamId?: string }>();
  return <Navigate replace to={teamId ? `/lab/${teamId}` : '/lab'} />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteShell fallbackTitle="Home Dashboard Fault">
            <Home />
          </RouteShell>
        }
      />

      {/* Archive Hub */}
      <Route element={<ArchiveHub />}>
        <Route path="/archive" element={<Navigate replace to="/seasons" />} />
        <Route
          path="/seasons/:year?"
          element={
            <RouteShell fallbackTitle="Seasons Archive Fault" loadingLabel="LOADING SEASONS ARCHIVE...">
              <SeasonsArchive />
            </RouteShell>
          }
        />
        <Route
          path="/teams/:teamId?"
          element={
            <RouteShell fallbackTitle="Constructors Vault Fault" loadingLabel="LOADING CONSTRUCTORS...">
              <TeamsArchive />
            </RouteShell>
          }
        />
        <Route
          path="/drivers/compare"
          element={
            <RouteShell fallbackTitle="Driver Comparison Fault" loadingLabel="INITIALIZING COMPARISON...">
              <DriverComparison />
            </RouteShell>
          }
        />
        <Route
          path="/drivers/:driverId?"
          element={
            <RouteShell fallbackTitle="Drivers Archive Fault" loadingLabel="LOADING DRIVERS...">
              <DriversArchive />
            </RouteShell>
          }
        />
        <Route
          path="/circuits/:circuitId?"
          element={
            <RouteShell fallbackTitle="Circuits Archive Fault" loadingLabel="LOADING CIRCUITS GEOMETRY..." disableTransition>
              <CircuitsArchive />
            </RouteShell>
          }
        />
        <Route
          path="/standings"
          element={
            <RouteShell fallbackTitle="Standings Vault Fault" loadingLabel="SYNCING LIVE STANDINGS...">
              <LiveStandings />
            </RouteShell>
          }
        />
      </Route>

      {/* Engineering Hub */}
      <Route element={<EngineeringHub />}>
        <Route path="/engineering" element={<Navigate replace to="/telemetry" />} />
        <Route
          path="/telemetry/:slug?"
          element={
            <RouteShell fallbackTitle="Telemetry Replay Fault" loadingLabel="STREAMING 3D GHOST TELEMETRY..." disableTransition>
              <TelemetryHub />
            </RouteShell>
          }
        />
        <Route
          path="/pitwall"
          element={
            <RouteShell fallbackTitle="Pit-Wall Strategy Fault" loadingLabel="PREPARING STRATEGY SIMULATOR...">
              <PitWallStrategy />
            </RouteShell>
          }
        />
      </Route>

      {/* 3D Lab */}
      <Route
        path="/lab/:teamId?"
        element={
          <RouteShell fallbackTitle="3D Vehicle Lab Fault" loadingLabel="INITIALIZING 3D LAB CAD SHADERS..." disableTransition>
            <CarsArchive />
          </RouteShell>
        }
      />
      <Route path="/cars/:teamId?" element={<CarsRedirect />} />
      <Route path="/garage" element={<Navigate replace to="/lab" />} />

      {/* SQL Historian */}
      <Route
        path="/historian"
        element={
          <RouteShell fallbackTitle="AI Race Historian Fault" loadingLabel="INITIALIZING F1DB SQL ENGINE...">
            <RaceHistorian />
          </RouteShell>
        }
      />

      {/* Fallback 404 */}
      <Route
        path="*"
        element={
          <RouteShell fallbackTitle="Page Not Found">
            <NotFound />
          </RouteShell>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
