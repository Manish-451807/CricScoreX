/* ===========================================================
   storage.js
   Handles ALL localStorage read/write for the app.

   Data is stored separately for each logged-in user.
   =========================================================== */

const StorageManager = (function () {

  const TEAMS_KEY = "cst_teams";
  const MATCHES_KEY = "cst_matches";

  // ---------------------------------------------------------
  // Get current logged-in user
  // ---------------------------------------------------------

  function getCurrentUser() {

    try {

      return JSON.parse(
        localStorage.getItem("cst_current_user")
      );

    } catch (e) {

      console.error("User read error:", e);

      return null;
    }
  }


  // ---------------------------------------------------------
  // Get current user's ID
  // ---------------------------------------------------------

  function getUserId() {

    const user = getCurrentUser();

    return user ? user.id : null;
  }


  // ---------------------------------------------------------
  // Create user-specific storage key
  // ---------------------------------------------------------

  function getUserKey(baseKey) {

    const userId = getUserId();

    if (!userId) {
      return null;
    }

    return `${baseKey}_${userId}`;
  }


  // ---------------------------------------------------------
  // Read data
  // ---------------------------------------------------------

  function _read(key) {

    try {

      const raw = localStorage.getItem(key);

      return raw ? JSON.parse(raw) : [];

    } catch (e) {

      console.error(
        "Storage read error for",
        key,
        e
      );

      return [];
    }
  }


  // ---------------------------------------------------------
  // Write data
  // ---------------------------------------------------------

  function _write(key, value) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (e) {

      console.error(
        "Storage write error for",
        key,
        e
      );

      return false;
    }
  }


  // ---------------------------------------------------------
  // Generate unique ID
  // ---------------------------------------------------------

  function generateId(prefix) {

    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .substr(2, 6)
    );
  }


  /* =========================================================
     TEAMS
  ========================================================= */


  function getTeams() {

    const key = getUserKey(TEAMS_KEY);

    if (!key) {
      return [];
    }

    return _read(key);
  }


  function getTeamById(id) {

    return (
      getTeams().find(
        (team) => team.id === id
      ) || null
    );
  }


  function saveTeam(team) {

    const key = getUserKey(TEAMS_KEY);

    if (!key) {

      console.error(
        "Cannot save team: user is not logged in."
      );

      return false;
    }

    const teams = getTeams();

    const idx = teams.findIndex(
      (t) => t.id === team.id
    );


    if (idx >= 0) {

      teams[idx] = team;

    } else {

      teams.push(team);
    }


    return _write(key, teams);
  }


  function deleteTeam(id) {

    const key = getUserKey(TEAMS_KEY);

    if (!key) {
      return false;
    }

    const teams = getTeams().filter(
      (team) => team.id !== id
    );

    return _write(key, teams);
  }


  /* =========================================================
     MATCHES
  ========================================================= */


  function getMatches() {

    const key = getUserKey(MATCHES_KEY);

    if (!key) {
      return [];
    }

    return _read(key);
  }


  function getMatchById(id) {

    return (
      getMatches().find(
        (match) => match.id === id
      ) || null
    );
  }


  function saveMatch(match) {

    const key = getUserKey(MATCHES_KEY);

    if (!key) {

      console.error(
        "Cannot save match: user is not logged in."
      );

      return false;
    }

    const matches = getMatches();

    const idx = matches.findIndex(
      (m) => m.id === match.id
    );


    if (idx >= 0) {

      matches[idx] = match;

    } else {

      matches.push(match);
    }


    return _write(key, matches);
  }


  function deleteMatch(id) {

    const key = getUserKey(MATCHES_KEY);

    if (!key) {
      return false;
    }

    const matches = getMatches().filter(
      (match) => match.id !== id
    );

    return _write(key, matches);
  }


  function getLiveMatches() {

    return getMatches().filter(
      (match) => match.status === "live"
    );
  }


  function getCompletedMatches() {

    return getMatches().filter(
      (match) => match.status === "completed"
    );
  }


  /* =========================================================
     PUBLIC API
  ========================================================= */


  return {

    generateId,

    getCurrentUser,

    getTeams,
    getTeamById,
    saveTeam,
    deleteTeam,

    getMatches,
    getMatchById,
    saveMatch,
    deleteMatch,

    getLiveMatches,
    getCompletedMatches
  };

})();