/* ===========================================================
   app.js
   Shared bootstrapping: mobile nav toggle + dashboard stats.
   Loaded on every page (index.html has extra dashboard logic).
   =========================================================== */

document.addEventListener("DOMContentLoaded", function () {
  wireMobileNav();
  highlightActiveNavLink();

  if (document.body.dataset.page === "dashboard") {
    renderDashboardStats();
    renderDashboardLiveMatches();
  }
});

function wireMobileNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", function () {
    menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", menu.classList.contains("open") ? "true" : "false");
  });
  menu.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => menu.classList.remove("open"));
  });
}

function highlightActiveNavLink() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
    }
  });
}

function renderDashboardStats() {
  const teams = StorageManager.getTeams();
  const matches = StorageManager.getMatches();
  const live = matches.filter((m) => m.status === "live");
  const completed = matches.filter((m) => m.status === "completed");

  setText("statTotalTeams", teams.length);
  setText("statTotalMatches", matches.length);
  setText("statCompletedMatches", completed.length);
  setText("statLiveMatches", live.length);
}

function renderDashboardLiveMatches() {
  const container = document.getElementById("dashboardLiveList");
  if (!container) return;
  const live = StorageManager.getLiveMatches();

  if (live.length === 0) {
    container.innerHTML = '<p class="empty-state">No live matches right now.</p>';
    return;
  }

  container.innerHTML = live
    .map((m) => {
      const innings = m.innings[m.currentInningsIndex];
      const battingTeam =
        innings && innings.battingTeamId === m.team1.id ? m.team1 : m.team2;
      const scoreText = innings
        ? innings.totalRuns + "/" + innings.wickets + "  (" + MatchManager.oversDisplay(innings.legalBalls) + " ov)"
        : "Not started";
      return `
      <div class="live-match-card">
        <span class="live-dot">&#128308; LIVE</span>
        <div class="live-match-title">${m.team1.name} vs ${m.team2.name}</div>
        <div class="live-match-score">${battingTeam ? battingTeam.name + ": " : ""}${scoreText}</div>
        <a class="btn btn-primary" href="live-match.html?id=${m.id}">Open Match</a>
      </div>`;
    })
    .join("");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
