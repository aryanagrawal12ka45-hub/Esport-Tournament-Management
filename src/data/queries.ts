export interface SQLBenchmarkQuery {
  id: string;
  name: string;
  category: string;
  featureTag: string;
  description: string;
  sql: string;
  duckDbSql?: string;
  explainPlan: string;
  run: (tables: Record<string, any[]>) => { columns: string[]; rows: any[][] };
}

export const BENCHMARK_QUERIES: SQLBenchmarkQuery[] = [
  // A. JOINS
  {
    id: 'Q01',
    name: '1. Multi-Table Match Schedule & Arbiters',
    category: 'A. Joins',
    featureTag: 'INNER JOIN (5 Tables)',
    description: 'Retrieves complete match schedule including tournament name, game, stage, match ID, participating teams, date, referee, and score result.',
    sql: `SELECT 
    t.TournamentName,
    g.GameName,
    s.StageName,
    m.MatchID,
    LISTAGG(tm.TeamName, ' vs ') WITHIN GROUP (ORDER BY p.TeamID) AS CompetingTeams,
    TO_CHAR(m.MatchDate, 'YYYY-MM-DD') AS MatchDate,
    r.RefereeName,
    COALESCE(m.MatchResult, 'Pending Live') AS MatchResult
FROM MATCH m
JOIN TOURNAMENT_STAGE s ON m.StageID = s.StageID
JOIN TOURNAMENT t ON s.TournamentID = t.TournamentID
JOIN GAME g ON m.GameID = g.GameID
JOIN REFEREE r ON m.RefereeID = r.RefereeID
JOIN TEAM_MATCH_PARTICIPATION p ON m.MatchID = p.MatchID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY 
    t.TournamentName, g.GameName, s.StageName, m.MatchID, 
    m.MatchDate, r.RefereeName, m.MatchResult
ORDER BY m.MatchID;`,
    duckDbSql: `SELECT 
    t.TournamentName,
    g.GameName,
    s.StageName,
    m.MatchID,
    string_agg(tm.TeamName, ' vs ' ORDER BY p.TeamID) AS CompetingTeams,
    m.MatchDate,
    r.RefereeName,
    COALESCE(m.MatchResult, 'Pending Live') AS MatchResult
FROM MATCH m
JOIN TOURNAMENT_STAGE s ON m.StageID = s.StageID
JOIN TOURNAMENT t ON s.TournamentID = t.TournamentID
JOIN GAME g ON m.GameID = g.GameID
JOIN REFEREE r ON m.RefereeID = r.RefereeID
JOIN TEAM_MATCH_PARTICIPATION p ON m.MatchID = p.MatchID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY 
    t.TournamentName, g.GameName, s.StageName, m.MatchID, 
    m.MatchDate, r.RefereeName, m.MatchResult
ORDER BY m.MatchID;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   15 |    12   (0) | 00:00:01 | Projection & Group By |
|   1 |  HASH GROUP BY                |                          |   15 |    12  (10) | 00:00:01 | Aggregation on MatchID |
|   2 |   HASH JOIN                   |                          |   30 |    10   (0) | 00:00:01 | Access: p.TeamID = tm.TeamID |
|   3 |    TABLE ACCESS FULL          | TEAM                     |    6 |     2   (0) | 00:00:01 | Scans 6 Teams |
|   4 |    HASH JOIN                  |                          |   30 |     8   (0) | 00:00:01 | Access: m.MatchID = p.MatchID |
|   5 |     HASH JOIN                 |                          |   15 |     6   (0) | 00:00:01 | Access: m.RefereeID = r.RefereeID |
|   6 |      TABLE ACCESS FULL        | REFEREE                  |    4 |     2   (0) | 00:00:01 | Scans 4 Arbiters |
|   7 |      HASH JOIN                |                          |   15 |     4   (0) | 00:00:01 | Access: m.StageID = s.StageID |
|   8 |       TABLE ACCESS FULL       | MATCH                    |   15 |     2   (0) | 00:00:01 | Scans 15 Matches |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const matches = data['MATCH'] || [];
      const stages = data['TOURNAMENT_STAGE'] || [];
      const tournaments = data['TOURNAMENT'] || [];
      const games = data['GAME'] || [];
      const referees = data['REFEREE'] || [];
      const participations = data['TEAM_MATCH_PARTICIPATION'] || [];
      const teams = data['TEAM'] || [];

      const rows = matches.map((m) => {
        const stage = stages.find((s) => s.StageID === m.StageID);
        const tourney = tournaments.find((t) => t.TournamentID === stage?.TournamentID);
        const game = games.find((g) => g.GameID === m.GameID);
        const ref = referees.find((r) => r.RefereeID === m.RefereeID);
        const parts = participations.filter((p) => p.MatchID === m.MatchID);
        const teamNames = parts.map((p) => {
          const t = teams.find((tm) => tm.TeamID === p.TeamID);
          return t ? t.TeamName : p.TeamID;
        }).join(' vs ');

        return [
          tourney ? tourney.TournamentName : 'Apex Global Invitational',
          game ? game.GameName : 'Tactical Strike',
          stage ? stage.StageName : m.StageID,
          m.MatchID,
          teamNames || 'TBD',
          m.MatchDate,
          ref ? ref.RefereeName : m.RefereeID,
          m.MatchResult || 'Pending Live'
        ];
      });

      return {
        columns: ['TournamentName', 'GameName', 'StageName', 'MatchID', 'CompetingTeams', 'MatchDate', 'RefereeName', 'MatchResult'],
        rows
      };
    }
  },
  {
    id: 'Q02',
    name: '2. Player Telemetry & Integrity Surveillance',
    category: 'A. Joins',
    featureTag: 'LEFT OUTER JOIN',
    description: 'Queries player performance metrics (K/A/D, composite score, equipment, network latency, analytics) with a LEFT JOIN to anti-cheat surveillance to audit match integrity.',
    sql: `SELECT 
    p.PlayerName,
    tm.TeamName,
    perf.MatchID,
    perf.Score,
    perf.Kills || '/' || perf.Assists || '/' || perf.Deaths AS KDA,
    eq.EquipmentName,
    perf.InternetLatencyMs || ' ms' AS Ping,
    perf.GameplayAnalytics,
    COALESCE(ac.CheatStatus, 'Clean') AS AntiCheatStatus
FROM PLAYER_PERFORMANCE perf
JOIN PLAYER p ON perf.PlayerID = p.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
JOIN EQUIPMENT eq ON perf.EquipmentID = eq.EquipmentID
LEFT JOIN ANTI_CHEAT ac 
    ON perf.MatchID = ac.MatchID 
    AND perf.PlayerID = ac.PlayerID
ORDER BY perf.Score DESC;`,
    duckDbSql: `SELECT 
    p.PlayerName,
    tm.TeamName,
    perf.MatchID,
    perf.Score,
    concat(perf.Kills, '/', perf.Assists, '/', perf.Deaths) AS KDA,
    eq.EquipmentName,
    concat(perf.InternetLatencyMs, ' ms') AS Ping,
    perf.GameplayAnalytics,
    COALESCE(ac.CheatStatus, 'Clean') AS AntiCheatStatus
FROM PLAYER_PERFORMANCE perf
JOIN PLAYER p ON perf.PlayerID = p.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
JOIN EQUIPMENT eq ON perf.EquipmentID = eq.EquipmentID
LEFT JOIN ANTI_CHEAT ac 
    ON perf.MatchID = ac.MatchID 
    AND perf.PlayerID = ac.PlayerID
ORDER BY perf.Score DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   67 |     8   (0) | 00:00:01 | Full Projection Scan |
|   1 |  SORT ORDER BY                |                          |   67 |     8  (12) | 00:00:01 | Order by perf.Score DESC |
|   2 |   HASH JOIN RIGHT OUTER       |                          |   67 |     7   (0) | 00:00:01 | Access: ac.PlayerID = perf.PlayerID |
|   3 |    TABLE ACCESS FULL          | ANTI_CHEAT               |    6 |     2   (0) | 00:00:01 | Scans Integrity Flags |
|   4 |    HASH JOIN                  |                          |   67 |     5   (0) | 00:00:01 | Access: perf.EquipmentID = eq.EquipmentID |
|   5 |     TABLE ACCESS FULL         | EQUIPMENT                |    6 |     2   (0) | 00:00:01 | Scans Hardware Catalog |
|   6 |     HASH JOIN                 |                          |   67 |     3   (0) | 00:00:01 | Access: perf.PlayerID = p.PlayerID |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const perfs = data['PLAYER_PERFORMANCE'] || [];
      const players = data['PLAYER'] || [];
      const teams = data['TEAM'] || [];
      const equipment = data['EQUIPMENT'] || [];
      const anticheats = data['ANTI_CHEAT'] || [];

      const rows = perfs.map((perf) => {
        const p = players.find((pl) => pl.PlayerID === perf.PlayerID);
        const tm = teams.find((t) => t.TeamID === p?.TeamID);
        const eq = equipment.find((e) => e.EquipmentID === perf.EquipmentID);
        const ac = anticheats.find((a) => a.MatchID === perf.MatchID && a.PlayerID === perf.PlayerID);

        return [
          p ? p.PlayerName : perf.PlayerID,
          tm ? tm.TeamName : 'Unknown',
          perf.MatchID,
          perf.Score,
          `${perf.Kills}/${perf.Assists}/${perf.Deaths}`,
          eq ? eq.EquipmentName : perf.EquipmentID,
          `${perf.InternetLatencyMs} ms`,
          perf.GameplayAnalytics,
          ac ? ac.CheatStatus : 'Clean'
        ];
      }).sort((a, b) => Number(b[3]) - Number(a[3]));

      return {
        columns: ['PlayerName', 'TeamName', 'MatchID', 'Score', 'KDA', 'Equipment', 'Ping', 'GameplayAnalytics', 'AntiCheatStatus'],
        rows
      };
    }
  },
  {
    id: 'Q03',
    name: '3. Total Matches Played per Team',
    category: 'B. Aggregates',
    featureTag: 'COUNT(*) & GROUP BY',
    description: 'Computes the total number of competitive match appearances per team from participation records.',
    sql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Country,
    COUNT(p.MatchID) AS TotalMatchesPlayed
FROM TEAM tm
LEFT JOIN TEAM_MATCH_PARTICIPATION p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Country
ORDER BY TotalMatchesPlayed DESC, tm.TeamName ASC;`,
    duckDbSql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Country,
    COUNT(p.MatchID) AS TotalMatchesPlayed
FROM TEAM tm
LEFT JOIN TEAM_MATCH_PARTICIPATION p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Country
ORDER BY TotalMatchesPlayed DESC, tm.TeamName ASC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |    6 |     4   (0) | 00:00:01 | Projection of Totals |
|   1 |  SORT ORDER BY                |                          |    6 |     4  (25) | 00:00:01 | Sort by Matches DESC |
|   2 |   HASH GROUP BY               |                          |    6 |     3   (0) | 00:00:01 | Aggregate per TeamID |
|   3 |    HASH JOIN OUTER            |                          |   30 |     3   (0) | 00:00:01 | Left Join Participation |
|   4 |     TABLE ACCESS FULL         | TEAM                     |    6 |     2   (0) | 00:00:01 | Scans 6 Teams |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const teams = data['TEAM'] || [];
      const parts = data['TEAM_MATCH_PARTICIPATION'] || [];

      const rows = teams.map((tm) => {
        const count = parts.filter((p) => p.TeamID === tm.TeamID).length;
        return [tm.TeamID, tm.TeamName, tm.Country, count];
      }).sort((a, b) => Number(b[3]) - Number(a[3]));

      return {
        columns: ['TeamID', 'TeamName', 'Country', 'TotalMatchesPlayed'],
        rows
      };
    }
  },
  {
    id: 'Q04',
    name: '4. Active Rosters Exceeding Roster Threshold',
    category: 'B. Aggregates',
    featureTag: 'GROUP BY ... HAVING',
    description: 'Filters competitive esports organizations with more than 2 registered professional players using GROUP BY and HAVING clauses.',
    sql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Ranking,
    COUNT(p.PlayerID) AS TotalRosterCount
FROM TEAM tm
JOIN PLAYER p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Ranking
HAVING COUNT(p.PlayerID) > 2
ORDER BY TotalRosterCount DESC, tm.Ranking ASC;`,
    duckDbSql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Ranking,
    COUNT(p.PlayerID) AS TotalRosterCount
FROM TEAM tm
JOIN PLAYER p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Ranking
HAVING COUNT(p.PlayerID) > 2
ORDER BY TotalRosterCount DESC, tm.Ranking ASC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |    6 |     3   (0) | 00:00:01 | Filter: COUNT > 2 |
|   1 |  FILTER                       |                          |    6 |     3   (0) | 00:00:01 | Having clause filter |
|   2 |   HASH GROUP BY               |                          |    6 |     3  (15) | 00:00:01 | Group by TeamID |
|   3 |    HASH JOIN                  |                          |   36 |     3   (0) | 00:00:01 | Access: tm.TeamID = p.TeamID |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const teams = data['TEAM'] || [];
      const players = data['PLAYER'] || [];

      const rows = teams
        .map((tm) => {
          const roster = players.filter((p) => p.TeamID === tm.TeamID).length;
          return [tm.TeamID, tm.TeamName, tm.Ranking, roster];
        })
        .filter((row) => Number(row[3]) > 2)
        .sort((a, b) => Number(b[3]) - Number(a[3]));

      return {
        columns: ['TeamID', 'TeamName', 'GlobalRanking', 'TotalRosterCount'],
        rows
      };
    }
  },
  {
    id: 'Q05',
    name: '5. Global Performance Score Distribution',
    category: 'B. Aggregates',
    featureTag: 'SUM / AVG / MAX / MIN',
    description: 'Computes executive statistical summary metrics (SUM, AVG, MAX, MIN, and COUNT) over all recorded player combat performance logs.',
    sql: `SELECT 
    COUNT(PerformanceID) AS TotalPerformanceLogs,
    SUM(Score) AS SumScore,
    ROUND(AVG(Score), 2) AS AvgScore,
    MAX(Score) AS MaxScore,
    MIN(Score) AS MinScore,
    ROUND(AVG(InternetLatencyMs), 2) AS AvgLatencyMs
FROM PLAYER_PERFORMANCE;`,
    duckDbSql: `SELECT 
    COUNT(PerformanceID) AS TotalPerformanceLogs,
    SUM(Score) AS SumScore,
    ROUND(AVG(Score), 2) AS AvgScore,
    MAX(Score) AS MaxScore,
    MIN(Score) AS MinScore,
    ROUND(AVG(InternetLatencyMs), 2) AS AvgLatencyMs
FROM PLAYER_PERFORMANCE;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |    1 |     2   (0) | 00:00:01 | Aggregate Vector |
|   1 |  SORT AGGREGATE               |                          |    1 |     2   (0) | 00:00:01 | Single-pass Column Scan |
|   2 |   TABLE ACCESS FULL           | PLAYER_PERFORMANCE       |   67 |     2   (0) | 00:00:01 | SIMD Columnar Morsel Scan |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const perfs = data['PLAYER_PERFORMANCE'] || [];
      if (!perfs.length) {
        return {
          columns: ['TotalLogs', 'SumScore', 'AvgScore', 'MaxScore', 'MinScore', 'AvgLatencyMs'],
          rows: [[0, 0, 0, 0, 0, 0]]
        };
      }

      const total = perfs.length;
      const sum = perfs.reduce((acc, p) => acc + (Number(p.Score) || 0), 0);
      const avg = (sum / total).toFixed(2);
      const max = Math.max(...perfs.map((p) => Number(p.Score) || 0));
      const min = Math.min(...perfs.map((p) => Number(p.Score) || 0));
      const avgLat = (perfs.reduce((acc, p) => acc + (Number(p.InternetLatencyMs) || 0), 0) / total).toFixed(2);

      return {
        columns: ['TotalPerformanceLogs', 'SumScore', 'AvgScore', 'MaxScore', 'MinScore', 'AvgLatencyMs'],
        rows: [[total, sum, avg, max, min, `${avgLat} ms`]]
      };
    }
  },
  {
    id: 'Q06',
    name: '6. Teams Outperforming Average Win Threshold',
    category: 'C. Subqueries',
    featureTag: 'NESTED SUBQUERY',
    description: 'Identifies elite teams whose total recorded match victories exceed the league-wide average number of victories across all teams.',
    sql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Country,
    COUNT(CASE WHEN p.Result = 'Win' THEN 1 END) AS WinsWon
FROM TEAM tm
JOIN TEAM_MATCH_PARTICIPATION p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Country
HAVING COUNT(CASE WHEN p.Result = 'Win' THEN 1 END) > (
    SELECT AVG(WinsPerTeam)
    FROM (
        SELECT COUNT(CASE WHEN Result = 'Win' THEN 1 END) AS WinsPerTeam
        FROM TEAM_MATCH_PARTICIPATION
        GROUP BY TeamID
    )
)
ORDER BY WinsWon DESC;`,
    duckDbSql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Country,
    COUNT(CASE WHEN p.Result = 'Win' THEN 1 END) AS WinsWon
FROM TEAM tm
JOIN TEAM_MATCH_PARTICIPATION p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Country
HAVING COUNT(CASE WHEN p.Result = 'Win' THEN 1 END) > (
    SELECT AVG(WinsPerTeam)
    FROM (
        SELECT COUNT(CASE WHEN Result = 'Win' THEN 1 END) AS WinsPerTeam
        FROM TEAM_MATCH_PARTICIPATION
        GROUP BY TeamID
    )
)
ORDER BY WinsWon DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |    3 |     6   (0) | 00:00:01 | Scalar Nested Subquery |
|   1 |  FILTER                       |                          |    3 |     6   (0) | 00:00:01 | Filter: Wins > AVG(Wins) |
|   2 |   HASH GROUP BY               |                          |    6 |     3   (0) | 00:00:01 | Group by TeamID |
|   3 |    TABLE ACCESS FULL          | TEAM_MATCH_PARTICIPATION |   30 |     2   (0) | 00:00:01 | Scans Participations |
|   4 |   VIEW                        |                          |    1 |     3   (0) | 00:00:01 | Nested Derived Table |
|   5 |    SORT AGGREGATE             |                          |    1 |     3   (0) | 00:00:01 | Average Computation |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const teams = data['TEAM'] || [];
      const parts = data['TEAM_MATCH_PARTICIPATION'] || [];

      const teamWinsMap: Record<string, number> = {};
      teams.forEach((tm) => { teamWinsMap[tm.TeamID] = 0; });
      parts.forEach((p) => {
        if (p.Result === 'Win') {
          teamWinsMap[p.TeamID] = (teamWinsMap[p.TeamID] || 0) + 1;
        }
      });

      const winValues = Object.values(teamWinsMap);
      const avgWins = winValues.length > 0 ? winValues.reduce((a, b) => a + b, 0) / winValues.length : 0;

      const rows = teams
        .filter((tm) => (teamWinsMap[tm.TeamID] || 0) > avgWins)
        .map((tm) => [tm.TeamID, tm.TeamName, tm.Country, teamWinsMap[tm.TeamID], avgWins.toFixed(2)])
        .sort((a, b) => Number(b[3]) - Number(a[3]));

      return {
        columns: ['TeamID', 'TeamName', 'Country', 'WinsWon', 'LeagueAvgWinsThreshold'],
        rows
      };
    }
  },
  {
    id: 'Q07',
    name: '7. Players Exceeding Global Average Score',
    category: 'C. Subqueries',
    featureTag: 'NESTED SUBQUERY',
    description: 'Queries individual players whose average match score strictly exceeds the overall global average score across all players.',
    sql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    ROUND(AVG(perf.Score), 2) AS PlayerAvgScore
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
HAVING AVG(perf.Score) > (
    SELECT AVG(Score) FROM PLAYER_PERFORMANCE
)
ORDER BY PlayerAvgScore DESC;`,
    duckDbSql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    ROUND(AVG(perf.Score), 2) AS PlayerAvgScore
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
HAVING AVG(perf.Score) > (
    SELECT AVG(Score) FROM PLAYER_PERFORMANCE
)
ORDER BY PlayerAvgScore DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   18 |     4   (0) | 00:00:01 | Scalar Nested Subquery |
|   1 |  FILTER                       |                          |   18 |     4   (0) | 00:00:01 | Having > (SELECT AVG) |
|   2 |   HASH GROUP BY               |                          |   36 |     3   (0) | 00:00:01 | Group by PlayerID |
|   3 |    HASH JOIN                  |                          |   67 |     3   (0) | 00:00:01 | Join Player to Performance |
|   4 |   SORT AGGREGATE              |                          |    1 |     2   (0) | 00:00:01 | Global Score Average |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const players = data['PLAYER'] || [];
      const teams = data['TEAM'] || [];
      const perfs = data['PLAYER_PERFORMANCE'] || [];

      const globalAvg = perfs.length > 0 ? perfs.reduce((a, b) => a + Number(b.Score), 0) / perfs.length : 0;

      const rows: any[][] = [];
      players.forEach((p) => {
        const pPerfs = perfs.filter((perf) => perf.PlayerID === p.PlayerID);
        if (!pPerfs.length) return;
        const pAvg = pPerfs.reduce((a, b) => a + Number(b.Score), 0) / pPerfs.length;
        if (pAvg > globalAvg) {
          const tm = teams.find((t) => t.TeamID === p.TeamID);
          rows.push([
            p.PlayerID,
            p.PlayerName,
            tm ? tm.TeamName : p.TeamID,
            p.PlayerRole,
            pAvg.toFixed(2),
            globalAvg.toFixed(2)
          ]);
        }
      });

      rows.sort((a, b) => Number(b[4]) - Number(a[4]));

      return {
        columns: ['PlayerID', 'PlayerName', 'TeamName', 'Role', 'PlayerAvgScore', 'GlobalAvgBenchmark'],
        rows
      };
    }
  },
  {
    id: 'Q08',
    name: '8. Stars Outperforming Their Team Benchmark',
    category: 'C. Subqueries',
    featureTag: 'CORRELATED SUBQUERY',
    description: 'Finds top players whose personal average score exceeds their own specific team roster average score.',
    sql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    p.TeamID,
    ROUND(AVG(perf.Score), 2) AS IndividualAvgScore,
    (
        SELECT ROUND(AVG(p2.Score), 2)
        FROM PLAYER_PERFORMANCE p2
        JOIN PLAYER pl2 ON p2.PlayerID = pl2.PlayerID
        WHERE pl2.TeamID = p.TeamID
    ) AS TeamAvgBenchmark
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
GROUP BY p.PlayerID, p.PlayerName, p.TeamID
HAVING AVG(perf.Score) > (
    SELECT AVG(p2.Score)
    FROM PLAYER_PERFORMANCE p2
    JOIN PLAYER pl2 ON p2.PlayerID = pl2.PlayerID
    WHERE pl2.TeamID = p.TeamID
)
ORDER BY (AVG(perf.Score) - (
    SELECT AVG(p2.Score)
    FROM PLAYER_PERFORMANCE p2
    JOIN PLAYER pl2 ON p2.PlayerID = pl2.PlayerID
    WHERE pl2.TeamID = p.TeamID
)) DESC;`,
    duckDbSql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    p.TeamID,
    ROUND(AVG(perf.Score), 2) AS IndividualAvgScore,
    (
        SELECT ROUND(AVG(p2.Score), 2)
        FROM PLAYER_PERFORMANCE p2
        JOIN PLAYER pl2 ON p2.PlayerID = pl2.PlayerID
        WHERE pl2.TeamID = p.TeamID
    ) AS TeamAvgBenchmark
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
GROUP BY p.PlayerID, p.PlayerName, p.TeamID
HAVING AVG(perf.Score) > (
    SELECT AVG(p2.Score)
    FROM PLAYER_PERFORMANCE p2
    JOIN PLAYER pl2 ON p2.PlayerID = pl2.PlayerID
    WHERE pl2.TeamID = p.TeamID
)
ORDER BY (AVG(perf.Score) - (
    SELECT AVG(p2.Score)
    FROM PLAYER_PERFORMANCE p2
    JOIN PLAYER pl2 ON p2.PlayerID = pl2.PlayerID
    WHERE pl2.TeamID = p.TeamID
)) DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   12 |    18   (0) | 00:00:01 | Correlated Subquery |
|   1 |  FILTER                       |                          |   12 |    18   (0) | 00:00:01 | Correlated Filter: TeamID |
|   2 |   HASH GROUP BY               |                          |   36 |     3   (0) | 00:00:01 | Group by PlayerID |
|   3 |   SORT AGGREGATE              |                          |    1 |     3   (0) | 00:00:01 | Per-Team Score Average |
|   4 |    HASH JOIN                  |                          |   15 |     3   (0) | 00:00:01 | Access: pl2.TeamID = :B1 |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const players = data['PLAYER'] || [];
      const perfs = data['PLAYER_PERFORMANCE'] || [];

      const teamScores: Record<string, number[]> = {};
      players.forEach((p) => {
        const pPerfs = perfs.filter((perf) => perf.PlayerID === p.PlayerID);
        pPerfs.forEach((perf) => {
          if (!teamScores[p.TeamID]) teamScores[p.TeamID] = [];
          teamScores[p.TeamID].push(Number(perf.Score));
        });
      });

      const teamAvgMap: Record<string, number> = {};
      Object.entries(teamScores).forEach(([tmId, scores]) => {
        teamAvgMap[tmId] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      });

      const rows: any[][] = [];
      players.forEach((p) => {
        const pPerfs = perfs.filter((perf) => perf.PlayerID === p.PlayerID);
        if (!pPerfs.length) return;
        const pAvg = pPerfs.reduce((a, b) => a + Number(b.Score), 0) / pPerfs.length;
        const tmAvg = teamAvgMap[p.TeamID] || 0;

        if (pAvg > tmAvg) {
          const delta = (pAvg - tmAvg).toFixed(2);
          rows.push([
            p.PlayerID,
            p.PlayerName,
            p.TeamID,
            pAvg.toFixed(2),
            tmAvg.toFixed(2),
            `+${delta}`
          ]);
        }
      });

      rows.sort((a, b) => Number(b[5].replace('+', '')) - Number(a[5].replace('+', '')));

      return {
        columns: ['PlayerID', 'PlayerName', 'TeamID', 'PlayerAvgScore', 'TeamAvgBenchmark', 'Differential'],
        rows
      };
    }
  },
  {
    id: 'Q09',
    name: '9. Integrity Audit: Sanctioned Players & Teams',
    category: 'C. Subqueries',
    featureTag: 'CORRELATED EXISTS & UNION',
    description: 'Correlated subquery auditing all players and teams that have at least one recorded disciplinary penalty, combined using UNION with an EntityType column.',
    sql: `SELECT 
    'PLAYER' AS EntityType,
    p.PlayerID AS EntityID,
    p.PlayerName AS EntityName,
    p.Country,
    (
        SELECT da.ActionType || ': ' || da.Penalty 
        FROM DISCIPLINARY_ACTION da 
        WHERE da.PlayerID = p.PlayerID AND ROWNUM = 1
    ) AS LatestSanction
FROM PLAYER p
WHERE EXISTS (
    SELECT 1 FROM DISCIPLINARY_ACTION da WHERE da.PlayerID = p.PlayerID
)

UNION

SELECT 
    'TEAM' AS EntityType,
    tm.TeamID AS EntityID,
    tm.TeamName AS EntityName,
    tm.Country,
    (
        SELECT da.ActionType || ': ' || da.Penalty 
        FROM DISCIPLINARY_ACTION da 
        WHERE da.TeamID = tm.TeamID AND ROWNUM = 1
    ) AS LatestSanction
FROM TEAM tm
WHERE EXISTS (
    SELECT 1 FROM DISCIPLINARY_ACTION da WHERE da.TeamID = tm.TeamID
)
ORDER BY EntityType, EntityName;`,
    duckDbSql: `SELECT 
    'PLAYER' AS EntityType,
    p.PlayerID AS EntityID,
    p.PlayerName AS EntityName,
    p.Country,
    (
        SELECT concat(da.ActionType, ': ', da.Penalty)
        FROM DISCIPLINARY_ACTION da 
        WHERE da.PlayerID = p.PlayerID 
        LIMIT 1
    ) AS LatestSanction
FROM PLAYER p
WHERE EXISTS (
    SELECT 1 FROM DISCIPLINARY_ACTION da WHERE da.PlayerID = p.PlayerID
)

UNION

SELECT 
    'TEAM' AS EntityType,
    tm.TeamID AS EntityID,
    tm.TeamName AS EntityName,
    tm.Country,
    (
        SELECT concat(da.ActionType, ': ', da.Penalty)
        FROM DISCIPLINARY_ACTION da 
        WHERE da.TeamID = tm.TeamID 
        LIMIT 1
    ) AS LatestSanction
FROM TEAM tm
WHERE EXISTS (
    SELECT 1 FROM DISCIPLINARY_ACTION da WHERE da.TeamID = tm.TeamID
)
ORDER BY EntityType, EntityName;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |    4 |     6   (0) | 00:00:01 | Full Integrity Audit |
|   1 |  SORT UNIQUE                  |                          |    4 |     6  (20) | 00:00:01 | UNION Deduplication |
|   2 |   UNION-ALL                   |                          |    4 |     5   (0) | 00:00:01 | Parallel Entity Scan |
|   3 |    FILTER                     |                          |    2 |     3   (0) | 00:00:01 | Correlated EXISTS (Player) |
|   4 |     TABLE ACCESS FULL         | PLAYER                   |   36 |     2   (0) | 00:00:01 | Scans Players |
|   5 |    FILTER                     |                          |    2 |     2   (0) | 00:00:01 | Correlated EXISTS (Team) |
|   6 |     TABLE ACCESS FULL         | TEAM                     |    6 |     2   (0) | 00:00:01 | Scans Teams |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const players = data['PLAYER'] || [];
      const teams = data['TEAM'] || [];
      const actions = data['DISCIPLINARY_ACTION'] || [];

      const playerRows = players
        .filter((p) => actions.some((da) => da.PlayerID === p.PlayerID))
        .map((p) => {
          const act = actions.find((da) => da.PlayerID === p.PlayerID);
          return ['PLAYER', p.PlayerID, p.PlayerName, p.Country, act ? `${act.ActionType}: ${act.Penalty}` : 'Sanctioned'];
        });

      const teamRows = teams
        .filter((tm) => actions.some((da) => da.TeamID === tm.TeamID))
        .map((tm) => {
          const act = actions.find((da) => da.TeamID === tm.TeamID);
          return ['TEAM', tm.TeamID, tm.TeamName, tm.Country, act ? `${act.ActionType}: ${act.Penalty}` : 'Sanctioned'];
        });

      return {
        columns: ['EntityType', 'EntityID', 'EntityName', 'Country', 'LatestSanction'],
        rows: [...playerRows, ...teamRows]
      };
    }
  },
  {
    id: 'Q10',
    name: '10. Master Tournament Analytics & Financial Report',
    category: 'C. Subqueries',
    featureTag: 'FULL REPORT (Above-Avg Teams)',
    description: 'Master analytical report detailing Tournament, Team, Matches, Wins, Avg Player Score, Disciplinary Count, Final Rank, Prize Money, Sponsors, and Awards—filtered only for teams with wins above average.',
    sql: `SELECT 
    t.TournamentName,
    tm.TeamName,
    COUNT(DISTINCT p.MatchID) AS TotalMatches,
    COUNT(DISTINCT CASE WHEN p.Result = 'Win' THEN p.MatchID END) AS MatchesWon,
    ROUND(AVG(perf.Score), 2) AS AvgPlayerScore,
    COUNT(DISTINCT da.ActionID) AS DisciplinaryCount,
    tr.FinalPosition AS FinalRank,
    TO_CHAR(tr.PrizeAmount, '$999,999.00') AS PrizeMoney,
    COALESCE(LISTAGG(DISTINCT sp.SponsorName, ', ') WITHIN GROUP (ORDER BY sp.SponsorName), 'None') AS Sponsors,
    COALESCE(LISTAGG(DISTINCT aw.AwardName, '; ') WITHIN GROUP (ORDER BY aw.AwardName), 'None') AS Awards
FROM TOURNAMENT t
JOIN TOURNAMENT_STAGE s ON t.TournamentID = s.TournamentID
JOIN MATCH m ON s.StageID = m.StageID
JOIN TEAM_MATCH_PARTICIPATION p ON m.MatchID = p.MatchID
JOIN TEAM tm ON p.TeamID = tm.TeamID
LEFT JOIN PLAYER pl ON tm.TeamID = pl.TeamID
LEFT JOIN PLAYER_PERFORMANCE perf ON pl.PlayerID = perf.PlayerID
LEFT JOIN DISCIPLINARY_ACTION da ON tm.TeamID = da.TeamID OR pl.PlayerID = da.PlayerID
LEFT JOIN TOURNAMENT_RANKING tr ON t.TournamentID = tr.TournamentID AND tm.TeamID = tr.TeamID
LEFT JOIN TOURNAMENT_SPONSOR ts ON t.TournamentID = ts.TournamentID
LEFT JOIN SPONSOR sp ON ts.SponsorID = sp.SponsorID
LEFT JOIN AWARD aw ON t.TournamentID = aw.TournamentID AND (tm.TeamID = aw.TeamID OR pl.PlayerID = aw.PlayerID)
WHERE tm.TeamID IN (
    SELECT TeamID
    FROM TEAM_MATCH_PARTICIPATION
    WHERE Result = 'Win'
    GROUP BY TeamID
    HAVING COUNT(*) > (
        SELECT AVG(Wins)
        FROM (SELECT COUNT(*) AS Wins FROM TEAM_MATCH_PARTICIPATION WHERE Result = 'Win' GROUP BY TeamID)
    )
)
GROUP BY 
    t.TournamentName, tm.TeamName, tr.FinalPosition, tr.PrizeAmount
ORDER BY tr.FinalPosition ASC;`,
    duckDbSql: `SELECT 
    t.TournamentName,
    tm.TeamName,
    COUNT(DISTINCT p.MatchID) AS TotalMatches,
    COUNT(DISTINCT CASE WHEN p.Result = 'Win' THEN p.MatchID END) AS MatchesWon,
    ROUND(AVG(perf.Score), 2) AS AvgPlayerScore,
    COUNT(DISTINCT da.ActionID) AS DisciplinaryCount,
    tr.FinalPosition AS FinalRank,
    concat('$', printf('%,d', CAST(tr.PrizeAmount AS BIGINT))) AS PrizeMoney,
    COALESCE(string_agg(DISTINCT sp.SponsorName, ', '), 'None') AS Sponsors,
    COALESCE(string_agg(DISTINCT aw.AwardName, '; '), 'None') AS Awards
FROM TOURNAMENT t
JOIN TOURNAMENT_STAGE s ON t.TournamentID = s.TournamentID
JOIN MATCH m ON s.StageID = m.StageID
JOIN TEAM_MATCH_PARTICIPATION p ON m.MatchID = p.MatchID
JOIN TEAM tm ON p.TeamID = tm.TeamID
LEFT JOIN PLAYER pl ON tm.TeamID = pl.TeamID
LEFT JOIN PLAYER_PERFORMANCE perf ON pl.PlayerID = perf.PlayerID
LEFT JOIN DISCIPLINARY_ACTION da ON tm.TeamID = da.TeamID OR pl.PlayerID = da.PlayerID
LEFT JOIN TOURNAMENT_RANKING tr ON t.TournamentID = tr.TournamentID AND tm.TeamID = tr.TeamID
LEFT JOIN TOURNAMENT_SPONSOR ts ON t.TournamentID = ts.TournamentID
LEFT JOIN SPONSOR sp ON ts.SponsorID = sp.SponsorID
LEFT JOIN AWARD aw ON t.TournamentID = aw.TournamentID AND (tm.TeamID = aw.TeamID OR pl.PlayerID = aw.PlayerID)
WHERE tm.TeamID IN (
    SELECT TeamID
    FROM TEAM_MATCH_PARTICIPATION
    WHERE Result = 'Win'
    GROUP BY TeamID
    HAVING COUNT(*) > (
        SELECT AVG(Wins)
        FROM (SELECT COUNT(*) AS Wins FROM TEAM_MATCH_PARTICIPATION WHERE Result = 'Win' GROUP BY TeamID)
    )
)
GROUP BY 
    t.TournamentName, tm.TeamName, tr.FinalPosition, tr.PrizeAmount
ORDER BY tr.FinalPosition ASC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |    3 |    24   (0) | 00:00:01 | Executive Multi-Join |
|   1 |  SORT ORDER BY                |                          |    3 |    24  (15) | 00:00:01 | Sort by FinalRank ASC |
|   2 |   HASH GROUP BY               |                          |    3 |    22   (0) | 00:00:01 | Group across Tournament & Team |
|   3 |    FILTER                     |                          |    3 |    20   (0) | 00:00:01 | In (Above-Avg Win Subquery) |
|   4 |     HASH JOIN OUTER           |                          |  150 |    18   (0) | 00:00:01 | Outer joins across 8 tables |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const tourneys = data['TOURNAMENT'] || [];
      const teams = data['TEAM'] || [];
      const parts = data['TEAM_MATCH_PARTICIPATION'] || [];
      const players = data['PLAYER'] || [];
      const perfs = data['PLAYER_PERFORMANCE'] || [];
      const actions = data['DISCIPLINARY_ACTION'] || [];
      const rankings = data['TOURNAMENT_RANKING'] || [];
      const sponsors = data['SPONSOR'] || [];
      const tourneySponsors = data['TOURNAMENT_SPONSOR'] || [];
      const awards = data['AWARD'] || [];

      const teamWinsMap: Record<string, number> = {};
      teams.forEach((t) => { teamWinsMap[t.TeamID] = 0; });
      parts.forEach((p) => {
        if (p.Result === 'Win') {
          teamWinsMap[p.TeamID] = (teamWinsMap[p.TeamID] || 0) + 1;
        }
      });
      const winVals = Object.values(teamWinsMap);
      const avgWins = winVals.length > 0 ? winVals.reduce((a, b) => a + b, 0) / winVals.length : 0;

      const aboveAvgTeams = teams.filter((t) => (teamWinsMap[t.TeamID] || 0) > avgWins);

      const rows = aboveAvgTeams.map((tm) => {
        const teamParts = parts.filter((p) => p.TeamID === tm.TeamID);
        const matchesCount = teamParts.length;
        const winsCount = teamParts.filter((p) => p.Result === 'Win').length;

        const teamPlayers = players.filter((pl) => pl.TeamID === tm.TeamID);
        const playerIds = new Set(teamPlayers.map((pl) => pl.PlayerID));
        const teamPerfs = perfs.filter((perf) => playerIds.has(perf.PlayerID));
        const avgScore = teamPerfs.length > 0 ? (teamPerfs.reduce((a, b) => a + Number(b.Score), 0) / teamPerfs.length).toFixed(2) : '0.00';

        const discCount = actions.filter((da) => da.TeamID === tm.TeamID || playerIds.has(da.PlayerID)).length;

        const rankRecord = rankings.find((r) => r.TeamID === tm.TeamID);
        const rank = rankRecord ? rankRecord.FinalRank : '-';
        const prize = rankRecord ? `$${Number(rankRecord.PrizeAmount).toLocaleString()}` : '$0';

        const sponsorList = tourneySponsors.map((ts) => {
          const sp = sponsors.find((s) => s.SponsorID === ts.SponsorID);
          return sp ? sp.SponsorName : ts.SponsorID;
        }).join(', ');

        const teamAwards = awards.filter((aw) => aw.TeamID === tm.TeamID || playerIds.has(aw.PlayerID));
        const awardStr = teamAwards.length > 0 ? teamAwards.map((a) => a.AwardName).join('; ') : 'None';

        return [
          tourneys[0]?.TournamentName || 'Apex Championship 2025',
          tm.TeamName,
          matchesCount,
          winsCount,
          avgScore,
          discCount,
          rank,
          prize,
          sponsorList || 'OmniTech',
          awardStr
        ];
      }).sort((a, b) => Number(a[6]) - Number(b[6]));

      return {
        columns: ['Tournament', 'TeamName', 'TotalMatches', 'MatchesWon', 'AvgPlayerScore', 'DisciplinaryCount', 'FinalRank', 'PrizeMoney', 'Sponsors', 'Awards'],
        rows
      };
    }
  },
  {
    id: 'Q11',
    name: '11. Relational Views: Match & Player Summaries',
    category: 'D. Views',
    featureTag: 'CREATE VIEW DDL',
    description: 'Defines and queries relational views TOURNAMENT_MATCH_DETAILS and PLAYER_PERFORMANCE_DETAILS for streamlined production reporting.',
    sql: `/* VIEW 1: TOURNAMENT_MATCH_DETAILS */
CREATE OR REPLACE VIEW TOURNAMENT_MATCH_DETAILS AS
SELECT 
    m.MatchID,
    t.TournamentName,
    s.StageName,
    g.GameName,
    m.MatchDate,
    m.MatchStatus,
    m.MatchResult
FROM MATCH m
JOIN TOURNAMENT_STAGE s ON m.StageID = s.StageID
JOIN TOURNAMENT t ON s.TournamentID = t.TournamentID
JOIN GAME g ON m.GameID = g.GameID;

/* VIEW 2: PLAYER_PERFORMANCE_DETAILS */
CREATE OR REPLACE VIEW PLAYER_PERFORMANCE_DETAILS AS
SELECT 
    perf.PerformanceID,
    p.PlayerName,
    tm.TeamName,
    perf.Score,
    perf.Kills,
    perf.Deaths,
    ROUND(perf.Kills / GREATEST(perf.Deaths, 1), 2) AS KDRatio,
    perf.InternetLatencyMs
FROM PLAYER_PERFORMANCE perf
JOIN PLAYER p ON perf.PlayerID = p.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID;

/* QUERY FROM VIEW 1 */
SELECT * FROM TOURNAMENT_MATCH_DETAILS WHERE ROWNUM <= 8;`,
    duckDbSql: `SELECT 
    m.MatchID,
    t.TournamentName,
    s.StageName,
    g.GameName,
    m.MatchDate,
    m.MatchStatus,
    m.MatchResult
FROM MATCH m
JOIN TOURNAMENT_STAGE s ON m.StageID = s.StageID
JOIN TOURNAMENT t ON s.TournamentID = t.TournamentID
JOIN GAME g ON m.GameID = g.GameID
LIMIT 8;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |    8 |     4   (0) | 00:00:01 | View Scan with ROWNUM |
|   1 |  COUNT STOPKEY                |                          |    8 |     4   (0) | 00:00:01 | Stop at 8 rows |
|   2 |   VIEW                        | TOURNAMENT_MATCH_DETAILS |   15 |     4   (0) | 00:00:01 | View Expansion |
|   3 |    HASH JOIN                  |                          |   15 |     4   (0) | 00:00:01 | Join Stage & Game |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const matches = data['MATCH'] || [];
      const stages = data['TOURNAMENT_STAGE'] || [];
      const tourneys = data['TOURNAMENT'] || [];
      const games = data['GAME'] || [];

      const rows = matches.slice(0, 8).map((m) => {
        const stage = stages.find((s) => s.StageID === m.StageID);
        const tourney = tourneys.find((t) => t.TournamentID === stage?.TournamentID);
        const game = games.find((g) => g.GameID === m.GameID);

        return [
          m.MatchID,
          tourney ? tourney.TournamentName : 'VALORANT Champions 2026 Shanghai',
          stage ? stage.StageName : m.StageID,
          game ? game.GameName : m.GameID,
          m.MatchDate,
          m.MatchStatus,
          m.MatchResult || 'In Progress'
        ];
      });

      return {
        columns: ['MatchID', 'TournamentName', 'StageName', 'GameName', 'MatchDate', 'MatchStatus', 'MatchResult'],
        rows
      };
    }
  },
  {
    id: 'Q12',
    name: '12. Per-Player Tournament ACS (Weighted Aggregation)',
    category: 'E. Advanced Metrics',
    featureTag: 'SUM(Score) / SUM(Rounds)',
    description: 'Computes true tournament ACS using SUM(TotalCombatScore) / SUM(RoundsPlayed) rather than arithmetic mean of map ACS. Formula: ACS = Total Combat Score / Total Rounds.',
    sql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    COUNT(DISTINCT perf.MatchID) AS MatchesPlayed,
    COUNT(perf.PerformanceID) AS MapsPlayed,
    SUM(perf.RoundsPlayed) AS TotalRounds,
    SUM(perf.TotalCombatScore) AS TotalCombatScore,
    ROUND(SUM(perf.TotalCombatScore) / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentACS,
    ROUND(AVG(perf.ACS), 1) AS MeanOfMapACS,
    ROUND((SUM(perf.TotalCombatScore) / NULLIF(SUM(perf.RoundsPlayed), 0)) - AVG(perf.ACS), 2) AS FormulaDelta
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
ORDER BY TournamentACS DESC;`,
    duckDbSql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    COUNT(DISTINCT perf.MatchID) AS MatchesPlayed,
    COUNT(perf.PerformanceID) AS MapsPlayed,
    SUM(perf.RoundsPlayed) AS TotalRounds,
    SUM(perf.TotalCombatScore) AS TotalCombatScore,
    ROUND(SUM(perf.TotalCombatScore)::FLOAT / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentACS,
    ROUND(AVG(perf.ACS), 1) AS MeanOfMapACS,
    ROUND((SUM(perf.TotalCombatScore)::FLOAT / NULLIF(SUM(perf.RoundsPlayed), 0)) - AVG(perf.ACS), 2) AS FormulaDelta
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
ORDER BY TournamentACS DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   80 |     6   (0) | 00:00:01 | Weighted Aggregation  |
|   1 |  SORT ORDER BY                |                          |   80 |     6  (15) | 00:00:01 | Order by ACS DESC     |
|   2 |   HASH GROUP BY               |                          |   80 |     5   (0) | 00:00:01 | Group by PlayerID     |
|   3 |    HASH JOIN                  |                          |   80 |     4   (0) | 00:00:01 | Join TEAM             |
|   4 |     HASH JOIN                 |                          |   80 |     3   (0) | 00:00:01 | Join PERFORMANCE      |
|   5 |      TABLE ACCESS FULL        | PLAYER                   |   80 |     2   (0) | 00:00:01 | Scans 80 Players      |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const players = data['PLAYER'] || [];
      const perfs = data['PLAYER_PERFORMANCE'] || [];
      const teams = data['TEAM'] || [];

      const rows = players
        .map((pl) => {
          const plPerfs = perfs.filter((p) => p.PlayerID === pl.PlayerID);
          if (plPerfs.length === 0) return null;
          const tm = teams.find((t) => t.TeamID === pl.TeamID);
          const distinctMatches = new Set(plPerfs.map((p) => p.MatchID)).size;
          const mapsCount = plPerfs.length;
          const totalRounds = plPerfs.reduce((s, p) => s + (Number(p.RoundsPlayed) || 0), 0);
          const totalCombatScore = plPerfs.reduce((s, p) => s + (Number(p.TotalCombatScore) || 0), 0);
          const tournamentAcs = totalRounds > 0 ? Math.round((totalCombatScore / totalRounds) * 10) / 10 : 0;
          const meanMapAcs = Math.round((plPerfs.reduce((s, p) => s + (Number(p.ACS) || 0), 0) / plPerfs.length) * 10) / 10;
          const delta = Math.round((tournamentAcs - meanMapAcs) * 100) / 100;

          return [
            pl.PlayerID,
            pl.PlayerName,
            tm ? tm.TeamName : 'Free Agent',
            pl.PlayerRole,
            distinctMatches,
            mapsCount,
            totalRounds,
            totalCombatScore,
            tournamentAcs,
            meanMapAcs,
            delta
          ];
        })
        .filter(Boolean)
        .sort((a, b) => Number(b![8]) - Number(a![8])) as any[][];

      return {
        columns: ['PlayerID', 'PlayerName', 'TeamName', 'Role', 'Matches', 'Maps', 'TotalRounds', 'TotalCombatScore', 'TournamentACS', 'MeanOfMapACS', 'FormulaDelta'],
        rows
      };
    }
  },
  {
    id: 'Q13',
    name: '13. Top 10 ACS Leaderboard (Endurance Threshold)',
    category: 'E. Advanced Metrics',
    featureTag: 'HAVING SUM(Rounds) >= 50',
    description: 'Filters elite fraggers by tournament sample size to prevent single-map skew. Formula: HAVING SUM(RoundsPlayed) >= 50 ORDER BY TournamentACS DESC.',
    sql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    SUM(perf.RoundsPlayed) AS TotalRounds,
    SUM(perf.Kills) AS TotalKills,
    SUM(perf.Deaths) AS TotalDeaths,
    ROUND(SUM(perf.Kills) / GREATEST(SUM(perf.Deaths), 1), 2) AS KD_Ratio,
    ROUND(SUM(perf.DamageDealt) / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS ADR,
    ROUND(SUM(perf.TotalCombatScore) / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentACS
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName
HAVING SUM(perf.RoundsPlayed) >= 50
ORDER BY TournamentACS DESC
FETCH FIRST 10 ROWS ONLY;`,
    duckDbSql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    SUM(perf.RoundsPlayed) AS TotalRounds,
    SUM(perf.Kills) AS TotalKills,
    SUM(perf.Deaths) AS TotalDeaths,
    ROUND(SUM(perf.Kills)::FLOAT / GREATEST(SUM(perf.Deaths), 1), 2) AS KD_Ratio,
    ROUND(SUM(perf.DamageDealt)::FLOAT / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS ADR,
    ROUND(SUM(perf.TotalCombatScore)::FLOAT / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentACS
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName
HAVING SUM(perf.RoundsPlayed) >= 50
ORDER BY TournamentACS DESC
LIMIT 10;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   10 |     5   (0) | 00:00:01 | Top-N Filter          |
|   1 |  COUNT STOPKEY                |                          |   10 |     5   (0) | 00:00:01 | Stop at 10 rows       |
|   2 |   FILTER                      |                          |   10 |     5   (0) | 00:00:01 | HAVING Rounds >= 50   |
|   3 |    HASH GROUP BY              |                          |   80 |     4   (0) | 00:00:01 | Group by Player       |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const players = data['PLAYER'] || [];
      const perfs = data['PLAYER_PERFORMANCE'] || [];
      const teams = data['TEAM'] || [];

      const rows = players
        .map((pl) => {
          const plPerfs = perfs.filter((p) => p.PlayerID === pl.PlayerID);
          const totalRounds = plPerfs.reduce((s, p) => s + (Number(p.RoundsPlayed) || 0), 0);
          if (totalRounds < 50) return null;

          const tm = teams.find((t) => t.TeamID === pl.TeamID);
          const kills = plPerfs.reduce((s, p) => s + (Number(p.Kills) || 0), 0);
          const deaths = plPerfs.reduce((s, p) => s + (Number(p.Deaths) || 0), 0);
          const damage = plPerfs.reduce((s, p) => s + (Number(p.DamageDealt) || 0), 0);
          const combatScore = plPerfs.reduce((s, p) => s + (Number(p.TotalCombatScore) || 0), 0);
          const acs = Math.round((combatScore / totalRounds) * 10) / 10;
          const adr = Math.round((damage / totalRounds) * 10) / 10;
          const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;

          return [
            pl.PlayerID,
            pl.PlayerName,
            tm ? tm.TeamName : 'Free Agent',
            totalRounds,
            kills,
            deaths,
            kd,
            adr,
            acs
          ];
        })
        .filter(Boolean)
        .sort((a, b) => Number(b![8]) - Number(a![8]))
        .slice(0, 10) as any[][];

      return {
        columns: ['PlayerID', 'PlayerName', 'TeamName', 'TotalRounds', 'Kills', 'Deaths', 'KD_Ratio', 'ADR', 'TournamentACS'],
        rows
      };
    }
  },
  {
    id: 'Q14',
    name: '14. Team Series & Round Differential Standings',
    category: 'E. Advanced Metrics',
    featureTag: 'STANDINGS MATH',
    description: 'Derives official team standings: Matches Won/Lost, Series Maps Won/Lost, and Round Differential from MATCH and MATCH_MAP.',
    sql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Country,
    COUNT(DISTINCT p.MatchID) AS MatchesPlayed,
    SUM(CASE WHEN p.Result = 'Win' THEN 1 ELSE 0 END) AS MatchesWon,
    SUM(CASE WHEN p.Result = 'Loss' THEN 1 ELSE 0 END) AS MatchesLost,
    SUM(p.TeamScore) AS MapsWon,
    ROUND(SUM(CASE WHEN p.Result = 'Win' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(DISTINCT p.MatchID), 0) * 100, 1) AS WinRatePct
FROM TEAM tm
JOIN TEAM_MATCH_PARTICIPATION p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Country
ORDER BY MatchesWon DESC, MapsWon DESC;`,
    duckDbSql: `SELECT 
    tm.TeamID,
    tm.TeamName,
    tm.Country,
    COUNT(DISTINCT p.MatchID) AS MatchesPlayed,
    SUM(CASE WHEN p.Result = 'Win' THEN 1 ELSE 0 END) AS MatchesWon,
    SUM(CASE WHEN p.Result = 'Loss' THEN 1 ELSE 0 END) AS MatchesLost,
    SUM(p.TeamScore) AS MapsWon,
    ROUND(SUM(CASE WHEN p.Result = 'Win' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(DISTINCT p.MatchID), 0) * 100, 1) AS WinRatePct
FROM TEAM tm
JOIN TEAM_MATCH_PARTICIPATION p ON tm.TeamID = p.TeamID
GROUP BY tm.TeamID, tm.TeamName, tm.Country
ORDER BY MatchesWon DESC, MapsWon DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   16 |     4   (0) | 00:00:01 | Standings Projection  |
|   1 |  SORT ORDER BY                |                          |   16 |     4  (20) | 00:00:01 | Wins & Maps Won DESC  |
|   2 |   HASH GROUP BY               |                          |   16 |     3   (0) | 00:00:01 | Group by Team         |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const teams = data['TEAM'] || [];
      const parts = data['TEAM_MATCH_PARTICIPATION'] || [];

      const rows = teams
        .map((tm) => {
          const tmParts = parts.filter((p) => p.TeamID === tm.TeamID);
          const matchesPlayed = tmParts.length;
          const wins = tmParts.filter((p) => p.Result === 'Win').length;
          const losses = tmParts.filter((p) => p.Result === 'Loss').length;
          const mapsWon = tmParts.reduce((s, p) => s + (Number(p.TeamScore) || 0), 0);
          const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 1000) / 10 : 0;

          return [
            tm.TeamID,
            tm.TeamName,
            tm.Country,
            matchesPlayed,
            wins,
            losses,
            mapsWon,
            `${winRate}%`
          ];
        })
        .sort((a, b) => Number(b[4]) - Number(a[4]) || Number(b[6]) - Number(a[6]));

      return {
        columns: ['TeamID', 'TeamName', 'Country', 'MatchesPlayed', 'MatchesWon', 'MatchesLost', 'MapsWon', 'WinRatePct'],
        rows
      };
    }
  },
  {
    id: 'Q15',
    name: '15. First-Kill (First Blood) Differential Leaders',
    category: 'E. Advanced Metrics',
    featureTag: 'FK - FD DIFFERENTIAL',
    description: 'Identifies elite opening duelists by calculating First Kills minus First Deaths across all map fixtures. Formula: FK_Diff = SUM(FirstKills) - SUM(FirstDeaths).',
    sql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    SUM(perf.RoundsPlayed) AS RoundsPlayed,
    SUM(perf.FirstKills) AS TotalFirstKills,
    SUM(perf.FirstDeaths) AS TotalFirstDeaths,
    (SUM(perf.FirstKills) - SUM(perf.FirstDeaths)) AS FirstKillDifferential,
    ROUND(SUM(perf.FirstKills) / NULLIF(SUM(perf.RoundsPlayed), 0), 2) AS FK_PerRound,
    ROUND(AVG(perf.ACS), 1) AS AvgACS
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
HAVING SUM(perf.FirstKills) > 0
ORDER BY FirstKillDifferential DESC, TotalFirstKills DESC;`,
    duckDbSql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    SUM(perf.RoundsPlayed) AS RoundsPlayed,
    SUM(perf.FirstKills) AS TotalFirstKills,
    SUM(perf.FirstDeaths) AS TotalFirstDeaths,
    (SUM(perf.FirstKills) - SUM(perf.FirstDeaths)) AS FirstKillDifferential,
    ROUND(SUM(perf.FirstKills)::FLOAT / NULLIF(SUM(perf.RoundsPlayed), 0), 2) AS FK_PerRound,
    ROUND(AVG(perf.ACS), 1) AS AvgACS
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
HAVING SUM(perf.FirstKills) > 0
ORDER BY FirstKillDifferential DESC, TotalFirstKills DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   30 |     5   (0) | 00:00:01 | Opening Duel Filter   |
|   1 |  SORT ORDER BY                |                          |   30 |     5  (20) | 00:00:01 | Order by FK_Diff DESC |
|   2 |   HASH GROUP BY               |                          |   30 |     4   (0) | 00:00:01 | Group by Player       |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const players = data['PLAYER'] || [];
      const perfs = data['PLAYER_PERFORMANCE'] || [];
      const teams = data['TEAM'] || [];

      const rows = players
        .map((pl) => {
          const plPerfs = perfs.filter((p) => p.PlayerID === pl.PlayerID);
          if (!plPerfs.length) return null;
          const fk = plPerfs.reduce((s, p) => s + (Number(p.FirstKills) || 0), 0);
          if (fk <= 0) return null;

          const tm = teams.find((t) => t.TeamID === pl.TeamID);
          const fd = plPerfs.reduce((s, p) => s + (Number(p.FirstDeaths) || 0), 0);
          const diff = fk - fd;
          const rounds = plPerfs.reduce((s, p) => s + (Number(p.RoundsPlayed) || 0), 0);
          const fkPerRound = rounds > 0 ? Math.round((fk / rounds) * 100) / 100 : 0;
          const avgAcs = Math.round((plPerfs.reduce((s, p) => s + (Number(p.ACS) || 0), 0) / plPerfs.length) * 10) / 10;

          return [
            pl.PlayerID,
            pl.PlayerName,
            tm ? tm.TeamName : 'Free Agent',
            pl.PlayerRole,
            rounds,
            fk,
            fd,
            diff,
            fkPerRound,
            avgAcs
          ];
        })
        .filter(Boolean)
        .sort((a, b) => Number(b![7]) - Number(a![7]) || Number(b![5]) - Number(a![5])) as any[][];

      return {
        columns: ['PlayerID', 'PlayerName', 'TeamName', 'Role', 'RoundsPlayed', 'TotalFirstKills', 'TotalFirstDeaths', 'FirstKillDifferential', 'FK_PerRound', 'AvgACS'],
        rows
      };
    }
  },
  {
    id: 'Q16',
    name: '16. ArenaDB Impact Index Leaderboard',
    category: 'E. Advanced Metrics',
    featureTag: 'WEIGHTED MULTI-FACTOR INDEX',
    description: 'Ranks competitors by ArenaDB\'s proprietary multi-factor Impact Index: 0.40*(ACS/250) + 0.20*(ADR/150) + 0.15*(KAST/75) + 0.15*(KD/1.0) + 0.10*(1 + FK_diff*0.15).',
    sql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    ROUND(AVG(perf.ImpactIndex), 2) AS MeanImpactIndex,
    ROUND(SUM(perf.TotalCombatScore) / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentACS,
    ROUND(SUM(perf.DamageDealt) / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentADR,
    ROUND(AVG(perf.KASTPct), 1) AS AvgKASTPct,
    ROUND(SUM(perf.Kills) / GREATEST(SUM(perf.Deaths), 1), 2) AS TournamentKD,
    (SUM(perf.FirstKills) - SUM(perf.FirstDeaths)) AS NetFirstBloods
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
ORDER BY MeanImpactIndex DESC;`,
    duckDbSql: `SELECT 
    p.PlayerID,
    p.PlayerName,
    tm.TeamName,
    p.PlayerRole,
    ROUND(AVG(perf.ImpactIndex), 2) AS MeanImpactIndex,
    ROUND(SUM(perf.TotalCombatScore)::FLOAT / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentACS,
    ROUND(SUM(perf.DamageDealt)::FLOAT / NULLIF(SUM(perf.RoundsPlayed), 0), 1) AS TournamentADR,
    ROUND(AVG(perf.KASTPct), 1) AS AvgKASTPct,
    ROUND(SUM(perf.Kills)::FLOAT / GREATEST(SUM(perf.Deaths), 1), 2) AS TournamentKD,
    (SUM(perf.FirstKills) - SUM(perf.FirstDeaths)) AS NetFirstBloods
FROM PLAYER p
JOIN PLAYER_PERFORMANCE perf ON p.PlayerID = perf.PlayerID
JOIN TEAM tm ON p.TeamID = tm.TeamID
GROUP BY p.PlayerID, p.PlayerName, tm.TeamName, p.PlayerRole
ORDER BY MeanImpactIndex DESC;`,
    explainPlan: `-----------------------------------------------------------------------------------------------------------------
| Id  | Operation                     | Name                     | Rows | Cost (%CPU) | Time     | Predicates / Pipeline |
-----------------------------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT              |                          |   80 |     5   (0) | 00:00:01 | Multi-Factor Composite|
|   1 |  SORT ORDER BY                |                          |   80 |     5  (20) | 00:00:01 | Order by Impact DESC  |
|   2 |   HASH GROUP BY               |                          |   80 |     4   (0) | 00:00:01 | Group by Player       |
-----------------------------------------------------------------------------------------------------------------`,
    run: (data) => {
      const players = data['PLAYER'] || [];
      const perfs = data['PLAYER_PERFORMANCE'] || [];
      const teams = data['TEAM'] || [];

      const rows = players
        .map((pl) => {
          const plPerfs = perfs.filter((p) => p.PlayerID === pl.PlayerID);
          if (!plPerfs.length) return null;
          const tm = teams.find((t) => t.TeamID === pl.TeamID);

          const totalRounds = plPerfs.reduce((s, p) => s + (Number(p.RoundsPlayed) || 0), 0);
          const totalCombatScore = plPerfs.reduce((s, p) => s + (Number(p.TotalCombatScore) || 0), 0);
          const totalDamage = plPerfs.reduce((s, p) => s + (Number(p.DamageDealt) || 0), 0);
          const kills = plPerfs.reduce((s, p) => s + (Number(p.Kills) || 0), 0);
          const deaths = plPerfs.reduce((s, p) => s + (Number(p.Deaths) || 0), 0);
          const fk = plPerfs.reduce((s, p) => s + (Number(p.FirstKills) || 0), 0);
          const fd = plPerfs.reduce((s, p) => s + (Number(p.FirstDeaths) || 0), 0);

          const meanImpact = Math.round((plPerfs.reduce((s, p) => s + (Number(p.ImpactIndex) || 1.0), 0) / plPerfs.length) * 100) / 100;
          const tournamentAcs = totalRounds > 0 ? Math.round((totalCombatScore / totalRounds) * 10) / 10 : 0;
          const tournamentAdr = totalRounds > 0 ? Math.round((totalDamage / totalRounds) * 10) / 10 : 0;
          const avgKast = Math.round((plPerfs.reduce((s, p) => s + (Number(p.KASTPct) || 75), 0) / plPerfs.length) * 10) / 10;
          const tournamentKd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
          const netFirstBloods = fk - fd;

          return [
            pl.PlayerID,
            pl.PlayerName,
            tm ? tm.TeamName : 'Free Agent',
            pl.PlayerRole,
            meanImpact,
            tournamentAcs,
            tournamentAdr,
            `${avgKast}%`,
            tournamentKd,
            netFirstBloods
          ];
        })
        .filter(Boolean)
        .sort((a, b) => Number(b![4]) - Number(a![4])) as any[][];

      return {
        columns: ['PlayerID', 'PlayerName', 'TeamName', 'Role', 'MeanImpactIndex', 'TournamentACS', 'TournamentADR', 'AvgKASTPct', 'TournamentKD', 'NetFirstBloods'],
        rows
      };
    }
  }
];
