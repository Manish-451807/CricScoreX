/* ===========================================================
   teams.js
   Team + player creation, validation, and rendering helpers.
   Used by create-team.html and teams.html
   =========================================================== */

const TeamManager = (function () {
  const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];

  function emptyPlayer() {
    return {
      id: StorageManager.generateId("plyr"),
      name: "",
      jerseyNumber: "",
      role: "Batsman",
      isCaptain: false,
      isViceCaptain: false,
      isWicketKeeper: false,
    };
  }

  function validateMobile(num) {
    return /^[6-9]\d{9}$/.test(String(num).trim());
  }

  /**
   * Validates a full team object (with 11 players).
   * Returns { valid: boolean, errors: string[] }
   */
  function validateTeam(team) {
    const errors = [];

    if (!team.name || !team.name.trim()) {
      errors.push("Team name is required.");
    }
    if (!team.captain || !team.captain.trim()) {
      errors.push("Captain name is required.");
    }
    if (!team.contactName || !team.contactName.trim()) {
      errors.push("Contact person name is required.");
    }
    if (!validateMobile(team.phone)) {
      errors.push("A valid 10-digit mobile number is required.");
    }

    if (!Array.isArray(team.players) || team.players.length !== 11) {
      errors.push("Exactly 11 players are required.");
    } else {
      const jerseyNumbers = [];
      let captainCount = 0;
      let viceCaptainCount = 0;
      let wkCount = 0;

      team.players.forEach((p, i) => {
        if (!p.name || !p.name.trim()) {
          errors.push(`Player ${i + 1}: name is required.`);
        }
        if (p.jerseyNumber === "" || p.jerseyNumber === null || p.jerseyNumber === undefined) {
          errors.push(`Player ${i + 1}: jersey number is required.`);
        } else {
          jerseyNumbers.push(String(p.jerseyNumber));
        }
        if (p.isCaptain) captainCount++;
        if (p.isViceCaptain) viceCaptainCount++;
        if (p.isWicketKeeper) wkCount++;
      });

      const dupJerseys = jerseyNumbers.filter(
        (v, i, arr) => arr.indexOf(v) !== i
      );
      if (dupJerseys.length > 0) {
        errors.push("Jersey numbers must be unique (duplicate found: " + [...new Set(dupJerseys)].join(", ") + ").");
      }

      if (captainCount !== 1) {
        errors.push("Exactly one player must be marked as Captain.");
      }
      if (viceCaptainCount !== 1) {
        errors.push("Exactly one player must be marked as Vice Captain.");
      }
      if (wkCount !== 1) {
        errors.push("Exactly one player must be marked as Wicket-Keeper.");
      }
    }

    return { valid: errors.length === 0, errors };
  }

  function buildTeamFromForm(formData, players) {
    return {
      id: formData.id || StorageManager.generateId("team"),
      name: formData.name.trim(),
      captain: formData.captain.trim(),
      viceCaptain: formData.viceCaptain.trim(),
      contactName: formData.contactName.trim(),
      phone: formData.phone.trim(),
      email: (formData.email || "").trim(),
      city: (formData.city || "").trim(),
      logo: formData.logo || "",
      description: (formData.description || "").trim(),
      players: players,
      createdAt: formData.createdAt || new Date().toISOString(),
    };
  }

  function deleteTeam(teamId) {
    // Prevent deleting a team involved in a live match
    const liveMatches = StorageManager.getLiveMatches();
    const inUse = liveMatches.some(
      (m) => m.team1.id === teamId || m.team2.id === teamId
    );
    if (inUse) {
      return { success: false, message: "Cannot delete a team that is part of a live match." };
    }
    StorageManager.deleteTeam(teamId);
    return { success: true };
  }

  return {
    ROLES,
    emptyPlayer,
    validateMobile,
    validateTeam,
    buildTeamFromForm,
    deleteTeam,
  };
})();
