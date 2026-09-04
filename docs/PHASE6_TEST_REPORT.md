# Phase 6 — Final Validation Report

## Automated checks

- JavaScript syntax validation: PASS (`node --check` on all JS files)
- Required HTML pages present: PASS
- CSS file present: PASS
- All seven HTML pages include the Player Stats navigation link: PASS
- Create Match overs input uses whole-number validation with minimum 1: PASS
- Project documentation files present: PASS

## Manual browser test checklist

### Team management
- [ ] Create a team with 11 players.
- [ ] Create a team with 12–15 players.
- [ ] Edit a team without losing players.
- [ ] Delete a test team.

### Match setup
- [ ] Create a 1-over match.
- [ ] Create a 7-over match.
- [ ] Create a 20-over match.
- [ ] Try 0, negative, and decimal overs; validation should reject them.
- [ ] Select exactly 11 players for each Playing XI.
- [ ] Verify opener and bowler dropdowns contain only XI players.

### Live scoring
- [ ] Score 0–6 runs.
- [ ] Score wides and no-balls.
- [ ] Score byes and leg-byes.
- [ ] Record a wicket and select a replacement batsman.
- [ ] Complete an over and select a different bowler.
- [ ] Use Undo and verify the score and statistics revert correctly.
- [ ] Finish both innings and verify the result.

### Statistics and history
- [ ] Open Match History and view a completed scorecard.
- [ ] Open Player Stats and verify aggregated batting/bowling numbers.
- [ ] Search for a player and open the player profile.
- [ ] Print a scorecard.

### Navigation
- [ ] Dashboard → Teams → Create Match → Live Matches → Match History → Player Stats.
- [ ] Verify Player Stats remains visible on every page.
- [ ] Test the mobile navigation menu.

## Result

Automated structural checks passed. Manual browser testing should be completed before publishing the project publicly.
