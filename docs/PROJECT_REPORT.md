# Project Report — Cricket Scorer

## 1. Problem Statement

Manual cricket scoring can become difficult when a scorer has to track runs, extras, wickets, batsmen, bowlers, overs and match results simultaneously. This project provides a simple browser-based scoring system for local cricket matches.

## 2. Objective

The objective is to provide an easy-to-use application that records cricket matches ball by ball and automatically calculates important match and player statistics.

## 3. Main Modules

### Team Module
Stores registered squads and player information.

### Match Setup Module
Creates matches, handles toss information and selects the Playing XI.

### Scoring Engine
Processes legal and illegal deliveries, runs, extras, wickets, strike rotation, overs and innings completion.

### Match History Module
Stores and displays completed matches with scorecards.

### Statistics Module
Aggregates player performance across completed matches.

### Shared UI Module
Handles navigation, active-page highlighting and dashboard information.

## 4. Data Flow

```text
User
  ↓
HTML Forms / Scoring Controls
  ↓
JavaScript Modules
  ├── Team Management
  ├── Match Management
  ├── Scoring Engine
  ├── History
  └── Statistics
  ↓
LocalStorage
  ↓
Dashboard / Scorecards / Player Stats
```

## 5. Key Cricket Logic

The scoring engine distinguishes between legal and illegal deliveries. Normal deliveries, byes and leg-byes count as legal balls, while wides and no-balls do not. Batting and bowling statistics are updated separately so that extras are handled correctly.

The application also tracks the Playing XI independently from the registered squad, allowing squads of up to 15 players while restricting a match to 11 selected players.

## 6. Limitations

- Data is stored only in the current browser/device.
- There is no user authentication.
- There is no cloud synchronization.
- Advanced tournament management is not included.

## 7. Future Scope

The application can be extended with cloud storage, authentication, tournament management, live sharing, advanced analytics, charts and export functionality.
