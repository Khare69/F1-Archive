import { EntityIndex, ParsedNaturalQuery } from './types';
import { HISTORIAN_PRESETS } from './presets';

// Stopwords that collide with driver surnames or circuit places
const STOPWORDS = new Set([
  'best', 'long', 'king', 'hill', 'hall', 'bell', 'park', 'west',
  'hart', 'bond', 'rose', 'wolf', 'moss', 'fast', 'race', 'win',
  'star', 'gold', 'white', 'brown', 'green', 'young', 'short',
  'cross', 'burns', 'speed', 'power'
]);

function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWordBoundaryMatch(text: string, term: string): boolean {
  const normText = normalizeString(text);
  const normTerm = normalizeString(term);
  if (!normTerm) return false;
  const regex = new RegExp(`(?<![a-z0-9])${escapeRegExp(normTerm)}(?![a-z0-9])`, 'i');
  return regex.test(normText);
}

// Built-in entity index covering historical drivers, constructors, and circuits
export const DEFAULT_ENTITY_INDEX: EntityIndex = {
  drivers: [
    { id: 'lewis-hamilton', name: 'Lewis Hamilton', surname: 'Hamilton', aliases: ['hamilton', 'sir lewis'] },
    { id: 'michael-schumacher', name: 'Michael Schumacher', surname: 'Schumacher', aliases: ['schumacher', 'schumi'] },
    { id: 'ayrton-senna', name: 'Ayrton Senna', surname: 'Senna', aliases: ['senna'] },
    { id: 'alain-prost', name: 'Alain Prost', surname: 'Prost', aliases: ['prost', 'the professor'] },
    { id: 'max-verstappen', name: 'Max Verstappen', surname: 'Verstappen', aliases: ['verstappen'] },
    { id: 'sebastian-vettel', name: 'Sebastian Vettel', surname: 'Vettel', aliases: ['vettel'] },
    { id: 'fernando-alonso', name: 'Fernando Alonso', surname: 'Alonso', aliases: ['alonso'] },
    { id: 'kimi-raikkonen', name: 'Kimi Räikkönen', surname: 'Räikkönen', aliases: ['raikkonen', 'the iceman'] },
    { id: 'charles-leclerc', name: 'Charles Leclerc', surname: 'Leclerc', aliases: ['leclerc'] },
    { id: 'lando-norris', name: 'Lando Norris', surname: 'Norris', aliases: ['norris'] },
    { id: 'nico-rosberg', name: 'Nico Rosberg', surname: 'Rosberg', aliases: ['rosberg'] },
    { id: 'nico-hulkenberg', name: 'Nico Hülkenberg', surname: 'Hülkenberg', aliases: ['hulkenberg', 'hulk'] },
    { id: 'sergio-perez', name: 'Sergio Pérez', surname: 'Pérez', aliases: ['perez', 'checo'] },
    { id: 'valtteri-bottas', name: 'Valtteri Bottas', surname: 'Bottas', aliases: ['bottas'] },
    { id: 'rubens-barrichello', name: 'Rubens Barrichello', surname: 'Barrichello', aliases: ['barrichello'] },
    { id: 'david-coulthard', name: 'David Coulthard', surname: 'Coulthard', aliases: ['coulthard'] },
    { id: 'juan-manuel-fangio', name: 'Juan Manuel Fangio', surname: 'Fangio', aliases: ['fangio'] },
    { id: 'niki-lauda', name: 'Niki Lauda', surname: 'Lauda', aliases: ['lauda'] },
    { id: 'jim-clark', name: 'Jim Clark', surname: 'Clark', aliases: ['clark'] },
    { id: 'jackie-stewart', name: 'Jackie Stewart', surname: 'Stewart', aliases: ['stewart'] },
    { id: 'damon-hill', name: 'Damon Hill', surname: 'Hill', aliases: ['damon hill'] },
    { id: 'graham-hill', name: 'Graham Hill', surname: 'Hill', aliases: ['graham hill'] },
    { id: 'stirling-moss', name: 'Stirling Moss', surname: 'Moss', aliases: ['stirling moss'] },
    { id: 'jerome-dambrosio', name: "Jérôme d'Ambrosio", surname: "d'Ambrosio", aliases: ["d'ambrosio", 'dambrosio', 'jerome dambrosio'] }
  ],
  constructors: [
    { id: 'ferrari', name: 'Ferrari', aliases: ['scuderia ferrari', 'ferrari'] },
    { id: 'mclaren', name: 'McLaren', aliases: ['mclaren racing', 'mclaren'] },
    { id: 'mercedes', name: 'Mercedes', aliases: ['mercedes-amg', 'mercedes'] },
    { id: 'red-bull', name: 'Red Bull', aliases: ['red bull racing', 'red bull', 'rbr'] },
    { id: 'williams', name: 'Williams', aliases: ['williams racing', 'williams'] },
    { id: 'renault', name: 'Renault', aliases: ['renault f1', 'renault', 'alpine'] },
    { id: 'aston-martin', name: 'Aston Martin', aliases: ['aston martin'] },
    { id: 'audi', name: 'Audi', aliases: ['audi'] },
    { id: 'cadillac', name: 'Cadillac', aliases: ['cadillac'] },
    { id: 'haas', name: 'Haas', aliases: ['haas f1 team', 'haas'] },
    { id: 'racing-bulls', name: 'Racing Bulls', aliases: ['racing bulls', 'rb', 'toro rosso', 'alphatauri'] }
  ],
  circuits: [
    { id: 'monza', name: 'Monza', aliases: ['monza', 'autodromo nazionale di monza', 'temple of speed'] },
    { id: 'silverstone', name: 'Silverstone', aliases: ['silverstone', 'silverstone circuit'] },
    { id: 'spa', name: 'Spa-Francorchamps', aliases: ['spa', 'spa-francorchamps'] },
    { id: 'monaco', name: 'Monaco', aliases: ['monaco', 'monte carlo', 'circuit de monaco'] },
    { id: 'suzuka', name: 'Suzuka', aliases: ['suzuka', 'suzuka circuit'] },
    { id: 'interlagos', name: 'Interlagos', aliases: ['interlagos', 'autodromo jose carlos pace', 'brazil'] },
    { id: 'austin', name: 'COTA (Austin)', aliases: ['austin', 'cota', 'circuit of the americas'] },
    { id: 'bahrain', name: 'Bahrain', aliases: ['bahrain', 'sakhir'] },
    { id: 'melbourne', name: 'Melbourne (Albert Park)', aliases: ['albert park', 'melbourne'] },
    { id: 'montreal', name: 'Montreal (Gilles Villeneuve)', aliases: ['montreal', 'circuit gilles villeneuve'] }
  ]
};

