# E-Sports Tournament Analytical SQL Queries & Benchmarks

This document details the 11 analytical SQL benchmarks implemented in the **Global E-Sports Tournament Management Database Simulator**. All queries are engineered in standard **Oracle-compatible SQL**, executable directly over the relational database engine.

---

## Benchmark Suite Overview

| Query ID | Category | Complexity | Description |
| :--- | :--- | :--- | :--- |
| **Q1** | Multi-Table Join | Medium | Complete Match Overview with Stages, Opponents & Referees |
| **Q2** | Outer Join & Audit | High | Holistic Athlete Combat Telemetry, Peripherals & Anti-Cheat |
| **Q3** | Grouped Aggregate | Low | Competitive Match Volume per Organization |
| **Q4** | Filtered Aggregate | Medium | Deep Roster Verification (`HAVING COUNT(*) > 2`) |
| **Q5** | Statistical Aggregate | Low | League-Wide Frag Score Metrics (`SUM`, `AVG`, `MAX`, `MIN`) |
| **Q6** | Nested Subquery | High | Competitive Hegemony: Teams with Above-Average Wins |
| **Q7** | Nested Subquery | Medium | League Prodigies: Athletes Outscoring Global Average |
| **Q8** | Correlated Subquery | High | Intra-Team Outliers: Athletes Outperforming Team Mean |
| **Q9** | Correlated `EXISTS` & `UNION` | High | Disciplinary & Integrity Sanctions Audit |
| **Q10** | Enterprise Report | Extreme | Grand Tournament Dossier: Multi-Entity Comprehensive Join |
| **Q11** | View Virtualization | Medium | Materialized Analytics Views for Match & Player Analytics |

---

## 1. Complex Multi-Table Joins

### Query 1: Comprehensive Match Overview with Opponents & Referees
Aggregates fixture details across `TOURNAMENT`, `GAME`, `TOURNAMENT_STAGE`, `MATCH`, `TEAM_MATCH_PARTICIPATION`, and `REFEREE`.

```sql
SELECT 
    t.TournamentName,
    g.GameName,
    s.StageName,
    m.MatchID,
    LISTAGG(tm.TeamName, ' vs ') WITHIN GROUP (ORDER BY tm.TeamName) AS Matchup,
    m.MatchDate,
    m.MatchTime,
    r.RefereeName,
    m.MatchResult,
    m.MatchStatus
FROM MATCH m
JOIN TOURNAMENT_STAGE s ON m.StageID = s.StageID
JOIN TOURNAMENT t ON s.TournamentID = t.TournamentID
JOIN GAME g ON m.GameID = g.GameID
JOIN REFEREE r ON m.RefereeID = r.RefereeID
JOIN TEAM_MATCH_PARTICIPATION tmp ON m.MatchID = tmp.MatchID
JOIN TEAM tm ON tmp.TeamID = tm.TeamID
GROUP BY 
    t.TournamentName, g.GameName, s.StageName, m.MatchID,
    m.MatchDate, m.MatchTime, r.RefereeName, m.MatchResult, m.MatchStatus
ORDER BY m.MatchDate DESC, m.MatchID DESC;
```

---

### Query 2: Athlete Combat Telemetry, Peripherals & Anti-Cheat Audit
Joins `PLAYER`, `TEAM`, `MATCH`, `PLAYER_PERFORMANCE`, `EQUIPMENT`, and `LEFT JOIN ANTI_CHEAT` to produce a full telemetry audit per match.

```sql
SELECT 
    p.PlayerName,
    tm.TeamName,
    perf.MatchID,
    perf.Score,
    perf.Kills,
    perf.Assists,
    perf.Deaths,
    ROUND(perf.Kills / NULLIF(perf.Deaths, 0), 2) AS KD_Ratio,
    eq.EquipmentName,
    eq.Brand AS PeripheralsBrand,
    perf.InternetLatencyMs,
    perf.GameplayAnalytics,
    NVL(ac.CheatStatus, 'Clean') AS AntiCheatStatus
FROM PLAYER_PERFORMANCE perf
JOIN PLAYER p ON perf.PlayerID = p.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
JOIN EQUIPMENT eq ON perf.EquipmentID = eq.EquipmentID
LEFT JOIN ANTI_CHEAT ac 
    ON perf.MatchID = ac.MatchID 
   AND perf.PlayerID = ac.PlayerID
ORDER BY perf.Score DESC;
```

