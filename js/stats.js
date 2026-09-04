/* ===========================================================
   stats.js
   Player statistics aggregation from completed match data.
   No backend required — reads the app's existing localStorage data.
   =========================================================== */

const StatsManager = (function () {
  function getCompletedMatches() {
    return StorageManager.getCompletedMatches();
  }

  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function strikeRate(stat) {
    const balls = safeNumber(stat.balls);
    return balls > 0 ? (safeNumber(stat.runs) / balls) * 100 : 0;
  }

  function battingAverage(stat) {
    const outs = safeNumber(stat.dismissals);
    const runs = safeNumber(stat.runs);

    if (outs === 0) return null;
    return runs / outs;
  }

  function economyRate(stat) {
    const balls = safeNumber(stat.ballsBowled);
    const runs = safeNumber(stat.runsConceded);

    if (balls === 0) return 0;
    return (runs / balls) * 6;
  }

  function getPlayerStats() {
    const matches = getCompletedMatches();
    const players = {};

    matches.forEach((match) => {
      (match.innings || []).forEach((innings) => {
        Object.values(innings.battingStats || {}).forEach((stat) => {
          if (!players[stat.id]) {
            players[stat.id] = {
              id: stat.id,
              name: stat.name || "Unknown",
              matches: 0,
              innings: 0,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              dismissals: 0,
              highestScore: 0,
              bowlingMatches: 0,
              oversBalls: 0,
              runsConceded: 0,
              wickets: 0,
              maidens: 0,
            };
          }

          const p = players[stat.id];

          p.innings += 1;
          p.runs += safeNumber(stat.runs);
          p.balls += safeNumber(stat.balls);
          p.fours += safeNumber(stat.fours);
          p.sixes += safeNumber(stat.sixes);
          p.dismissals += stat.out ? 1 : 0;
          p.highestScore = Math.max(p.highestScore, safeNumber(stat.runs));
        });

        Object.values(innings.bowlingStats || {}).forEach((stat) => {
          if (!players[stat.id]) {
            players[stat.id] = {
              id: stat.id,
              name: stat.name || "Unknown",
              matches: 0,
              innings: 0,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              dismissals: 0,
              highestScore: 0,
              bowlingMatches: 0,
              oversBalls: 0,
              runsConceded: 0,
              wickets: 0,
              maidens: 0,
            };
          }

          const p = players[stat.id];

          p.bowlingMatches += 1;
          p.oversBalls += safeNumber(stat.ballsBowled);
          p.runsConceded += safeNumber(stat.runsConceded);
          p.wickets += safeNumber(stat.wickets);
          p.maidens += safeNumber(stat.maidens);
        });
      });
    });

    // Count a match once if the player appeared in either batting or bowling stats.
    Object.values(players).forEach((p) => {
      p.matches = 0;

      matches.forEach((match) => {
        let appeared = false;

        (match.innings || []).forEach((innings) => {
          if (
            (innings.battingStats && innings.battingStats[p.id]) ||
            (innings.bowlingStats && innings.bowlingStats[p.id])
          ) {
            appeared = true;
          }
        });

        if (appeared) p.matches += 1;
      });

      p.average = battingAverage(p);
      p.strikeRate = strikeRate(p);
      p.economy = economyRate(p);
    });

    return Object.values(players);
  }

  function formatAverage(value) {
    return value === null ? "—" : value.toFixed(2);
  }

  function formatOvers(balls) {
    return MatchManager.oversDisplay(safeNumber(balls));
  }

  function getTopBatters(stats, limit = 5) {
    return [...stats]
      .filter((p) => p.runs > 0)
      .sort((a, b) => b.runs - a.runs || b.strikeRate - a.strikeRate)
      .slice(0, limit);
  }

  function getTopBowlers(stats, limit = 5) {
    return [...stats]
      .filter((p) => p.wickets > 0 || p.oversBalls > 0)
      .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)
      .slice(0, limit);
  }

  return {
    getCompletedMatches,
    getPlayerStats,
    getTopBatters,
    getTopBowlers,
    formatAverage,
    formatOvers,
  };
})();
