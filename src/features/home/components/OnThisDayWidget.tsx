import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Award, ChevronRight } from 'lucide-react';
import { resolveDataUrl } from '../../../services/archiveDataClient';

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
    fetch(resolveDataUrl('/data/historical-events.json'))
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
      <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8 text-neutral-400 font-mono text-xs animate-pulse">
        ACCESSING 77 YEARS OF F1 CHRONOLOGY...
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

  const exactRaces = data.races.filter((r) => r.date && r.date.endsWith(todayMMDD));
  const exactBirthdays = data.birthdays.filter((b) => b.birthDate && b.birthDate.endsWith(todayMMDD));

  const hasExact = exactRaces.length > 0 || exactBirthdays.length > 0;

  let displayTitle = '';
  let isFallback = false;
  let matchingRaces: HistoricalRace[] = [];
  let matchingBirthdays: HistoricalBirthday[] = [];

  if (hasExact) {
    displayTitle = `ON THIS DAY // ${MONTH_NAMES[currentMonth - 1].toUpperCase()} ${currentDay}`;
    matchingRaces = exactRaces;
    matchingBirthdays = exactBirthdays;
  } else {
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
      displayTitle = `HISTORICAL MILESTONE // ${MONTH_NAMES[m - 1].toUpperCase()} ${d}`;
    } else if (closestBirthday) {
      matchingBirthdays = [closestBirthday];
      const parts = closestBirthday.birthDate.split('-');
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      displayTitle = `HISTORICAL MILESTONE // ${MONTH_NAMES[m - 1].toUpperCase()} ${d}`;
    }
  }

  return (
    <div className="p-4 rounded-[4px] bg-[#11151E] border border-white/8 text-neutral-300 on-this-day-panel">
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
            {displayTitle}
          </h3>
        </div>
        {isFallback && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/8">
            Nearest Event
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {matchingRaces.slice(0, 2).map((race) => (
          <div
            key={`${race.year}_${race.round}`}
            className="p-3 rounded-[3px] bg-[#181D28] border border-white/6 hover:border-white/12 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                <Trophy className="w-3 h-3 text-crimson" />
                <span>GRAND PRIX // {race.year}</span>
              </div>
              <h4 className="text-sm font-semibold text-white tracking-tight mb-2">
                {race.name}
              </h4>
              <div className="text-xs text-neutral-300 mb-2 font-mono">
                {race.winnerName ? (
                  <span>
                    WINNER: <strong className="text-white">{race.winnerName}</strong>
                    {race.winnerConstructor && (
                      <span className="text-neutral-400"> ({race.winnerConstructor})</span>
                    )}
                  </span>
                ) : (
                  <span>ROUND {race.round} OF {race.year}</span>
                )}
              </div>
            </div>
            <Link
              to="/seasons"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-crimson hover:text-white uppercase tracking-wider transition-colors pt-1 border-t border-white/5"
            >
              <span>{race.year} Season Archive</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        ))}

        {matchingBirthdays.slice(0, 2).map((driver) => {
          const birthYear = parseInt(driver.birthDate.slice(0, 4), 10);
          const age = isNaN(birthYear) ? null : currentYear - birthYear;

          return (
            <div
              key={driver.id}
              className="p-3 rounded-[3px] bg-[#181D28] border border-white/6 hover:border-white/12 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>DRIVER BIRTHDAY // {driver.country.toUpperCase()}</span>
                </div>
                <h4 className="text-sm font-semibold text-white tracking-tight mb-2">
                  {driver.name}
                </h4>
                <div className="text-xs text-neutral-300 mb-2 font-mono">
                  {driver.championships > 0 ? (
                    <span className="text-amber-300 font-semibold">
                      🏆 {driver.championships}x World Champion
                    </span>
                  ) : (
                    <span>Formula 1 Racing Driver</span>
                  )}
                  {driver.wins > 0 && (
                    <span className="text-neutral-400"> • {driver.wins} wins</span>
                  )}
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Born {driver.birthDate} {age ? `(${age} years ago)` : ''}
                  </div>
                </div>
              </div>
              <Link
                to={`/drivers/${driver.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-crimson hover:text-white uppercase tracking-wider transition-colors pt-1 border-t border-white/5"
              >
                <span>Driver Telemetry</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
