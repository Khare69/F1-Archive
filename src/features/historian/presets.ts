import { HistorianPreset } from './types';

export const HISTORIAN_PRESETS: HistorianPreset[] = [
  {
    id: 'top-10-winners',
    title: 'Top 10 All-Time Grand Prix Winners',
    naturalPrompt: 'Top 10 all-time Grand Prix winners',
    category: 'drivers',
    explanation:
      'Queries all-time Grand Prix victories from verified driver career records, joined with driver nationality, ordered by total wins descending.',
    chartType: 'bar',
    columns: [
      { key: 'name', label: 'Driver', type: 'string' },
      { key: 'nationality', label: 'Nationality', type: 'string' },
      { key: 'wins', label: 'Victories', type: 'number' }
    ],
    sql: `SELECT d.name, c.name AS nationality, d.total_race_wins AS wins
FROM driver d
LEFT JOIN country c ON d.nationality_country_id = c.id
ORDER BY d.total_race_wins DESC
LIMIT 10;`
  },
  {
    id: 'constructor-championships',
    title: 'All-Time Constructors Champions',
    naturalPrompt: 'Ferrari and constructor championship titles',
    category: 'constructors',
    explanation:
      'Aggregates official World Constructors Championship titles and total race victories across all active and historic constructors with at least one title.',
    chartType: 'bar',
    columns: [
      { key: 'name', label: 'Constructor', type: 'string' },
      { key: 'titles', label: 'Championship Titles', type: 'number' },
      { key: 'wins', label: 'Race Wins', type: 'number' }
    ],
    sql: `SELECT c.name, c.total_championship_wins AS titles, c.total_race_wins AS wins
FROM constructor c
WHERE c.total_championship_wins > 0
ORDER BY c.total_championship_wins DESC, c.total_race_wins DESC;`
  },
  {
    id: 'monza-past-winners',
    title: 'Monza All-Time Grand Prix Winners',
    naturalPrompt: 'Monza Temple of Speed all-time masters',
    category: 'circuits',
    explanation:
      'Aggregates every Italian Grand Prix victory at the Autodromo Nazionale Monza across the complete 1950–2026 archive. Michael Schumacher and Lewis Hamilton share the record with 5 wins each.',
    chartType: 'bar',
    columns: [
      { key: 'driver', label: 'Driver', type: 'string' },
      { key: 'wins', label: 'Monza Wins', type: 'number' }
    ],
    sql: `SELECT d.name AS driver, COUNT(*) AS wins
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN driver d ON rr.driver_id = d.id
WHERE r.circuit_id = 'monza' AND rr.position_number = 1
GROUP BY d.id, d.name
ORDER BY wins DESC, d.name ASC
LIMIT 10;`
  },
  {
    id: 'youngest-world-champions',
    title: 'Youngest World Drivers Champions',
    naturalPrompt: 'Youngest world drivers champions in history',
    category: 'championships',
    explanation:
      'Computes the exact age of each World Champion on the day they clinched their first title by joining driver birth dates with the clinching season grand prix date.',
    chartType: 'bar',
    columns: [
      { key: 'driver', label: 'Driver', type: 'string' },
      { key: 'first_title_year', label: 'Title Year', type: 'number' },
      { key: 'age_years', label: 'Age (Years)', type: 'number' }
    ],
    sql: `SELECT d.name AS driver, MIN(sds.year) AS first_title_year,
       CAST((strftime('%Y', r.date) - strftime('%Y', d.date_of_birth)) -
            (strftime('%m-%d', r.date) < strftime('%m-%d', d.date_of_birth)) AS INTEGER) AS age_years
FROM season_driver_standing sds
JOIN driver d ON sds.driver_id = d.id
JOIN race r ON r.year = sds.year
WHERE sds.position_number = 1
  AND r.date = (SELECT MAX(r2.date) FROM race r2 WHERE r2.year = sds.year)
GROUP BY d.id, d.name
ORDER BY age_years ASC, first_title_year ASC
LIMIT 10;`
  },
  {
    id: 'pole-to-win-circuits',
    title: 'Circuits with Highest Pole-to-Win Conversion',
    naturalPrompt: 'Circuits where qualifying pole position matters most',
    category: 'circuits',
    explanation:
      'Calculates the percentage of Grand Prix victories won from starting grid position 1 for circuits hosting at least 10 races, showing where qualifying track position is most critical.',
    chartType: 'bar',
    columns: [
      { key: 'circuit', label: 'Circuit', type: 'string' },
      { key: 'total_races', label: 'Races Held', type: 'number' },
      { key: 'pole_wins', label: 'Wins From Pole', type: 'number' },
      { key: 'pole_to_win_pct', label: 'Pole-to-Win %', type: 'percentage' }
    ],
    sql: `SELECT c.name AS circuit,
       COUNT(*) AS total_races,
       SUM(CASE WHEN rr.grid_position_number = 1 AND rr.position_number = 1 THEN 1 ELSE 0 END) AS pole_wins,
       ROUND(100.0 * SUM(CASE WHEN rr.grid_position_number = 1 AND rr.position_number = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pole_to_win_pct
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN circuit c ON r.circuit_id = c.id
WHERE rr.grid_position_number = 1
GROUP BY c.id, c.name
HAVING COUNT(*) >= 10
ORDER BY pole_to_win_pct DESC
LIMIT 10;`
  },
  {
    id: 'senna-vs-prost-1988',
    title: '1988 Senna vs. Prost Dropped Points Audit',
    naturalPrompt: '1988 Senna vs Prost championship dropped points',
    category: 'historical_records',
    explanation:
      'Demonstrates the 1988 Best-11 scoring rule: Alain Prost scored more total gross points (105 vs 94), but Ayrton Senna claimed the Drivers Championship with 90 official net points (8 wins vs 7).',
    chartType: 'table',
    columns: [
      { key: 'driver', label: 'Driver', type: 'string' },
      { key: 'official_net_points', label: 'Official Points (Best 11)', type: 'number' },
      { key: 'gross_points', label: 'Total Gross Points', type: 'number' },
      { key: 'dropped_points', label: 'Dropped Points', type: 'number' },
      { key: 'wins', label: 'Race Wins', type: 'number' }
    ],
    sql: `SELECT d.name AS driver,
       sds.points AS official_net_points,
       SUM(rr.points) AS gross_points,
       ROUND(SUM(rr.points) - sds.points, 1) AS dropped_points,
       SUM(CASE WHEN rr.position_number = 1 THEN 1 ELSE 0 END) AS wins
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN driver d ON rr.driver_id = d.id
JOIN season_driver_standing sds ON sds.driver_id = d.id AND sds.year = 1988
WHERE r.year = 1988 AND d.id IN ('ayrton-senna', 'alain-prost')
GROUP BY d.id, d.name, sds.points
ORDER BY sds.points DESC;`
  },
  {
    id: 'most-podiums-no-title',
    title: 'Most Career Podiums Without a World Title',
    naturalPrompt: 'Most career podiums without winning a World Championship',
    category: 'drivers',
    explanation:
      'Identifies the most successful Formula 1 drivers by podium count who never won a World Drivers Championship (e.g. Rubens Barrichello, David Coulthard, Valtteri Bottas).',
    chartType: 'bar',
    columns: [
      { key: 'driver', label: 'Driver', type: 'string' },
      { key: 'podiums', label: 'Podiums', type: 'number' },
      { key: 'wins', label: 'Wins', type: 'number' },
      { key: 'starts', label: 'Race Starts', type: 'number' }
    ],
    sql: `SELECT d.name AS driver, d.total_podiums AS podiums, d.total_race_wins AS wins, d.total_race_starts AS starts
FROM driver d
WHERE d.total_championship_wins = 0 AND d.total_podiums > 0
ORDER BY d.total_podiums DESC
LIMIT 10;`
  },
  {
    id: 'active-2026-constructors',
    title: '2026 Season Entrant Constructors',
    naturalPrompt: '2026 Formula 1 constructor entrants grid',
    category: 'constructors',
    explanation:
      'Inspects the official constructor roster for the 2026 regulations era from F1DB season entrant records, highlighting new manufacturer entries like Audi and Cadillac alongside legacy teams.',
    chartType: 'table',
    columns: [
      { key: 'constructor', label: 'Constructor', type: 'string' },
      { key: 'country', label: 'Origin Country', type: 'string' }
    ],
    sql: `SELECT DISTINCT c.name AS constructor, co.name AS country
FROM season_entrant_driver sed
JOIN constructor c ON sed.constructor_id = c.id
LEFT JOIN country co ON c.country_id = co.id
WHERE sed.year = 2026
ORDER BY c.name ASC;`
  },
  {
    id: 'single-season-win-rate',
    title: 'Highest Single-Season Constructor Dominance',
    naturalPrompt: 'Most dominant constructor single seasons by win percentage',
    category: 'constructors',
    explanation:
      'Ranks constructor dominance by win percentage in a single calendar year (e.g., Red Bull 2023 with 21/22 wins, McLaren 1988 with 15/16 wins, Mercedes 2016 with 19/21 wins).',
    chartType: 'bar',
    columns: [
      { key: 'year', label: 'Season', type: 'number' },
      { key: 'constructor', label: 'Constructor', type: 'string' },
      { key: 'races_won', label: 'Wins', type: 'number' },
      { key: 'total_races', label: 'Calendar Races', type: 'number' },
      { key: 'win_pct', label: 'Win Rate %', type: 'percentage' }
    ],
    sql: `SELECT r.year, c.name AS constructor,
       COUNT(*) AS races_won,
       tot.total_races,
       ROUND(100.0 * COUNT(*) / tot.total_races, 1) AS win_pct
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN constructor c ON rr.constructor_id = c.id
JOIN (SELECT year, COUNT(*) AS total_races FROM race GROUP BY year) tot ON r.year = tot.year
WHERE rr.position_number = 1
GROUP BY r.year, c.id, c.name, tot.total_races
ORDER BY win_pct DESC, r.year DESC
LIMIT 10;`
  },
  {
    id: 'most-poles-history',
    title: 'All-Time Pole Positions & Conversion Rate',
    naturalPrompt: 'Drivers with the most pole positions and their win conversion',
    category: 'drivers',
    explanation:
      'Calculates all-time pole positions and authentic pole-to-win conversion percentage (races won from pole divided by total races starting from pole, strictly bounded between 0% and 100%).',
    chartType: 'bar',
    columns: [
      { key: 'driver', label: 'Driver', type: 'string' },
      { key: 'poles', label: 'Pole Positions', type: 'number' },
      { key: 'pole_and_win', label: 'Pole & Win', type: 'number' },
      { key: 'pole_to_win_pct', label: 'Conversion %', type: 'percentage' }
    ],
    sql: `SELECT d.name AS driver,
       d.total_pole_positions AS poles,
       SUM(CASE WHEN rr.grid_position_number = 1 AND rr.position_number = 1 THEN 1 ELSE 0 END) AS pole_and_win,
       ROUND(
         100.0 * SUM(CASE WHEN rr.grid_position_number = 1 AND rr.position_number = 1 THEN 1 ELSE 0 END)
         / NULLIF(SUM(CASE WHEN rr.grid_position_number = 1 THEN 1 ELSE 0 END), 0),
         1
       ) AS pole_to_win_pct
FROM race_result rr
JOIN driver d ON rr.driver_id = d.id
WHERE d.total_pole_positions >= 15
GROUP BY d.id, d.name, d.total_pole_positions
ORDER BY d.total_pole_positions DESC
LIMIT 10;`
  },
  {
    id: 'circuit-elevation-extremes',
    title: 'Greatest Circuit Elevation Changes',
    naturalPrompt: 'Circuits with the steepest elevation changes',
    category: 'circuits',
    explanation:
      'Ranks Grand Prix circuits by vertical elevation delta using verified Open-Meteo SRTM satellite elevation data (e.g., Circuit de Spa-Francorchamps with over 100 meters of elevation change).',
    chartType: 'bar',
    columns: [
      { key: 'circuit', label: 'Circuit', type: 'string' },
      { key: 'country', label: 'Country', type: 'string' },
      { key: 'min_elevation_m', label: 'Min Elevation (m)', type: 'number' },
      { key: 'max_elevation_m', label: 'Max Elevation (m)', type: 'number' },
      { key: 'elevation_change_m', label: 'Elevation Delta (m)', type: 'number' }
    ],
    sql: `SELECT c.name AS circuit, co.name AS country,
       ce.elevation_min_m AS min_elevation_m,
       ce.elevation_max_m AS max_elevation_m,
       ce.elevation_delta_m AS elevation_change_m
FROM circuit_elevation ce
JOIN circuit c ON ce.circuit_id = c.id
LEFT JOIN country co ON c.country_id = co.id
WHERE ce.elevation_delta_m IS NOT NULL
ORDER BY ce.elevation_delta_m DESC
LIMIT 10;`
  },
  {
    id: 'most-starts-no-win',
    title: 'Most Race Starts Without a Grand Prix Victory',
    naturalPrompt: 'Drivers with the most race starts without winning a race',
    category: 'drivers',
    explanation:
      'Identifies the drivers with the longest Formula 1 careers (100+ race starts) who never stood on the top step of the podium (e.g. Nico Hülkenberg, Andrea de Cesaris, Nick Heidfeld).',
    chartType: 'bar',
    columns: [
      { key: 'driver', label: 'Driver', type: 'string' },
      { key: 'starts', label: 'Race Starts', type: 'number' },
      { key: 'podiums', label: 'Podiums', type: 'number' },
      { key: 'country', label: 'Country', type: 'string' }
    ],
    sql: `SELECT d.name AS driver, d.total_race_starts AS starts, d.total_podiums AS podiums, co.name AS country
FROM driver d
LEFT JOIN country co ON d.nationality_country_id = co.id
WHERE d.total_race_wins = 0 AND d.total_race_starts >= 100
ORDER BY d.total_race_starts DESC
LIMIT 10;`
  },
  {
    id: 'seasons-decade-summary',
    title: 'Grands Prix Held Per Decade',
    naturalPrompt: 'Grands Prix and season calendar growth by decade',
    category: 'historical_records',
    explanation:
      'Aggregates the evolution of the Formula 1 World Championship calendar from the 1950s (7–9 races per season) through the modern 2020s (22–24 races per season).',
    chartType: 'bar',
    columns: [
      { key: 'decade', label: 'Decade', type: 'string' },
      { key: 'seasons_count', label: 'Seasons', type: 'number' },
      { key: 'total_grands_prix', label: 'Total Grands Prix', type: 'number' }
    ],
    sql: `SELECT ((year / 10) * 10) || 's' AS decade,
       COUNT(DISTINCT year) AS seasons_count,
       COUNT(*) AS total_grands_prix
FROM race
GROUP BY decade
ORDER BY decade ASC;`
  },
  {
    id: 'constructor-fastest-laps',
    title: 'All-Time Constructor Fastest Laps',
    naturalPrompt: 'Constructors with the most race fastest laps',
    category: 'constructors',
    explanation:
      'Ranks the all-time leaders in race fastest laps among Formula 1 constructors (Ferrari, McLaren, Williams, Mercedes, Red Bull).',
    chartType: 'bar',
    columns: [
      { key: 'constructor', label: 'Constructor', type: 'string' },
      { key: 'fastest_laps', label: 'Fastest Laps', type: 'number' },
      { key: 'wins', label: 'Race Wins', type: 'number' }
    ],
    sql: `SELECT c.name AS constructor, c.total_fastest_laps AS fastest_laps, c.total_race_wins AS wins
FROM constructor c
WHERE c.total_fastest_laps > 20
ORDER BY c.total_fastest_laps DESC
LIMIT 10;`
  },
  {
    id: 'closest-championship-margins',
    title: 'Closest World Drivers Championship Battles',
    naturalPrompt: 'Closest championship title deciders by final points margin',
    category: 'championships',
    explanation:
      'Ranks the closest Drivers Championship finishes in history by points difference between P1 and P2 (e.g., Lauda vs Prost 1984 by 0.5 pts, Hamilton vs Massa 2008 by 1 pt, Raikkonen 2007 by 1 pt).',
    chartType: 'table',
    columns: [
      { key: 'year', label: 'Season', type: 'number' },
      { key: 'champion', label: 'Champion', type: 'string' },
      { key: 'champ_points', label: 'Champ Pts', type: 'number' },
      { key: 'runner_up', label: 'Runner-Up', type: 'string' },
      { key: 'runner_up_points', label: 'Runner-Up Pts', type: 'number' },
      { key: 'margin_points', label: 'Margin (Pts)', type: 'number' }
    ],
    sql: `SELECT p1.year,
       d1.name AS champion,
       p1.points AS champ_points,
       d2.name AS runner_up,
       p2.points AS runner_up_points,
       ROUND(p1.points - p2.points, 2) AS margin_points
FROM season_driver_standing p1
JOIN season_driver_standing p2 ON p1.year = p2.year AND p2.position_number = 2
JOIN driver d1 ON p1.driver_id = d1.id
JOIN driver d2 ON p2.driver_id = d2.id
WHERE p1.position_number = 1
ORDER BY margin_points ASC, p1.year DESC
LIMIT 10;`
  },
  {
    id: 'most-podiums-single-season',
    title: 'Most Podiums in a Single Season',
    naturalPrompt: 'Most driver podium finishes in a single Formula 1 season',
    category: 'drivers',
    explanation:
      'Records the highest number of podium finishes achieved by a driver in a single season (e.g., Max Verstappen 2023 with 21 podiums, Michael Schumacher 2002 with 100% podium rate).',
    chartType: 'bar',
    columns: [
      { key: 'year', label: 'Season', type: 'number' },
      { key: 'driver', label: 'Driver', type: 'string' },
      { key: 'podiums_in_season', label: 'Podiums', type: 'number' },
      { key: 'total_races', label: 'Calendar Races', type: 'number' },
      { key: 'podium_pct', label: 'Podium Rate %', type: 'percentage' }
    ],
    sql: `SELECT sds.year, d.name AS driver,
       COUNT(CASE WHEN rr.position_number IN (1, 2, 3) THEN 1 END) AS podiums_in_season,
       tot.total_races,
       ROUND(100.0 * COUNT(CASE WHEN rr.position_number IN (1, 2, 3) THEN 1 END) / tot.total_races, 1) AS podium_pct
FROM season_driver_standing sds
JOIN driver d ON sds.driver_id = d.id
JOIN race r ON r.year = sds.year
JOIN race_result rr ON rr.race_id = r.id AND rr.driver_id = d.id
JOIN (SELECT year, COUNT(*) AS total_races FROM race GROUP BY year) tot ON r.year = tot.year
GROUP BY sds.year, d.id, d.name, tot.total_races
ORDER BY podiums_in_season DESC, podium_pct DESC
LIMIT 10;`
  }
];