export function formatSqlWithBoundParamsForDisplay(sql: string, params: (string | number)[]): string {
  if (!params || params.length === 0) return sql;

  let paramIdx = 0;
  return sql.replace(/\?/g, () => {
    if (paramIdx >= params.length) return '?';
    const val = params[paramIdx++];
    if (typeof val === 'number') return String(val);
    const escaped = String(val).replace(/'/g, "''");
    return `'${escaped}'`;
  });
}

export function parseNaturalLanguageQuery(
  rawInput: string,
  entityIndex: EntityIndex = DEFAULT_ENTITY_INDEX
): ParsedNaturalQuery {
  const input = rawInput.trim();
  if (!input) {
    return {
      matched: false,
      title: 'Query Not Understood',
      explanation: 'Please enter a search prompt or question.',
      sql: '',
      params: [],
      category: 'unrecognized',
      chartType: 'table',
      suggestions: [
        'Top 10 All-Time Grand Prix Winners',
        'Lewis Hamilton wins at Silverstone',
        '2021 World Championship standings',
        'Monza all-time race winners'
      ]
    };
  }

  const normInput = normalizeString(input);

  // 1. Check exact or high-confidence match with presets
  for (const preset of HISTORIAN_PRESETS) {
    const normPrompt = normalizeString(preset.naturalPrompt);
    const normTitle = normalizeString(preset.title);

    if (
      normInput === normPrompt ||
      normInput === normTitle ||
      (normInput.length > 8 && normPrompt.includes(normInput)) ||
      (normInput.length > 8 && normTitle.includes(normInput))
    ) {
      return {
        matched: true,
        title: preset.title,
        explanation: preset.explanation,
        sql: preset.sql,
        params: [],
        category: preset.category,
        chartType: preset.chartType
      };
    }
  }

  // 2. Extract multi-entity slots
  // Extract 4-digit year (1950 - 2026)
  let extractedYear: number | null = null;
  const yearMatch = normInput.match(/\b(19\d\d|20[0-2]\d)\b/);
  if (yearMatch) {
    extractedYear = parseInt(yearMatch[1], 10);
  }

  // Extract driver
  let matchedDriver: { id: string; name: string } | null = null;
  for (const driver of entityIndex.drivers) {
    // Full name match
    if (hasWordBoundaryMatch(normInput, driver.name)) {
      matchedDriver = driver;
      break;
    }
    // Check aliases
    const aliasMatch = (driver.aliases || []).some((alias) => {
      const normAlias = normalizeString(alias);
      if (STOPWORDS.has(normAlias)) {
        return false;
      }
      return hasWordBoundaryMatch(normInput, alias);
    });
    if (aliasMatch) {
      matchedDriver = driver;
      break;
    }
    // Surname match (only if not a stopword)
    const normSurname = normalizeString(driver.surname);
    if (!STOPWORDS.has(normSurname) && hasWordBoundaryMatch(normInput, normSurname)) {
      matchedDriver = driver;
      break;
    }
  }

  // Extract constructor
  let matchedConstructor: { id: string; name: string } | null = null;
  for (const constructor of entityIndex.constructors) {
    if (hasWordBoundaryMatch(normInput, constructor.name)) {
      matchedConstructor = constructor;
      break;
    }
    const aliasMatch = (constructor.aliases || []).some((alias) => {
      const normAlias = normalizeString(alias);
      if (STOPWORDS.has(normAlias)) return false;
      return hasWordBoundaryMatch(normInput, alias);
    });
    if (aliasMatch) {
      matchedConstructor = constructor;
      break;
    }
  }

  // Extract circuit
  let matchedCircuit: { id: string; name: string } | null = null;
  for (const circuit of entityIndex.circuits) {
    if (hasWordBoundaryMatch(normInput, circuit.name)) {
      matchedCircuit = circuit;
      break;
    }
    const aliasMatch = (circuit.aliases || []).some((alias) => {
      const normAlias = normalizeString(alias);
      if (STOPWORDS.has(normAlias)) return false;
      return hasWordBoundaryMatch(normInput, alias);
    });
    if (aliasMatch) {
      matchedCircuit = circuit;
      break;
    }
  }

  // Determine user intent
  let intent: 'wins' | 'poles' | 'podiums' | 'standings' | 'results' = 'results';
  if (/\b(win|wins|won|victories|victory|first)\b/i.test(normInput)) {
    intent = 'wins';
  } else if (/\b(pole|poles|qualifying)\b/i.test(normInput)) {
    intent = 'poles';
  } else if (/\b(podium|podiums|top 3)\b/i.test(normInput)) {
    intent = 'podiums';
  } else if (/\b(standing|standings|championship|points|title)\b/i.test(normInput)) {
    intent = 'standings';
  }

  // 3. Synthesize parameterized SQL queries based on extracted slots
  // Case A: Driver + Circuit + Year
  if (matchedDriver && matchedCircuit && extractedYear) {
    const params: (string | number)[] = [matchedDriver.id, matchedCircuit.id, extractedYear];
    let positionFilter = '';
    let metricLabel = 'results';
    if (intent === 'wins') {
      positionFilter = ' AND rr.position_number = 1';
      metricLabel = 'victories';
    } else if (intent === 'poles') {
      positionFilter = ' AND rr.grid_position_number = 1';
      metricLabel = 'pole positions';
    } else if (intent === 'podiums') {
      positionFilter = ' AND rr.position_number IN (1, 2, 3)';
      metricLabel = 'podiums';
    }

    const sql = `SELECT r.year, r.official_name AS race_name, c.name AS circuit, d.name AS driver,
       rr.grid_position_number AS start_pos, rr.position_number AS finish_pos, rr.points
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN circuit c ON r.circuit_id = c.id
JOIN driver d ON rr.driver_id = d.id
WHERE rr.driver_id = ? AND r.circuit_id = ? AND r.year = ?${positionFilter}
ORDER BY r.date ASC;`;

    return {
      matched: true,
      title: `${matchedDriver.name} at ${matchedCircuit.name} (${extractedYear})`,
      explanation: `Analyzes race ${metricLabel} for ${matchedDriver.name} at ${matchedCircuit.name} during the ${extractedYear} season.`,
      sql,
      params,
      category: 'drivers',
      chartType: 'table'
    };
  }

  // Case B: Driver + Circuit
  if (matchedDriver && matchedCircuit) {
    const params: (string | number)[] = [matchedDriver.id, matchedCircuit.id];
    let positionFilter = '';
    let metricLabel = 'career appearances';
    if (intent === 'wins') {
      positionFilter = ' AND rr.position_number = 1';
      metricLabel = 'race wins';
    } else if (intent === 'poles') {
      positionFilter = ' AND rr.grid_position_number = 1';
      metricLabel = 'pole positions';
    } else if (intent === 'podiums') {
      positionFilter = ' AND rr.position_number IN (1, 2, 3)';
      metricLabel = 'podium finishes';
    }

    const sql = `SELECT r.year, r.official_name AS grand_prix,
       rr.grid_position_number AS grid, rr.position_number AS finish, rr.points
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN circuit c ON r.circuit_id = c.id
JOIN driver d ON rr.driver_id = d.id
WHERE rr.driver_id = ? AND r.circuit_id = ?${positionFilter}
ORDER BY r.year DESC;`;

    return {
      matched: true,
      title: `${matchedDriver.name} at ${matchedCircuit.name}`,
      explanation: `Historical record of ${metricLabel} for ${matchedDriver.name} at ${matchedCircuit.name} across all seasons.`,
      sql,
      params,
      category: 'circuits',
      chartType: 'table'
    };
  }

  // Case C: Driver + Year
  if (matchedDriver && extractedYear) {
    const params: (string | number)[] = [matchedDriver.id, extractedYear];
    const sql = `SELECT r.round, r.official_name AS grand_prix,
       rr.grid_position_number AS start_pos, rr.position_number AS finish_pos,
       rr.points, rr.fastest_lap
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN driver d ON rr.driver_id = d.id
WHERE rr.driver_id = ? AND r.year = ?
ORDER BY r.round ASC;`;

    return {
      matched: true,
      title: `${matchedDriver.name} — ${extractedYear} Season Results`,
      explanation: `Complete race-by-race breakdown for ${matchedDriver.name} throughout the ${extractedYear} World Championship season.`,
      sql,
      params,
      category: 'drivers',
      chartType: 'table'
    };
  }

  // Case D: Driver Only
  if (matchedDriver) {
    if (intent === 'wins') {
      const sql = `SELECT r.year, r.official_name AS grand_prix, c.name AS circuit,
       rr.grid_position_number AS grid, co.name AS constructor
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN circuit c ON r.circuit_id = c.id
JOIN driver d ON rr.driver_id = d.id
JOIN constructor co ON rr.constructor_id = co.id
WHERE rr.driver_id = ? AND rr.position_number = 1
ORDER BY r.date DESC;`;

      return {
        matched: true,
        title: `${matchedDriver.name} Career Race Wins`,
        explanation: `Every Formula 1 World Championship Grand Prix victory achieved by ${matchedDriver.name}.`,
        sql,
        params: [matchedDriver.id],
        category: 'drivers',
        chartType: 'table'
      };
    } else {
      const sql = `SELECT d.name, co.name AS nationality,
       d.total_championship_wins AS titles, d.total_race_wins AS wins,
       d.total_podiums AS podiums, d.total_pole_positions AS poles,
       d.total_fastest_laps AS fastest_laps, d.total_race_starts AS starts
FROM driver d
LEFT JOIN country co ON d.nationality_country_id = co.id
WHERE d.id = ?;`;

      return {
        matched: true,
        title: `${matchedDriver.name} Career Overview`,
        explanation: `Official career statistics and World Championship achievements for ${matchedDriver.name}.`,
        sql,
        params: [matchedDriver.id],
        category: 'drivers',
        chartType: 'table'
      };
    }
  }

  // Case E: Season Standings (Year Only or Year + Standings)
  if (extractedYear) {
    const sql = `SELECT sds.position_number AS pos, d.name AS driver,
       sds.points, sds.championship_won
FROM season_driver_standing sds
JOIN driver d ON sds.driver_id = d.id
WHERE sds.year = ?
ORDER BY sds.position_number ASC
LIMIT 20;`;

    return {
      matched: true,
      title: `${extractedYear} World Drivers Championship Standings`,
      explanation: `Final official World Drivers Championship classification for the ${extractedYear} Formula 1 season.`,
      sql,
      params: [extractedYear],
      category: 'championships',
      chartType: 'bar'
    };
  }

  // Case F: Circuit Only
  if (matchedCircuit) {
    const sql = `SELECT d.name AS driver, COUNT(*) AS wins
FROM race_result rr
JOIN race r ON rr.race_id = r.id
JOIN driver d ON rr.driver_id = d.id
WHERE r.circuit_id = ? AND rr.position_number = 1
GROUP BY d.id, d.name
ORDER BY wins DESC, d.name ASC
LIMIT 10;`;

    return {
      matched: true,
      title: `All-Time Race Winners at ${matchedCircuit.name}`,
      explanation: `All-time Grand Prix victory leaders at ${matchedCircuit.name}.`,
      sql,
      params: [matchedCircuit.id],
      category: 'circuits',
      chartType: 'bar'
    };
  }

  // Case G: Constructor Only
  if (matchedConstructor) {
    const sql = `SELECT c.name, co.name AS country,
       c.total_championship_wins AS titles, c.total_race_wins AS wins,
       c.total_podiums AS podiums, c.total_pole_positions AS poles
FROM constructor c
LEFT JOIN country co ON c.country_id = co.id
WHERE c.id = ?;`;

    return {
      matched: true,
      title: `${matchedConstructor.name} Constructor Profile`,
      explanation: `Historical record and total statistics for ${matchedConstructor.name}.`,
      sql,
      params: [matchedConstructor.id],
      category: 'constructors',
      chartType: 'table'
    };
  }

  // 4. Fallback: Query not understood (explicit unrecognized response)
  return {
    matched: false,
    title: 'Query Not Understood',
    explanation:
      'Could not map this prompt to known Formula 1 drivers, constructors, circuits, or seasons. Edit the SQL directly below or try one of the suggested queries.',
    sql: '',
    params: [],
    category: 'unrecognized',
    chartType: 'table',
    suggestions: [
      'Top 10 All-Time Grand Prix Winners',
      'Lewis Hamilton wins at Silverstone',
      '2021 World Championship standings',
      'Monza all-time race winners'
    ]
  };
}