---

## 2. Aggregations & Groupings

### Query 3: Match Volume per Organization
Counts total tournament fixtures contested per team.

```sql
SELECT 
    t.TeamID,
    t.TeamName,
    t.Country,
    COUNT(tmp.MatchID) AS TotalMatchesPlayed
FROM TEAM t
LEFT JOIN TEAM_MATCH_PARTICIPATION tmp ON t.TeamID = tmp.TeamID
GROUP BY t.TeamID, t.TeamName, t.Country
ORDER BY TotalMatchesPlayed DESC;
```

---

### Query 4: Deep Roster Verification
Isolates professional organizations possessing active depth rosters with more than 2 contracted athletes.

```sql
SELECT 
    t.TeamID,
    t.TeamName,
    t.Ranking,
    COUNT(p.PlayerID) AS ContractedPlayers
FROM TEAM t
JOIN PLAYER p ON t.TeamID = p.TeamID
GROUP BY t.TeamID, t.TeamName, t.Ranking
HAVING COUNT(p.PlayerID) > 2
ORDER BY ContractedPlayers DESC, t.Ranking ASC;
```

---

### Query 5: League-Wide Frag Score Metrics
Computes baseline statistical properties of athlete combat performance across all officiated tournament matches.

```sql
SELECT 
    COUNT(*) AS TotalPerformanceSamples,
    SUM(Score) AS AggregateCombatScore,
    ROUND(AVG(Score), 2) AS MeanScore,
    MAX(Score) AS PeakMatchScore,
    MIN(Score) AS LowestMatchScore,
    ROUND(AVG(InternetLatencyMs), 1) AS AverageLatencyMs
FROM PLAYER_PERFORMANCE;
```

---

## 3. Subqueries & Comparative Analytics

### Query 6: Competitive Hegemony (Teams Exceeding Mean Wins)
Employs an uncorrelated scalar subquery to find teams whose accumulated match victories exceed the league-wide team average.

```sql
SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Country,
    COUNT(*) AS MatchesWon
FROM TEAM tm
JOIN TEAM_MATCH_PARTICIPATION tmp ON tm.TeamID = tmp.TeamID
WHERE tmp.Result = 'Win'
GROUP BY tm.TeamID, tm.TeamName, tm.Country
HAVING COUNT(*) > (
    SELECT AVG(WinCount)
    FROM (
        SELECT COUNT(*) AS WinCount
        FROM TEAM_MATCH_PARTICIPATION
        WHERE Result = 'Win'
        GROUP BY TeamID
    )
)
ORDER BY MatchesWon DESC;
```

---

### Query 7: League Scoring Prodigies (Exceeding Global Average)
Filters individual competitors whose mean combat rating strictly surpasses the global player scoring baseline.

```sql
SELECT 
    p.PlayerID,
    p.PlayerName,
    t.TeamName,
    ROUND(AVG(perf.Score), 2) AS PlayerAvgScore
FROM PLAYER p
JOIN TEAM t ON p.TeamID = t.TeamID
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
GROUP BY p.PlayerID, p.PlayerName, t.TeamName
HAVING AVG(perf.Score) > (
    SELECT AVG(Score) FROM PLAYER_PERFORMANCE
)
ORDER BY PlayerAvgScore DESC;
```

---

### Query 8: Intra-Team Outliers (Correlated Subquery)
Uses a correlated subquery to isolate star athletes who perform at a higher average scoring output than their own team's collective roster.

```sql
SELECT 
    p.PlayerID,
    p.PlayerName,
    t.TeamName,
    ROUND(AVG(pp.Score), 2) AS PlayerAvgScore
FROM PLAYER p
JOIN TEAM t ON p.TeamID = t.TeamID
JOIN PLAYER_PERFORMANCE pp ON p.PlayerID = pp.PlayerID
GROUP BY p.PlayerID, p.PlayerName, t.TeamID, t.TeamName
HAVING AVG(pp.Score) > (
    SELECT AVG(pp_team.Score)
    FROM PLAYER_PERFORMANCE pp_team
    JOIN PLAYER p_team ON pp_team.PlayerID = p_team.PlayerID
    WHERE p_team.TeamID = t.TeamID
)
ORDER BY PlayerAvgScore DESC;
```

