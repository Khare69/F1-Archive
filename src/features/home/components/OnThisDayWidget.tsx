import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OnThisDayWidget.css';

interface HistoricalRace {
  year: number;
  round: number;
  date: string;
  name: string;
  circuitId: string;
  winnerName: string | null;
  winnerConstructor: string | null;
}

interface HistoricalBirthday {
  id: string;
  name: string;
  code: string;
  birthDate: string;
  country: string;
  championships: number;
  wins: number;
}

interface HistoricalEventsData {
  races: HistoricalRace[];
  birthdays: HistoricalBirthday[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDayOfYear(month: number, day: number): number {
  const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let m = 0; m < month - 1; m++) {
    total += daysInMonths[m];
  }
  return total + day;
}

export const OnThisDayWidget: React.FC = () => {
  const [data, setData] = useState<HistoricalEventsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/data/historical-events.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load historical events');
        return res.json();
      })
      .then((json: HistoricalEventsData) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[OnThisDay] Offline historical events fetch error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="on-this-day-panel telemetry-panel corner-bracket">
        <div className="otd-header telemetry">
          <span className="otd-blip"></span>
          <span>HISTORICAL ARCHIVE CHRONOLOGY</span>
        </div>
        <div className="otd-loading telemetry">ACCESSING 77 YEARS OF F1 CHRONOLOGY...</div>
      </div>
    );
  }

  if (!data || (!data.races.length && !data.birthdays.length)) {
    return null;
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();
  const todayMMDD = `-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
  const todayDoy = getDayOfYear(currentMonth, currentDay);

  // 1. Check exact matches for today
  const exactRaces = data.races.filter((r) => r.date && r.date.endsWith(todayMMDD));
  const exactBirthdays = data.birthdays.filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));

  const hasExact = exactRaces.length > 0 || exactBirthdays.length > 0;

  let displayTitle = '';
  let isFallback = false;
  let matchingRaces: HistoricalRace[] = [];
  let matchingBirthdays: HistoricalBirthday[] = [];

  if (hasExact) {
    displayTitle = `ON THIS DAY IN F1 // ${MONTH_NAMES[currentMonth - 1].toUpperCase()} ${currentDay}`;
    matchingRaces = exactRaces;
    matchingBirthdays = exactBirthdays;
  } else {
    // 2. Fallback: Find closest historical event within ±7 days
    isFallback = true;
    let closestDiff = 999;
    let closestRace: HistoricalRace | null = null;
    let closestBirthday: HistoricalBirthday | null = null;

    for (const r of data.races) {
      if (!r.date) continue;
      const parts = r.date.split('-');
      if (parts.length < 3) continue;
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const doy = getDayOfYear(m, d);
      const diff = Math.min(Math.abs(doy - todayDoy), 366 - Math.abs(doy - todayDoy));
      if (diff < closestDiff) {
        closestDiff = diff;
        closestRace = r;
      }
    }

    for (const b of data.birthdays) {
      if (!b.birthDate) continue;
      const parts = b.birthDate.split('-');
      if (parts.length < 3) continue;
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const doy = getDayOfYear(m, d);
      const diff = Math.min(Math.abs(doy - todayDoy), 366 - Math.abs(doy - todayDoy));
      if (diff < closestDiff) {
        closestDiff = diff;
        closestRace = null;
        closestBirthday = b;
      }
    }

    if (closestRace) {
      matchingRaces = [closestRace];
      const parts = closestRace.date.split('-');
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      displayTitle = `THIS WEEK IN F1 HISTORY // ${MONTH_NAMES[m - 1].toUpperCase()} ${d}`;
    } else if (closestBirthday) {
      matchingBirthdays = [closestBirthday];
      const parts = closestBirthday.birthDate.split('-');
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      displayTitle = `THIS WEEK IN F1 HISTORY // ${MONTH_NAMES[m - 1].toUpperCase()} ${d}`;
    }
  }

  return (
    <div className="on-this-day-panel telemetry-panel corner-bracket">
      <div className="otd-header telemetry">
        <span className={`otd-blip ${isFallback ? 'otd-blip-fallback' : 'otd-blip-live'}`}></span>
        <span className="otd-title-tag">{displayTitle}</span>
        {isFallback && <span className="otd-fallback-pill telemetry">CHRONOLOGY HIGHLIGHT</span>}
      </div>

      <div className="otd-events-grid">
        {/* Race Events */}
        {matchingRaces.slice(0, 2).map((race) => (
          <div key={`${race.year}_${race.round}`} className="otd-event-card">
            <div className="otd-card-type telemetry">
              <span className="otd-icon">🏁</span>
              <span>GRAND PRIX RACE FINISH // {race.year}</span>
            </div>
            <h4 className="otd-event-name headline">{race.name}</h4>
            <div className="otd-event-details telemetry">
              {race.winnerName ? (
                <div>
                  <span className="otd-label">WINNER: </span>
                  <span className="otd-value-highlight">{race.winnerName}</span>
                  {race.winnerConstructor && (
                    <span className="otd-value-muted"> ({race.winnerConstructor})</span>
                  )}
                </div>
              ) : (
                <div>ROUND {race.round} OF {race.year} CHAMPIONSHIP</div>
              )}
              <div className="otd-date-tag">
                RECORDED DATE: {race.date} • CIRCUIT: {race.circuitId.toUpperCase()}
              </div>
            </div>
            <Link to="/seasons" className="otd-link telemetry">
              VIEW {race.year} SEASON ARCHIVE →
            </Link>
          </div>
        ))}

        {/* Driver Birthdays */}
        {matchingBirthdays.slice(0, 2).map((driver) => {
          const birthYear = parseInt(driver.birthDate.slice(0, 4), 10);
          const age = isNaN(birthYear) ? null : currentYear - birthYear;

          return (
            <div key={driver.id} className="otd-event-card otd-driver-card">
              <div className="otd-card-type telemetry">
                <span className="otd-icon">🎂</span>
                <span>DRIVER BIRTHDAY // {driver.country.toUpperCase()}</span>
              </div>
              <h4 className="otd-event-name headline">{driver.name}</h4>
              <div className="otd-event-details telemetry">
                <div>
                  {driver.championships > 0 ? (
                    <span className="otd-champ-badge">🏆 {driver.championships}X WORLD CHAMPION</span>
                  ) : (
                    <span>FORMULA 1 RACING DRIVER</span>
                  )}
                  {driver.wins > 0 && <span className="otd-wins-badge"> • {driver.wins} WINS</span>}
                </div>
                <div className="otd-date-tag">
                  BORN {driver.birthDate} {age ? `(${age} YEARS AGO)` : ''}
                </div>
              </div>
              <Link to={`/drivers/${driver.id}`} className="otd-link telemetry">
                VIEW DRIVER CAREER TELEMETRY →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
