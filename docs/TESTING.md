# Testing Guide

## Functional Tests

| Test | Expected Result |
|---|---|
| Create team with fewer than 11 players | Validation error |
| Create team with 11 players | Team saved |
| Create team with 15 players | Team saved |
| Select fewer than 11 Playing XI players | Match setup blocked |
| Select 11 Playing XI players | Match setup accepted |
| Add 4 runs | Score increases by 4 and legal ball advances |
| Add Wide | Score/extras increase and legal ball does not advance |
| Add No Ball | Score/extras increase and legal ball does not advance |
| Add Bye | Extras increase and legal ball advances |
| Add Leg Bye | Extras increase and legal ball advances |
| Add Wicket | Wicket count increases and replacement flow opens |
| Undo | Previous scoring state is restored |
| Finish innings | Innings marked complete |
| Complete match | Match appears in history |
| Open scorecard | Full scorecard is rendered |
| Open Player Stats | Aggregated statistics are shown |

## Browser Tests

Test with current versions of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

## Responsive Tests

Check at:

- Desktop width
- Tablet width
- Mobile width

## Regression Test

After modifying scoring logic, always run a complete match through both innings and verify that the final score, wickets, overs, extras and player statistics remain consistent.