---

### Query 9: Disciplinary & Integrity Sanctions Audit
Unifies sanctions levied against individual competitors and full organizational entities using correlated `EXISTS` subqueries.

```sql
SELECT 
    'Player' AS EntityType,
    p.PlayerName AS EntityName,
    da.ActionType,
    da.Penalty,
    da.ActionDate,
    da.MatchID
FROM DISCIPLINARY_ACTION da
JOIN PLAYER p ON da.PlayerID = p.PlayerID
WHERE EXISTS (
    SELECT 1 FROM PLAYER sub_p WHERE sub_p.PlayerID = da.PlayerID
)

UNION ALL

SELECT 
    'Team' AS EntityType,
    tm.TeamName AS EntityName,
    da.ActionType,
    da.Penalty,
    da.ActionDate,
    da.MatchID
FROM DISCIPLINARY_ACTION da
JOIN TEAM tm ON da.TeamID = tm.TeamID
WHERE EXISTS (
    SELECT 1 FROM TEAM sub_t WHERE sub_t.TeamID = da.TeamID
)
ORDER BY ActionDate DESC;
```

---

## 4. Enterprise Reporting & Views

### Query 10: Grand Tournament Executive Dossier
A multi-way enterprise report consolidating tournament results, team victories, player averages, disciplinary infractions, prize winnings, corporate sponsors, and awards—specifically restricted to teams maintaining an above-average win rate.

```sql
SELECT 
    trn.TournamentName,
    tm.TeamName,
    COUNT(DISTINCT tmp.MatchID) AS MatchesPlayed,
    SUM(CASE WHEN tmp.Result = 'Win' THEN 1 ELSE 0 END) AS MatchesWon,
    ROUND(AVG(pp.Score), 1) AS AvgPlayerScore,
    COUNT(DISTINCT da.ActionID) AS DisciplinaryCount,
    tr.FinalRank,
    tr.PrizeAmount,
    (SELECT LISTAGG(sp.SponsorName, ', ') WITHIN GROUP (ORDER BY sp.SponsorName)
     FROM TOURNAMENT_SPONSOR ts
     JOIN SPONSOR sp ON ts.SponsorID = sp.SponsorID
     WHERE ts.TournamentID = trn.TournamentID) AS TournamentSponsors,
    (SELECT LISTAGG(aw.AwardName, ', ') WITHIN GROUP (ORDER BY aw.AwardName)
     FROM AWARD aw
     WHERE aw.TournamentID = trn.TournamentID 
       AND (aw.TeamID = tm.TeamID OR aw.PlayerID IN (SELECT p2.PlayerID FROM PLAYER p2 WHERE p2.TeamID = tm.TeamID))) AS AwardsEarned
FROM TOURNAMENT trn
JOIN TOURNAMENT_RANKING tr ON trn.TournamentID = tr.TournamentID
JOIN TEAM tm ON tr.TeamID = tm.TeamID
JOIN TEAM_MATCH_PARTICIPATION tmp ON tm.TeamID = tmp.TeamID
LEFT JOIN PLAYER p ON tm.TeamID = p.TeamID
LEFT JOIN PLAYER_PERFORMANCE pp ON p.PlayerID = pp.PlayerID
LEFT JOIN DISCIPLINARY_ACTION da ON (da.TeamID = tm.TeamID OR da.PlayerID = p.PlayerID)
GROUP BY 
    trn.TournamentID, trn.TournamentName, tm.TeamID, tm.TeamName, 
    tr.FinalRank, tr.PrizeAmount
HAVING SUM(CASE WHEN tmp.Result = 'Win' THEN 1 ELSE 0 END) > (
    SELECT AVG(WinCount)
    FROM (
        SELECT COUNT(*) AS WinCount
        FROM TEAM_MATCH_PARTICIPATION
        WHERE Result = 'Win'
        GROUP BY TeamID
    )
)
ORDER BY tr.FinalRank ASC;
```

---

### Query 11: Virtualized Analytics Views
Dynamic SQL views encapsulating complex fixture and combat telemetry data for zero-overhead reporting.

