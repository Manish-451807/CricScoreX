/* ===========================================================
   history.js
   Match History list rendering + full scorecard rendering.
   Used by match-history.html and the post-match summary on
   live-match.html
   =========================================================== */

const HistoryManager = (function () {
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderHistoryList(containerEl) {
    const matches = StorageManager.getCompletedMatches().sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    if (matches.length === 0) {
      containerEl.innerHTML =
        '<p class="empty-state">No completed matches yet. Finish a live match to see it here.</p>';
      return;
    }

    containerEl.innerHTML = matches
      .map((m) => {
        const inn1 = m.innings[0];
        const inn2 = m.innings[1];
        return `
        <div class="history-card" data-id="${m.id}">
          <div class="history-card-header">
            <span class="history-date">${formatDate(m.date)}</span>
            <span class="history-venue">${m.venue || ""}</span>
          </div>
          <div class="history-teams">
            <div class="history-team-row">
              <span class="team-name">${m.team1.name}</span>
              <span class="team-score">${inn1 ? inn1.totalRuns + "/" + inn1.wickets + " (" + MatchManager.oversDisplay(inn1.legalBalls) + ")" : "-"}</span>
            </div>
            <div class="history-team-row">
              <span class="team-name">${m.team2.name}</span>
              <span class="team-score">${inn2 ? inn2.totalRuns + "/" + inn2.wickets + " (" + MatchManager.oversDisplay(inn2.legalBalls) + ")" : "-"}</span>
            </div>
          </div>
          <div class="history-result">${m.resultText || ""}</div>
          <button class="btn btn-secondary btn-view-scorecard" data-id="${m.id}">View Full Scorecard</button>
        </div>`;
      })
      .join("");
  }

  function battingRowsHtml(innings, team) {
    return team.players
      .map((p) => {
        const stat = innings.battingStats[p.id];
        if (!stat) return "";
        const sr = ScoringEngine.strikeRate(stat).toFixed(2);
        return `
        <tr>
          <td>${stat.name}${stat.out ? "" : " *"}</td>
          <td>${stat.out ? stat.howOut : "not out"}</td>
          <td>${stat.runs}</td>
          <td>${stat.balls}</td>
          <td>${stat.fours}</td>
          <td>${stat.sixes}</td>
          <td>${sr}</td>
        </tr>`;
      })
      .join("");
  }

  function bowlingRowsHtml(innings, team) {
    return team.players
      .map((p) => {
        const stat = innings.bowlingStats[p.id];
        if (!stat) return "";
        const overs = MatchManager.oversDisplay(stat.ballsBowled);
        const econ = ScoringEngine.economyRate(stat).toFixed(2);
        return `
        <tr>
          <td>${stat.name}</td>
          <td>${overs}</td>
          <td>${stat.maidens}</td>
          <td>${stat.runsConceded}</td>
          <td>${stat.wickets}</td>
          <td>${econ}</td>
        </tr>`;
      })
      .join("");
  }

  function extrasText(innings) {
    const e = innings.extras;
    const total = e.wide + e.noball + e.bye + e.legbye;
    return `${total} (W ${e.wide}, NB ${e.noball}, B ${e.bye}, LB ${e.legbye})`;
  }

  function fallOfWicketsText(innings) {
    if (!innings.fallOfWickets.length) return "None";
    return innings.fallOfWickets
      .map(
        (f) =>
          `${f.wicketNumber}-${f.score} (${f.batsmanName}, ${f.overStr})`
      )
      .join(", ");
  }

  function renderInningsScorecard(match, innings, innTeam, oppTeam) {
    return `
      <div class="scorecard-innings">
        <h3>${innTeam.name} — ${innings.totalRuns}/${innings.wickets} (${MatchManager.oversDisplay(innings.legalBalls)} overs)</h3>
        <h4>Batting</h4>
        <table class="scorecard-table">
          <thead><tr><th>Batsman</th><th>How Out</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
          <tbody>${battingRowsHtml(innings, innTeam)}</tbody>
        </table>
        <h4>Bowling</h4>
        <table class="scorecard-table">
          <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
          <tbody>${bowlingRowsHtml(innings, oppTeam)}</tbody>
        </table>
        <p><strong>Extras:</strong> ${extrasText(innings)}</p>
        <p><strong>Fall of Wickets:</strong> ${fallOfWicketsText(innings)}</p>
      </div>`;
  }

  function renderFullScorecard(match, containerEl) {
    let html = `<div class="scorecard-result">${match.resultText || ""}</div>`;

    match.innings.forEach((innings) => {
      const battingTeam =
        innings.battingTeamId === match.team1.id ? match.team1 : match.team2;
      const bowlingTeam =
        innings.bowlingTeamId === match.team1.id ? match.team1 : match.team2;
      html += renderInningsScorecard(match, innings, battingTeam, bowlingTeam);
    });

    containerEl.innerHTML = html;
  }

  return {
    formatDate,
    renderHistoryList,
    renderFullScorecard,
    extrasText,
    fallOfWicketsText,
  };
})();
