/* ===========================================================
   match.js
   Match setup: creating a match object, toss handling,
   playing XI, and innings initialization.
   Used by create-match.html and live-match.html
   =========================================================== */

const MatchManager = (function () {
  /**
   * Creates a fresh, empty innings object.
   */
  function createInnings(battingTeamId, bowlingTeamId, oversLimit) {
    return {
      battingTeamId,
      bowlingTeamId,
      totalRuns: 0,
      wickets: 0,
      legalBalls: 0, // total legal balls bowled this innings
      oversLimit: oversLimit,
      extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
      battingStats: {}, // playerId -> {runs, balls, fours, sixes, out, howOut, outSummary}
      bowlingStats: {}, // playerId -> {ballsBowled, runsConceded, wickets, maidens, thisOverRuns}
      strikerId: null,
      nonStrikerId: null,
      currentBowlerId: null,
      previousBowlerId: null,
      currentOverBalls: [], // array of ball-display objects for the over in progress
      timeline: [], // full history of ball events (for undo + over summary)
      fallOfWickets: [], // {score, wicketNumber, batsmanName, overStr}
      target: null,
      completed: false,
      completionReason: null,
    };
  }

  function ensureBattingStat(innings, playerId, playerName) {
    if (!innings.battingStats[playerId]) {
      innings.battingStats[playerId] = {
        id: playerId,
        name: playerName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false,
        howOut: "",
        didBat: true,
      };
    }
    return innings.battingStats[playerId];
  }

  function ensureBowlingStat(innings, playerId, playerName) {
    if (!innings.bowlingStats[playerId]) {
      innings.bowlingStats[playerId] = {
        id: playerId,
        name: playerName,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        completedOversRuns: 0, // runs conceded in overs completed so far (for maiden tracking)
      };
    }
    return innings.bowlingStats[playerId];
  }

  function oversDisplay(legalBalls) {
    const overs = Math.floor(legalBalls / 6);
    const balls = legalBalls % 6;
    return overs + "." + balls;
  }

  function getPlayerFromTeamSnapshot(team, playerId) {
    return team.players.find((p) => p.id === playerId) || null;
  }

  function getCurrentInnings(match) {
    return match.innings[match.currentInningsIndex];
  }

  function getBattingTeam(match, innings) {
    return innings.battingTeamId === match.team1.id ? match.team1 : match.team2;
  }

  function getBowlingTeam(match, innings) {
    return innings.bowlingTeamId === match.team1.id ? match.team1 : match.team2;
  }

  /**
   * Builds a match object from the create-match form.
   * team1, team2 are FULL team objects (snapshotted at match creation
   * time so later edits to the team roster don't retroactively change
   * a match in progress).
   */
  function buildMatch(formData, team1, team2) {
    const battingFirstId =
      formData.tossDecision === "Bat" ? formData.tossWinnerId : otherTeamId(formData, team1, team2);

    const bowlingFirstId =
      battingFirstId === team1.id ? team2.id : team1.id;

    return {
      id: StorageManager.generateId("match"),
      matchName: formData.matchName.trim(),
      date: formData.date,
      venue: formData.venue.trim(),
      oversLimit: parseInt(formData.overs, 10),
      team1: team1,
      team2: team2,
      tossWinnerId: formData.tossWinnerId,
      tossDecision: formData.tossDecision,
      battingFirstId: battingFirstId,
      bowlingFirstId: bowlingFirstId,
      playingXI1: team1.players.map((p) => p.id), // v1: full squad is playing XI
      playingXI2: team2.players.map((p) => p.id),
      innings: [],
      currentInningsIndex: 0,
      status: "setup", // setup -> live -> completed
      winner: null,
      winnerId: null,
      resultText: null,
      createdAt: new Date().toISOString(),
    };
  }

  function otherTeamId(formData, team1, team2) {
    return formData.tossWinnerId === team1.id ? team2.id : team1.id;
  }

  /**
   * Starts the first innings once striker/non-striker/bowler are chosen.
   */
  function startFirstInnings(match, strikerId, nonStrikerId, bowlerId) {
    const innings = createInnings(
      match.battingFirstId,
      match.bowlingFirstId,
      match.oversLimit
    );
    innings.strikerId = strikerId;
    innings.nonStrikerId = nonStrikerId;
    innings.currentBowlerId = bowlerId;

    const battingTeam = getBattingTeam(match, innings);
    const bowlingTeam = getBowlingTeam(match, innings);

    ensureBattingStat(innings, strikerId, getPlayerFromTeamSnapshot(battingTeam, strikerId).name);
    ensureBattingStat(innings, nonStrikerId, getPlayerFromTeamSnapshot(battingTeam, nonStrikerId).name);
    ensureBowlingStat(innings, bowlerId, getPlayerFromTeamSnapshot(bowlingTeam, bowlerId).name);

    match.innings.push(innings);
    match.currentInningsIndex = 0;
    match.status = "live";
    return match;
  }

  /**
   * Starts the second innings, carrying over the target from innings 1.
   */
  function startSecondInnings(match, strikerId, nonStrikerId, bowlerId) {
    const first = match.innings[0];
    const target = first.totalRuns + 1;

    const innings = createInnings(
      match.bowlingFirstId, // team that bowled first now bats
      match.battingFirstId,
      match.oversLimit
    );
    innings.target = target;
    innings.strikerId = strikerId;
    innings.nonStrikerId = nonStrikerId;
    innings.currentBowlerId = bowlerId;

    const battingTeam = getBattingTeam(match, innings);
    const bowlingTeam = getBowlingTeam(match, innings);

    ensureBattingStat(innings, strikerId, getPlayerFromTeamSnapshot(battingTeam, strikerId).name);
    ensureBattingStat(innings, nonStrikerId, getPlayerFromTeamSnapshot(battingTeam, nonStrikerId).name);
    ensureBowlingStat(innings, bowlerId, getPlayerFromTeamSnapshot(bowlingTeam, bowlerId).name);

    match.innings.push(innings);
    match.currentInningsIndex = 1;
    return match;
  }

  return {
    createInnings,
    ensureBattingStat,
    ensureBowlingStat,
    oversDisplay,
    getPlayerFromTeamSnapshot,
    getCurrentInnings,
    getBattingTeam,
    getBowlingTeam,
    buildMatch,
    startFirstInnings,
    startSecondInnings,
  };
})();