```sql
-- View 1: Match Telemetry & Referee Virtualization
CREATE OR REPLACE VIEW TOURNAMENT_MATCH_DETAILS AS
SELECT 
    m.MatchID,
    t.TournamentName,
    g.GameName,
    s.StageName,
    m.MatchDate,
    m.MatchStatus,
    m.MatchResult,
    r.RefereeName
FROM MATCH m
JOIN TOURNAMENT_STAGE s ON m.StageID = s.StageID
JOIN TOURNAMENT t ON s.TournamentID = t.TournamentID
JOIN GAME g ON m.GameID = g.GameID
JOIN REFEREE r ON m.RefereeID = r.RefereeID;

-- View 2: High-Resolution Athlete Performance Virtualization
CREATE OR REPLACE VIEW PLAYER_PERFORMANCE_DETAILS AS
SELECT 
    perf.PerformanceID,
    p.PlayerName,
    tm.TeamName,
    perf.MatchID,
    perf.Score,
    perf.Kills,
    perf.Assists,
    perf.Deaths,
    eq.EquipmentName,
    perf.InternetLatencyMs,
    perf.GameplayAnalytics
FROM PLAYER_PERFORMANCE perf
JOIN PLAYER p ON perf.PlayerID = p.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
JOIN EQUIPMENT eq ON perf.EquipmentID = eq.EquipmentID;
```

---

## 5. Champions 2026 Shanghai Benchmark Queries (Q12 – Q16)

### Query 12: Per-Player Tournament ACS (Weighted Aggregation vs Arithmetic Mean)
Computes true tournament ACS by dividing aggregate combat score by total rounds played, contrasting against the arithmetic mean of map ACS to demonstrate mathematical delta.

```sql
SELECT 
    p.PlayerID,
    p.PlayerName,
    t.TeamName,
    COUNT(DISTINCT pp.MatchID) AS MatchesPlayed,
    COUNT(pp.PerformanceID) AS MapsPlayed,
    SUM(pp.RoundsPlayed) AS TotalRounds,
    SUM(pp.TotalCombatScore) AS TotalCombatScore,
    ROUND(SUM(pp.TotalCombatScore) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0), 1) AS TournamentACS,
    ROUND(AVG(pp.ACS), 1) AS ArithmeticMeanMapACS,
    ROUND((SUM(pp.TotalCombatScore) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0)) - AVG(pp.ACS), 2) AS CalculationDelta
FROM PLAYER p
JOIN TEAM t ON p.TeamID = t.TeamID
JOIN PLAYER_PERFORMANCE pp ON p.PlayerID = pp.PlayerID
GROUP BY p.PlayerID, p.PlayerName, t.TeamName
HAVING SUM(pp.RoundsPlayed) > 0
ORDER BY TournamentACS DESC;
```

---

### Query 13: Top 10 ACS Leaderboard (Endurance Threshold $\ge 50$ Rounds)
Filters out single-map small-sample outliers and ranks true tournament carry performers.

```sql
SELECT 
    p.PlayerName,
    t.TeamName,
    p.PlayerRole,
    SUM(pp.RoundsPlayed) AS TotalRounds,
    SUM(pp.Kills) AS TotalKills,
    SUM(pp.Deaths) AS TotalDeaths,
    ROUND(SUM(pp.Kills) * 1.0 / NULLIF(SUM(pp.Deaths), 0), 2) AS KD_Ratio,
    ROUND(SUM(pp.DamageDealt) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0), 1) AS ADR,
    ROUND(SUM(pp.TotalCombatScore) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0), 1) AS TournamentACS
FROM PLAYER p
JOIN TEAM t ON p.TeamID = t.TeamID
JOIN PLAYER_PERFORMANCE pp ON p.PlayerID = pp.PlayerID
GROUP BY p.PlayerID, p.PlayerName, t.TeamName, p.PlayerRole
HAVING SUM(pp.RoundsPlayed) >= 50
ORDER BY TournamentACS DESC
LIMIT 10;
```

---

### Query 14: Team Series & Round Differential Standings
Aggregates map records and total round differentials to resolve tournament seeding.

