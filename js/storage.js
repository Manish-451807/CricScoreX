/* ===========================================================
   storage.js
   Handles ALL localStorage read/write for the app.
   Data model kept in three top-level keys:
     - "cst_teams"      -> array of Team objects
     - "cst_matches"    -> array of Match objects (live + completed)
   =========================================================== */

const StorageManager = (function () {
  const TEAMS_KEY = "cst_teams";
  const MATCHES_KEY = "cst_matches";

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Storage read error for", key, e);
      return [];
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage write error for", key, e);
      return false;
    }
  }

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substr(2, 6)
    );
  }

  /* ---------------- TEAMS ---------------- */

  function getTeams() {
    return _read(TEAMS_KEY);
  }

  function getTeamById(id) {
    return getTeams().find((t) => t.id === id) || null;
  }

  function saveTeam(team) {
    const teams = getTeams();
    const idx = teams.findIndex((t) => t.id === team.id);
    if (idx >= 0) {
      teams[idx] = team;
    } else {
      teams.push(team);
    }
    return _write(TEAMS_KEY, teams);
  }

  function deleteTeam(id) {
    const teams = getTeams().filter((t) => t.id !== id);
    return _write(TEAMS_KEY, teams);
  }

  /* ---------------- MATCHES ---------------- */

  function getMatches() {
    return _read(MATCHES_KEY);
  }

  function getMatchById(id) {
    return getMatches().find((m) => m.id === id) || null;
  }

  function saveMatch(match) {
    const matches = getMatches();
    const idx = matches.findIndex((m) => m.id === match.id);
    if (idx >= 0) {
      matches[idx] = match;
    } else {
      matches.push(match);
    }
    return _write(MATCHES_KEY, matches);
  }

  function deleteMatch(id) {
    const matches = getMatches().filter((m) => m.id !== id);
    return _write(MATCHES_KEY, matches);
  }

  function getLiveMatches() {
    return getMatches().filter((m) => m.status === "live");
  }

  function getCompletedMatches() {
    return getMatches().filter((m) => m.status === "completed");
  }

  return {
    generateId,
    getTeams,
    getTeamById,
    saveTeam,
    deleteTeam,
    getMatches,
    getMatchById,
    saveMatch,
    deleteMatch,
    getLiveMatches,
    getCompletedMatches,
  };
})();
