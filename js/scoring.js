/* ===========================================================
   scoring.js
   Ball-by-ball scoring engine for Cricket Score Tally.

   v1 scoring model:
   - Normal runs and byes/leg-byes are legal deliveries.
   - Wides and no-balls are illegal deliveries.
   - A no-ball does NOT count as a batsman's ball faced.
   - Run-out completed runs are kept as team runs, but are not
     assigned to a batsman because this UI does not capture the
     exact shot/crossing details needed to do that reliably.
   - Retired Hurt is NOT a wicket and is NOT added to FOW.
   =========================================================== */

const ScoringEngine = (function () {
  const MAX_UNDO_HISTORY = 40;

  /* ---------- Snapshot / Undo ---------- */

  function cloneInningsForHistory(innings) {
    const copy = JSON.parse(JSON.stringify(innings));
    delete copy.history;
    return copy;
  }

  function pushHistory(innings) {
    if (!innings.history) innings.history = [];
    innings.history.push(cloneInningsForHistory(innings));
    if (innings.history.length > MAX_UNDO_HISTORY) {
      innings.history.shift();
    }
  }

  function undoLastBall(match) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || !innings.history || innings.history.length === 0) {
      return { success: false, message: "Nothing to undo." };
    }

    const previous = innings.history.pop();
    previous.history = innings.history;
    match.innings[match.currentInningsIndex] = previous;
    return { success: true };
  }

  /* ---------- Helpers ---------- */

  function ballDisplay(label, cssClass) {
    return { label, cssClass };
  }

  function validNonNegativeInt(value) {
    return Number.isInteger(value) && value >= 0;
  }

  function maybeSwapStrike(innings, runs) {
    if (runs % 2 === 1) {
      const tmp = innings.strikerId;
      innings.strikerId = innings.nonStrikerId;
      innings.nonStrikerId = tmp;
    }
  }

  function swapEndsForNewOver(innings) {
    const tmp = innings.strikerId;
    innings.strikerId = innings.nonStrikerId;
    innings.nonStrikerId = tmp;
  }

  function resetOverCounter(innings, bowlerId) {
    const stat = innings.bowlingStats[bowlerId];
    if (stat) stat.thisOverConceded = 0;
  }

  function currentBowlerStat(innings) {
    return innings.bowlingStats[innings.currentBowlerId];
  }

  function postDeliveryChecks(match, innings, wicketPosition) {
    let overCompleted = false;

    if (
      innings.legalBalls > 0 &&
      innings.legalBalls % 6 === 0 &&
      !innings.completed
    ) {
      const bowlerStat = currentBowlerStat(innings);

      if (bowlerStat && (bowlerStat.thisOverConceded || 0) === 0) {
        bowlerStat.maidens += 1;
      }

      innings.previousBowlerId = innings.currentBowlerId;
      innings.overJustCompleted = true;
      innings.overHistory = innings.overHistory || [];
      innings.overHistory.push({
        overNumber: innings.legalBalls / 6,
        bowlerId: innings.currentBowlerId,
        bowlerName: bowlerStat ? bowlerStat.name : "",
        balls: innings.currentOverBalls.slice(),
      });
      innings.currentOverBalls = [];

      // A normal delivery swaps ends at the end of an over.
      // If a wicket occurred on the sixth ball, the incoming batsman
      // must take the END left vacant after this swap. Therefore the
      // pending wicket position is flipped below.
      swapEndsForNewOver(innings);
      innings.awaitingNewBowler = true;
      overCompleted = true;
    }

    checkInningsCompletion(match, innings);

    if (
      overCompleted &&
      innings.awaitingNewBatsman &&
      wicketPosition
    ) {
      innings.awaitingNewBatsman.position =
        wicketPosition === "striker" ? "nonstriker" : "striker";
    }
  }

  function checkInningsCompletion(match, innings) {
    if (innings.completed) return;

    if (innings.wickets >= 10) {
      completeInnings(match, innings, "All out");
      return;
    }

    if (innings.legalBalls >= innings.oversLimit * 6) {
      completeInnings(match, innings, "Overs completed");
      return;
    }

    if (
      match.currentInningsIndex === 1 &&
      innings.target !== null &&
      innings.totalRuns >= innings.target
    ) {
      completeInnings(match, innings, "Target reached");
    }
  }

  function completeInnings(match, innings, reason) {
    innings.completed = true;
    innings.completionReason = reason;
    innings.awaitingNewBatsman = null;
    innings.awaitingNewBowler = false;

    if (match.currentInningsIndex === 0) {
      match.status = "live";
    } else {
      determineResult(match);
      match.status = "completed";
    }
  }

  function determineResult(match) {
    const first = match.innings[0];
    const second = match.innings[1];
    if (!first || !second) return;

    const firstTeam =
      first.battingTeamId === match.team1.id ? match.team1 : match.team2;
    const secondTeam =
      second.battingTeamId === match.team1.id ? match.team1 : match.team2;

    if (second.totalRuns > first.totalRuns) {
      const wicketsInHand = Math.max(0, 10 - second.wickets);
      match.winnerId = secondTeam.id;
      match.resultText =
        secondTeam.name +
        " won by " +
        wicketsInHand +
        " wicket" +
        (wicketsInHand === 1 ? "" : "s");
    } else if (second.totalRuns < first.totalRuns) {
      const margin = first.totalRuns - second.totalRuns;
      match.winnerId = firstTeam.id;
      match.resultText =
        firstTeam.name +
        " won by " +
        margin +
        " run" +
        (margin === 1 ? "" : "s");
    } else {
      match.winnerId = null;
      match.resultText = "Match Tied";
    }
  }

  /* ---------- Normal Runs ---------- */

  function playRuns(match, runs) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || innings.completed || innings.awaitingNewBatsman || innings.awaitingNewBowler) return;
    if (!validNonNegativeInt(runs) || runs > 6) return;

    const striker = innings.battingStats[innings.strikerId];
    const bowler = currentBowlerStat(innings);
    if (!striker || !bowler) return;

    pushHistory(innings);
    innings.overJustCompleted = false;

    striker.runs += runs;
    striker.balls += 1;
    if (runs === 4) striker.fours += 1;
    if (runs === 6) striker.sixes += 1;

    bowler.ballsBowled += 1;
    bowler.runsConceded += runs;
    bowler.thisOverConceded = (bowler.thisOverConceded || 0) + runs;

    innings.totalRuns += runs;
    innings.legalBalls += 1;

    innings.currentOverBalls.push(
      runs === 0
        ? ballDisplay("0", "ball-dot")
        : ballDisplay(
            String(runs),
            runs === 4 ? "ball-four" : runs === 6 ? "ball-six" : "ball-run"
          )
    );

    maybeSwapStrike(innings, runs);
    postDeliveryChecks(match, innings);
  }

  /* ---------- Wide ---------- */

  function playWide(match, extraRuns) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || innings.completed || innings.awaitingNewBatsman || innings.awaitingNewBowler) return;
    if (!validNonNegativeInt(extraRuns) || extraRuns > 4) return;

    const bowler = currentBowlerStat(innings);
    if (!bowler) return;

    pushHistory(innings);
    innings.overJustCompleted = false;

    const total = 1 + extraRuns;
    innings.totalRuns += total;
    innings.extras.wide += total;
    bowler.runsConceded += total;
    bowler.thisOverConceded = (bowler.thisOverConceded || 0) + total;

    innings.currentOverBalls.push(
      ballDisplay(extraRuns > 0 ? "Wd+" + extraRuns : "Wd", "ball-wide")
    );

    // For the simplified scorer, odd additional runs rotate strike.
    maybeSwapStrike(innings, extraRuns);
    checkInningsCompletion(match, innings);
  }

  /* ---------- No Ball ---------- */

  function playNoBall(match, batRuns) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || innings.completed || innings.awaitingNewBatsman || innings.awaitingNewBowler) return;
    if (!validNonNegativeInt(batRuns) || batRuns > 6) return;

    const striker = innings.battingStats[innings.strikerId];
    const bowler = currentBowlerStat(innings);
    if (!striker || !bowler) return;

    pushHistory(innings);
    innings.overJustCompleted = false;

    // A no-ball is NOT a legal delivery, so it does not count as a
    // batsman's ball faced. Runs off the bat still belong to the striker.
    striker.runs += batRuns;
    if (batRuns === 4) striker.fours += 1;
    if (batRuns === 6) striker.sixes += 1;

    const total = 1 + batRuns;
    innings.totalRuns += total;
    innings.extras.noball += 1;
    bowler.runsConceded += total;
    bowler.thisOverConceded = (bowler.thisOverConceded || 0) + total;

    innings.currentOverBalls.push(
      ballDisplay(batRuns > 0 ? "NB+" + batRuns : "NB", "ball-noball")
    );

    maybeSwapStrike(innings, batRuns);
    checkInningsCompletion(match, innings);
  }

  /* ---------- Bye / Leg Bye ---------- */

  function playByeOrLegBye(match, runs, isLegBye) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || innings.completed || innings.awaitingNewBatsman || innings.awaitingNewBowler) return;
    if (!validNonNegativeInt(runs) || runs < 1 || runs > 4) return;

    const striker = innings.battingStats[innings.strikerId];
    const bowler = currentBowlerStat(innings);
    if (!striker || !bowler) return;

    pushHistory(innings);
    innings.overJustCompleted = false;

    striker.balls += 1;
    innings.totalRuns += runs;
    if (isLegBye) innings.extras.legbye += runs;
    else innings.extras.bye += runs;

    // Legal ball, but byes/leg-byes are not bowler runs.
    bowler.ballsBowled += 1;
    innings.legalBalls += 1;

    innings.currentOverBalls.push(
      ballDisplay(
        (isLegBye ? "Lb" : "B") + runs,
        isLegBye ? "ball-legbye" : "ball-bye"
      )
    );

    maybeSwapStrike(innings, runs);
    postDeliveryChecks(match, innings);
  }

  /* ---------- Wickets ---------- */

  function playWicket(match, wicketInfo) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || innings.completed || innings.awaitingNewBatsman || innings.awaitingNewBowler) return;

    const wicketType = wicketInfo && wicketInfo.wicketType;
    const dismissedWho = wicketInfo && wicketInfo.dismissedWho;
    const dismissedId =
      dismissedWho === "striker" ? innings.strikerId : innings.nonStrikerId;
    const dismissedStat = innings.battingStats[dismissedId];
    const bowler = currentBowlerStat(innings);

    if (!dismissedStat || !bowler) return;
    if (!["striker", "nonstriker"].includes(dismissedWho)) return;

    pushHistory(innings);
    innings.overJustCompleted = false;

    let isLegalBall = true;
    let ballLabel = "W";
    const deliveryType = wicketInfo.deliveryType || "normal";
    const runs = validNonNegativeInt(wicketInfo.runsCompleted)
      ? wicketInfo.runsCompleted
      : 0;

    /* Retired Hurt: no wicket, no legal ball, no FOW. */
    if (wicketType === "RetiredHurt") {
      dismissedStat.retiredHurt = true;
      dismissedStat.howOut = "retired hurt";
      ballLabel = "RH";

      if (dismissedWho === "striker") innings.strikerId = null;
      else innings.nonStrikerId = null;

      innings.awaitingNewBatsman = { position: dismissedWho, retired: true };
      innings.currentOverBalls.push(ballDisplay(ballLabel, "ball-wicket"));
      return;
    }

    if (wicketType === "RunOut") {
      if (!["normal", "wide", "noball"].includes(deliveryType)) return;

      if (deliveryType === "wide") {
        isLegalBall = false;
        const total = 1 + runs;
        innings.totalRuns += total;
        innings.extras.wide += total;
        bowler.runsConceded += total;
        bowler.thisOverConceded = (bowler.thisOverConceded || 0) + total;
        ballLabel = "Wd+RO";
      } else if (deliveryType === "noball") {
        isLegalBall = false;
        const total = 1 + runs;
        innings.totalRuns += total;
        innings.extras.noball += 1;
        bowler.runsConceded += total;
        bowler.thisOverConceded = (bowler.thisOverConceded || 0) + total;
        ballLabel = "NB+RO";
      } else {
        innings.totalRuns += runs;
        bowler.runsConceded += runs;
        bowler.thisOverConceded = (bowler.thisOverConceded || 0) + runs;
        ballLabel = "RO";
      }

      maybeSwapStrike(innings, runs);
    } else {
      // Bowled / Caught / LBW / Stumped / Hit Wicket.
      bowler.wickets += 1;
      ballLabel = "W";
    }

    if (isLegalBall) {
      bowler.ballsBowled += 1;
      innings.legalBalls += 1;
      dismissedStat.balls += 1;
    }

    dismissedStat.out = true;
    dismissedStat.howOut = describeWicket(wicketInfo, bowler.name);
    innings.wickets += 1;

    innings.fallOfWickets.push({
      score: innings.totalRuns,
      wicketNumber: innings.wickets,
      batsmanName: dismissedStat.name,
      overStr: MatchManager.oversDisplay(innings.legalBalls),
    });

    innings.currentOverBalls.push(ballDisplay(ballLabel, "ball-wicket"));

    // If this was the final wicket, no replacement is required.
    if (innings.wickets < 10) {
      innings.awaitingNewBatsman = { position: dismissedWho };
    }

    postDeliveryChecks(match, innings, dismissedWho);
  }

  function describeWicket(w, bowlerName) {
    switch (w.wicketType) {
      case "Bowled":
        return "b. " + (bowlerName || "bowler");
      case "Caught":
        return "c. " + (w.fielder || "fielder") + " b. " + (bowlerName || "bowler");
      case "LBW":
        return "lbw b. " + (bowlerName || "bowler");
      case "RunOut":
        return "run out" + (w.fielder ? " (" + w.fielder + ")" : "");
      case "Stumped":
        return "st. " + (w.fielder || "keeper") + " b. " + (bowlerName || "bowler");
      case "HitWicket":
        return "hit wicket b. " + (bowlerName || "bowler");
      default:
        return w.wicketType || "out";
    }
  }

  /* ---------- New Batsman ---------- */

  function sendInNewBatsman(match, newBatsmanId, newBatsmanName) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || !innings.awaitingNewBatsman) return;

    const position = innings.awaitingNewBatsman.position;
    if (!newBatsmanId || newBatsmanId === innings.strikerId || newBatsmanId === innings.nonStrikerId) {
      return;
    }

    const existing = innings.battingStats[newBatsmanId];
    if (existing && (existing.out || existing.retiredHurt)) {
      return;
    }

    MatchManager.ensureBattingStat(innings, newBatsmanId, newBatsmanName);

    if (position === "striker") innings.strikerId = newBatsmanId;
    else innings.nonStrikerId = newBatsmanId;

    innings.awaitingNewBatsman = null;
  }

  /* ---------- New Bowler ---------- */

  function selectNewBowler(match, bowlerId, bowlerName) {
    const innings = MatchManager.getCurrentInnings(match);
    if (!innings || innings.completed) return;

    // Only allow a new bowler when an over has actually completed.
    if (!innings.awaitingNewBowler) return;

    // A bowler cannot bowl consecutive overs.
    if (innings.previousBowlerId && bowlerId === innings.previousBowlerId) return;

    MatchManager.ensureBowlingStat(innings, bowlerId, bowlerName);
    innings.currentBowlerId = bowlerId;
    innings.awaitingNewBowler = false;
    innings.overJustCompleted = false;
    resetOverCounter(innings, bowlerId);
  }

  /* ---------- Statistics ---------- */

  function currentRunRate(innings) {
    if (!innings || innings.legalBalls === 0) return 0;
    return innings.totalRuns / (innings.legalBalls / 6);
  }

  function requiredRunRate(innings) {
    if (!innings || innings.target === null || innings.target === undefined) return 0;

    const ballsRemaining = innings.oversLimit * 6 - innings.legalBalls;
    if (ballsRemaining <= 0) return 0;

    const runsNeeded = Math.max(innings.target - innings.totalRuns, 0);
    return runsNeeded / (ballsRemaining / 6);
  }

  function strikeRate(battingStat) {
    if (!battingStat || battingStat.balls === 0) return 0;
    return (battingStat.runs / battingStat.balls) * 100;
  }

  function economyRate(bowlingStat) {
    if (!bowlingStat || bowlingStat.ballsBowled === 0) return 0;
    return bowlingStat.runsConceded / (bowlingStat.ballsBowled / 6);
  }

  function currentPartnership(innings) {
    if (!innings) return { runs: 0 };
    const lastFOW = innings.fallOfWickets[innings.fallOfWickets.length - 1];
    const runsAtLastWicket = lastFOW ? lastFOW.score : 0;
    return { runs: Math.max(0, innings.totalRuns - runsAtLastWicket) };
  }

  return {
    playRuns,
    playWide,
    playNoBall,
    playByeOrLegBye,
    playWicket,
    sendInNewBatsman,
    selectNewBowler,
    undoLastBall,
    currentRunRate,
    requiredRunRate,
    strikeRate,
    economyRate,
    currentPartnership,
    determineResult,
  };
})();