```sql
SELECT 
    t.TeamID,
    t.TeamName,
    t.Region,
    COUNT(DISTINCT m.MapID) AS MapsPlayed,
    SUM(CASE WHEN m.WinnerTeamID = t.TeamID THEN 1 ELSE 0 END) AS MapsWon,
    SUM(CASE WHEN m.WinnerTeamID != t.TeamID THEN 1 ELSE 0 END) AS MapsLost,
    ROUND(
        SUM(CASE WHEN m.WinnerTeamID = t.TeamID THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(COUNT(DISTINCT m.MapID), 0), 
        1
    ) AS MapWinRatePct,
    SUM(CASE WHEN m.WinnerTeamID = t.TeamID THEN m.Team1Score ELSE m.Team2Score END) AS TotalRoundsWon,
    SUM(CASE WHEN m.WinnerTeamID = t.TeamID THEN m.Team2Score ELSE m.Team1Score END) AS TotalRoundsLost,
    SUM(CASE WHEN m.WinnerTeamID = t.TeamID THEN m.Team1Score ELSE m.Team2Score END) -
    SUM(CASE WHEN m.WinnerTeamID = t.TeamID THEN m.Team2Score ELSE m.Team1Score END) AS RoundDifferential
FROM TEAM t
JOIN MATCH_MAP m ON t.TeamID = m.WinnerTeamID OR t.TeamID IN (
    SELECT Team1ID FROM MATCH WHERE MatchID = m.MatchID
    UNION
    SELECT Team2ID FROM MATCH WHERE MatchID = m.MatchID
)
GROUP BY t.TeamID, t.TeamName, t.Region
ORDER BY MapsWon DESC, RoundDifferential DESC;
```

---

### Query 15: Opening Duel Frag Rate Leaders (FK vs FD Differential)
Isolates aggressive entry duelists by calculating First Kills minus First Deaths.

```sql
SELECT 
    p.PlayerName,
    t.TeamName,
    p.PlayerRole,
    SUM(pp.RoundsPlayed) AS RoundsPlayed,
    SUM(pp.FirstKills) AS TotalFirstKills,
    SUM(pp.FirstDeaths) AS TotalFirstDeaths,
    SUM(pp.FirstKills) - SUM(pp.FirstDeaths) AS FirstKillDiff,
    ROUND(SUM(pp.FirstKills) * 1.0 / NULLIF(SUM(pp.FirstKills) + SUM(pp.FirstDeaths), 0) * 100, 1) AS OpeningDuelWinPct
FROM PLAYER p
JOIN TEAM t ON p.TeamID = t.TeamID
JOIN PLAYER_PERFORMANCE pp ON p.PlayerID = pp.PlayerID
GROUP BY p.PlayerID, p.PlayerName, t.TeamName, p.PlayerRole
HAVING SUM(pp.FirstKills) + SUM(pp.FirstDeaths) >= 8
ORDER BY FirstKillDiff DESC;
```

---

### Query 16: ArenaDB Impact Index Leaderboard (Multi-Pillar Power Ranking)
Calculates composite multi-pillar impact score balancing ACS, ADR, KAST%, and opening duel differential.

```sql
SELECT 
    p.PlayerName,
    t.TeamName,
    p.PlayerRole,
    SUM(pp.RoundsPlayed) AS RoundsPlayed,
    ROUND(SUM(pp.TotalCombatScore) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0), 1) AS TournamentACS,
    ROUND(SUM(pp.DamageDealt) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0), 1) AS TournamentADR,
    SUM(pp.FirstKills) - SUM(pp.FirstDeaths) AS FK_Diff,
    ROUND(
        0.40 * ((SUM(pp.TotalCombatScore) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0)) / 200.0) +
        0.25 * ((SUM(pp.DamageDealt) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0)) / 135.0) +
        0.20 * (74.0 / 70.0) +
        0.15 * (1.0 + (SUM(pp.FirstKills) - SUM(pp.FirstDeaths)) * 1.0 / NULLIF(SUM(pp.RoundsPlayed), 0)),
        2
    ) AS ImpactIndex
FROM PLAYER p
JOIN TEAM t ON p.TeamID = t.TeamID
JOIN PLAYER_PERFORMANCE pp ON p.PlayerID = pp.PlayerID
GROUP BY p.PlayerID, p.PlayerName, t.TeamName, p.PlayerRole
HAVING SUM(pp.RoundsPlayed) >= 40
ORDER BY ImpactIndex DESC;
```

