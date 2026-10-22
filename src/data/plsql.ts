export type ProgramType = 'block' | 'procedure' | 'function';

export interface PlSqlItem {
  id: string;
  name: string;
  type: ProgramType;
  title: string;
  description: string;
  sourceCode: (params: any) => string;
  defaultParams: Record<string, any>;
  execute: (
    params: any,
    tableData: Record<string, any[]>,
    onInsertRow: (tableId: string, row: any) => void,
    onUpdateRow: (tableId: string, primaryKeyValue: string, updatedFields: Record<string, any>) => void
  ) => { output: string[]; error?: string; returnVal?: any };
}

export const PLSQL_PROGRAMS: PlSqlItem[] = [
  {
    id: 'block_1',
    name: 'Block 1: Player Telemetry & Ranking',
    type: 'block',
    title: 'Anonymous Block: Player Profile & Metrics',
    description: 'Queries player metadata, joins their assigned team ranking, and counts individual match appearances in PLAYER_PERFORMANCE.',
    defaultParams: { playerId: 'P01' },
    sourceCode: (p) => `DECLARE
    v_player_id     PLAYER.PlayerID%TYPE := '${p.playerId}';
    v_player_name   PLAYER.PlayerName%TYPE;
    v_country       PLAYER.Country%TYPE;
    v_role          PLAYER.PlayerRole%TYPE;
    v_team_name     TEAM.TeamName%TYPE;
    v_ranking       TEAM.Ranking%TYPE;
    v_matches_played NUMBER := 0;
BEGIN
    -- Query player details joined with team metadata
    SELECT p.PlayerName, p.Country, p.PlayerRole, t.TeamName, t.Ranking
    INTO   v_player_name, v_country, v_role, v_team_name, v_ranking
    FROM   PLAYER p
    JOIN   TEAM t ON p.TeamID = t.TeamID
    WHERE  p.PlayerID = v_player_id;

    -- Compute total matches played by the specific player
    SELECT COUNT(DISTINCT MatchID)
    INTO   v_matches_played
    FROM   PLAYER_PERFORMANCE
    WHERE  PlayerID = v_player_id;

    DBMS_OUTPUT.PUT_LINE('--------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('ESPORTS PLAYER DOSSIER: ' || v_player_id);
    DBMS_OUTPUT.PUT_LINE('--------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('Handle:          ' || v_player_name);
    DBMS_OUTPUT.PUT_LINE('Country:         ' || v_country);
    DBMS_OUTPUT.PUT_LINE('Tactical Role:   ' || v_role);
    DBMS_OUTPUT.PUT_LINE('Affiliated Team: ' || v_team_name || ' (World Rank #' || v_ranking || ')');
    DBMS_OUTPUT.PUT_LINE('Telemetry Matches Played: ' || v_matches_played);
    DBMS_OUTPUT.PUT_LINE('--------------------------------------------------');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('ORA-01403: no data found for PlayerID: ' || v_player_id);
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ORA-' || SQLCODE || ': ' || SQLERRM);
END;`,
    execute: (p, db) => {
      const player = (db.PLAYER || []).find((r) => r.PlayerID === p.playerId);
      if (!player) {
        return {
          output: [`ORA-01403: no data found for PlayerID: ${p.playerId}`],
          error: `ORA-01403: no data found`
        };
      }
      const team = (db.TEAM || []).find((t) => t.TeamID === player.TeamID);
      const performances = (db.PLAYER_PERFORMANCE || []).filter((perf) => perf.PlayerID === p.playerId);
      const matchesCount = new Set(performances.map((perf) => perf.MatchID)).size;

      return {
        output: [
          '--------------------------------------------------',
          `ESPORTS PLAYER DOSSIER: ${player.PlayerID}`,
          '--------------------------------------------------',
          `Handle:          ${player.PlayerName}`,
          `Country:         ${player.Country}`,
          `Tactical Role:   ${player.PlayerRole}`,
          `Affiliated Team: ${team ? team.TeamName : 'Free Agent'} (World Rank #${team ? team.Ranking : 'N/A'})`,
          `Telemetry Matches Played: ${matchesCount}`,
          '--------------------------------------------------',
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  },
  {
    id: 'block_2',
    name: 'Block 2: Player Average Combat Score',
    type: 'block',
    title: 'Anonymous Block: Scoring Aggregations',
    description: 'Calculates the historical average combat score, max score, and total frag contributions for a selected competitor.',
    defaultParams: { playerId: 'P01' },
    sourceCode: (p) => `DECLARE
    v_player_id     PLAYER.PlayerID%TYPE := '${p.playerId}';
    v_player_name   PLAYER.PlayerName%TYPE;
    v_avg_score     NUMBER(6,2);
    v_max_score     NUMBER(6);
    v_total_kills   NUMBER(6);
    v_total_deaths  NUMBER(6);
    v_kd_ratio      NUMBER(4,2);
BEGIN
    SELECT PlayerName INTO v_player_name FROM PLAYER WHERE PlayerID = v_player_id;

    SELECT ROUND(AVG(Score), 2), MAX(Score), SUM(Kills), SUM(Deaths)
    INTO   v_avg_score, v_max_score, v_total_kills, v_total_deaths
    FROM   PLAYER_PERFORMANCE
    WHERE  PlayerID = v_player_id;

    IF v_total_deaths = 0 THEN
        v_kd_ratio := v_total_kills;
    ELSE
        v_kd_ratio := ROUND(v_total_kills / v_total_deaths, 2);
    END IF;

    DBMS_OUTPUT.PUT_LINE('=== COMBAT TELEMETRY REPORT: ' || v_player_name || ' (' || v_player_id || ') ===');
    DBMS_OUTPUT.PUT_LINE('Mean Match Score: ' || NVL(TO_CHAR(v_avg_score), 'N/A'));
    DBMS_OUTPUT.PUT_LINE('Peak Career Frag: ' || NVL(TO_CHAR(v_max_score), 'N/A'));
    DBMS_OUTPUT.PUT_LINE('Total Kills:      ' || NVL(TO_CHAR(v_total_kills), '0'));
    DBMS_OUTPUT.PUT_LINE('Total Deaths:     ' || NVL(TO_CHAR(v_total_deaths), '0'));
    DBMS_OUTPUT.PUT_LINE('Aggregate K/D:    ' || NVL(TO_CHAR(v_kd_ratio), 'N/A'));
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('ORA-01403: no performance data located.');
END;`,
    execute: (p, db) => {
      const player = (db.PLAYER || []).find((r) => r.PlayerID === p.playerId);
      if (!player) {
        return { output: [`ORA-01403: Player ${p.playerId} not found.`], error: 'ORA-01403' };
      }
      const perfs = (db.PLAYER_PERFORMANCE || []).filter((r) => r.PlayerID === p.playerId);
      if (perfs.length === 0) {
        return {
          output: [
            `=== COMBAT TELEMETRY REPORT: ${player.PlayerName} (${player.PlayerID}) ===`,
            'Mean Match Score: N/A (0 matches recorded)',
            'PL/SQL procedure successfully completed.'
          ]
        };
      }
      const avgScore = (perfs.reduce((acc, c) => acc + (c.Score || 0), 0) / perfs.length).toFixed(2);
      const maxScore = Math.max(...perfs.map((c) => c.Score || 0));
      const totalKills = perfs.reduce((acc, c) => acc + (c.Kills || 0), 0);
      const totalDeaths = perfs.reduce((acc, c) => acc + (c.Deaths || 0), 0);
      const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);

      return {
        output: [
          `=== COMBAT TELEMETRY REPORT: ${player.PlayerName} (${player.PlayerID}) ===`,
          `Mean Match Score: ${avgScore}`,
          `Peak Career Frag: ${maxScore}`,
          `Total Kills:      ${totalKills}`,
          `Total Deaths:     ${totalDeaths}`,
          `Aggregate K/D:    ${kdRatio}`,
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  },
  {
    id: 'block_3',
    name: 'Block 3: Performance Tier Classification (ACS)',
    type: 'block',
    title: 'Conditional Branching: IF-ELSIF-ELSE ACS Tier Evaluation',
    description: 'Evaluates player true tournament ACS across strict performance brackets (<150 LOW, 150-250 MODERATE, 251-350 HIGH, >350 EXCELLENT) with zero range gaps.',
    defaultParams: { playerId: 'P01' },
    sourceCode: (p) => `DECLARE
    v_player_id      PLAYER.PlayerID%TYPE := '${p.playerId}';
    v_player_name    PLAYER.PlayerName%TYPE;
    v_tot_score      NUMBER(8) := 0;
    v_tot_rounds     NUMBER(6) := 0;
    v_tournament_acs NUMBER(6,1) := 0;
    v_tier           VARCHAR2(20);
    v_assessment     VARCHAR2(100);
BEGIN
    SELECT PlayerName INTO v_player_name FROM PLAYER WHERE PlayerID = v_player_id;

    -- Aggregate combat telemetry for true tournament ACS
    SELECT NVL(SUM(TotalCombatScore), 0), NVL(SUM(RoundsPlayed), 0)
    INTO   v_tot_score, v_tot_rounds
    FROM   PLAYER_PERFORMANCE
    WHERE  PlayerID = v_player_id;

    IF v_tot_rounds > 0 THEN
        v_tournament_acs := ROUND(v_tot_score / v_tot_rounds, 1);
    ELSE
        SELECT NVL(AVG(Score), 0) INTO v_tournament_acs
        FROM PLAYER_PERFORMANCE WHERE PlayerID = v_player_id;
    END IF;

    -- Strict non-overlapping ACS tier classification
    IF v_tournament_acs < 150 THEN
        v_tier := 'LOW';
        v_assessment := 'Below competitive benchmark; struggle in impact and mechanical duels.';
    ELSIF v_tournament_acs <= 250 THEN
        v_tier := 'MODERATE';
        v_assessment := 'Solid tactical baseline; consistent trades and site execution support.';
    ELSIF v_tournament_acs <= 350 THEN
        v_tier := 'HIGH';
        v_assessment := 'Premier carry tier; star duelist/initiator frequent multi-frag round winner.';
    ELSE
        v_tier := 'EXCELLENT';
        v_assessment := 'All-Tournament MVP candidate; historic frag output and round conversion.';
    END IF;

    DBMS_OUTPUT.PUT_LINE('>>> ACS TIER EVALUATION MATRIX <<<');
    DBMS_OUTPUT.PUT_LINE('Player:           ' || v_player_name || ' (' || v_player_id || ')');
    DBMS_OUTPUT.PUT_LINE('Rounds Logged:    ' || v_tot_rounds);
    DBMS_OUTPUT.PUT_LINE('Tournament ACS:   ' || TO_CHAR(v_tournament_acs, '990.9'));
    DBMS_OUTPUT.PUT_LINE('Assigned Bracket: [' || v_tier || ']');
    DBMS_OUTPUT.PUT_LINE('Directives:       ' || v_assessment);
END;`,
    execute: (p, db) => {
      const player = (db.PLAYER || []).find((r) => r.PlayerID === p.playerId);
      if (!player) return { output: [`ORA-01403: Player ${p.playerId} not found.`], error: 'ORA-01403' };

      const perfs = (db.PLAYER_PERFORMANCE || []).filter((r) => r.PlayerID === p.playerId);
      const totalScore = perfs.reduce((acc, c) => acc + (c.TotalCombatScore ?? c.Score ?? 0), 0);
      const totalRounds = perfs.reduce((acc, c) => acc + (c.RoundsPlayed ?? 0), 0);
      const tournamentAcs = totalRounds > 0 
        ? Math.round((totalScore / totalRounds) * 10) / 10
        : (perfs.length > 0 ? perfs.reduce((acc, c) => acc + (c.Score || 0), 0) / perfs.length : 0);

      let tier = 'EXCELLENT';
      let assessment = 'All-Tournament MVP candidate; historic frag output and round conversion.';
      if (tournamentAcs < 150) {
        tier = 'LOW';
        assessment = 'Below competitive benchmark; struggle in impact and mechanical duels.';
      } else if (tournamentAcs <= 250) {
        tier = 'MODERATE';
        assessment = 'Solid tactical baseline; consistent trades and site execution support.';
      } else if (tournamentAcs <= 350) {
        tier = 'HIGH';
        assessment = 'Premier carry tier; star duelist/initiator frequent multi-frag round winner.';
      }

      return {
        output: [
          '>>> ACS TIER EVALUATION MATRIX <<<',
          `Player:           ${player.PlayerName} (${player.PlayerID})`,
          `Rounds Logged:    ${totalRounds}`,
          `Tournament ACS:   ${tournamentAcs.toFixed(1)}`,
          `Assigned Bracket: [${tier}]`,
          `Directives:       ${assessment}`,
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  },
  {
    id: 'block_4',
    name: 'Block 4: Team Roster Cursor Loop',
    type: 'block',
    title: 'Explicit Cursor: Loop Over Team Roster',
    description: 'Iterates through each athlete on a team using a PL/SQL cursor loop, displaying role, substitute status, and performance count.',
    defaultParams: { teamId: 'TM01' },
    sourceCode: (p) => `DECLARE
    v_team_id   TEAM.TeamID%TYPE := '${p.teamId}';
    v_team_name TEAM.TeamName%TYPE;
    v_counter   NUMBER := 0;

    CURSOR cur_roster IS
        SELECT p.PlayerID, p.PlayerName, p.PlayerRole, p.IsSubstitute,
               (SELECT COUNT(*) FROM PLAYER_PERFORMANCE pp WHERE pp.PlayerID = p.PlayerID) AS MatchCount
        FROM   PLAYER p
        WHERE  p.TeamID = v_team_id
        ORDER BY p.IsSubstitute ASC, p.PlayerName ASC;
BEGIN
    SELECT TeamName INTO v_team_name FROM TEAM WHERE TeamID = v_team_id;

    DBMS_OUTPUT.PUT_LINE('====================================================');
    DBMS_OUTPUT.PUT_LINE('ACTIVE ROSTER DIRECTORY FOR TEAM: ' || v_team_name);
    DBMS_OUTPUT.PUT_LINE('====================================================');

    FOR rec IN cur_roster LOOP
        v_counter := v_counter + 1;
        DBMS_OUTPUT.PUT_LINE(
            '#' || LPAD(v_counter, 2, '0') || ' | ' ||
            RPAD(rec.PlayerID, 5) || ' | ' ||
            RPAD(rec.PlayerName, 14) || ' | ' ||
            RPAD(rec.PlayerRole, 12) || ' | ' ||
            CASE WHEN rec.IsSubstitute = 1 THEN '[BENCH] ' ELSE '[STARTER]' END ||
            ' | Matches: ' || rec.MatchCount
        );
    END LOOP;

    DBMS_OUTPUT.PUT_LINE('====================================================');
    DBMS_OUTPUT.PUT_LINE('Total Active Registered Athletes: ' || v_counter);
END;`,
    execute: (p, db) => {
      const team = (db.TEAM || []).find((t) => t.TeamID === p.teamId);
      if (!team) return { output: [`ORA-01403: Team ${p.teamId} not found.`], error: 'ORA-01403' };

      const players = (db.PLAYER || []).filter((r) => r.TeamID === p.teamId);
      const out = [
        '====================================================',
        `ACTIVE ROSTER DIRECTORY FOR TEAM: ${team.TeamName}`,
        '===================================================='
      ];

      let counter = 0;
      players.forEach((pl) => {
        counter++;
        const matchCount = (db.PLAYER_PERFORMANCE || []).filter((pp) => pp.PlayerID === pl.PlayerID).length;
        const status = pl.IsSubstitute === 1 ? '[BENCH] ' : '[STARTER]';
        out.push(
          `#${String(counter).padStart(2, '0')} | ${pl.PlayerID.padEnd(5)} | ${pl.PlayerName.padEnd(14)} | ${pl.PlayerRole.padEnd(12)} | ${status} | Matches: ${matchCount}`
        );
      });

      out.push('====================================================');
      out.push(`Total Active Registered Athletes: ${counter}`);
      out.push('PL/SQL procedure successfully completed.');

      return { output: out };
    }
  },
  {
    id: 'proc_register_player',
    name: 'Procedure: Register_Player',
    type: 'procedure',
    title: 'Stored Procedure: Register_Player',
    description: 'Registers a new player into PLAYER table with strict validation of foreign keys (TeamID) and primary key collision checks.',
    defaultParams: {
      playerName: 'Valkyrie',
      playerCountry: 'Norway',
      teamId: 'TM01',
      playerRole: 'Sentinel',
      isSubstitute: 0
    },
    sourceCode: (p) => `CREATE OR REPLACE PROCEDURE Register_Player(
    p_player_name   IN PLAYER.PlayerName%TYPE := '${p.playerName}',
    p_country       IN PLAYER.Country%TYPE := '${p.playerCountry}',
    p_team_id       IN PLAYER.TeamID%TYPE := '${p.teamId}',
    p_player_role   IN PLAYER.PlayerRole%TYPE := '${p.playerRole}',
    p_is_substitute IN PLAYER.IsSubstitute%TYPE := ${p.isSubstitute}
) IS
    v_new_id    PLAYER.PlayerID%TYPE;
    v_max_num   NUMBER;
    v_team_chk  NUMBER;
BEGIN
    -- Verify foreign key existence
    SELECT COUNT(*) INTO v_team_chk FROM TEAM WHERE TeamID = p_team_id;
    IF v_team_chk = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'ORA-02291: integrity constraint violated - parent key not found for TeamID: ' || p_team_id);
    END IF;

    -- Generate surrogate sequential PlayerID
    SELECT NVL(MAX(TO_NUMBER(SUBSTR(PlayerID, 2))), 0) + 1 INTO v_max_num FROM PLAYER;
    v_new_id := 'P' || LPAD(v_max_num, 2, '0');

    INSERT INTO PLAYER (PlayerID, PlayerName, Country, TeamID, PlayerRole, IsSubstitute)
    VALUES (v_new_id, p_player_name, p_country, p_team_id, p_player_role, p_is_substitute);

    DBMS_OUTPUT.PUT_LINE('ORA-SUCCESS: Player registered successfully.');
    DBMS_OUTPUT.PUT_LINE('Generated PlayerID: ' || v_new_id || ' | Handle: ' || p_player_name || ' | Team: ' || p_team_id);
END;`,
    execute: (p, db, onInsert) => {
      const teamExists = (db.TEAM || []).some((t) => t.TeamID === p.teamId);
      if (!teamExists) {
        return {
          output: [`ORA-02291: integrity constraint violated - parent key not found for TeamID: ${p.teamId}`],
          error: 'ORA-02291'
        };
      }

      let maxNum = 0;
      (db.PLAYER || []).forEach((row) => {
        const val = String(row.PlayerID || '');
        if (val.startsWith('P')) {
          const num = parseInt(val.substring(1), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const newId = `P${String(maxNum + 1).padStart(2, '0')}`;

      const newRow = {
        PlayerID: newId,
        PlayerName: p.playerName || 'NewPlayer',
        Country: p.playerCountry || 'Global',
        TeamID: p.teamId,
        PlayerRole: p.playerRole || 'Flex',
        IsSubstitute: Number(p.isSubstitute) || 0
      };

      onInsert('PLAYER', newRow);

      return {
        output: [
          'ORA-SUCCESS: Player registered successfully.',
          `Generated PlayerID: ${newId} | Handle: ${newRow.PlayerName} | Team: ${newRow.TeamID} | Role: ${newRow.PlayerRole}`,
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  },
  {
    id: 'proc_schedule_match',
    name: 'Procedure: Schedule_Match',
    type: 'procedure',
    title: 'Stored Procedure: Schedule_Match',
    description: 'Atomically creates a MATCH record and 2 participating TEAM_MATCH_PARTICIPATION records with stage and referee integrity verification.',
    defaultParams: {
      stageId: 'STG03',
      gameId: 'G01',
      refereeId: 'REF01',
      team1Id: 'TM01',
      team2Id: 'TM02'
    },
    sourceCode: (p) => `CREATE OR REPLACE PROCEDURE Schedule_Match(
    p_stage_id    IN MATCH.StageID%TYPE := '${p.stageId}',
    p_game_id     IN MATCH.GameID%TYPE := '${p.gameId}',
    p_referee_id  IN MATCH.RefereeID%TYPE := '${p.refereeId}',
    p_team1_id    IN TEAM.TeamID%TYPE := '${p.team1Id}',
    p_team2_id    IN TEAM.TeamID%TYPE := '${p.team2Id}'
) IS
    v_match_id    MATCH.MatchID%TYPE;
    v_max_num     NUMBER;
    v_chk_stage   NUMBER;
    v_chk_game    NUMBER;
    v_chk_ref     NUMBER;
BEGIN
    IF p_team1_id = p_team2_id THEN
        RAISE_APPLICATION_ERROR(-20002, 'ORA-20002: Opposing teams must be distinct.');
    END IF;

    -- FK validations
    SELECT COUNT(*) INTO v_chk_stage FROM TOURNAMENT_STAGE WHERE StageID = p_stage_id;
    SELECT COUNT(*) INTO v_chk_game FROM GAME WHERE GameID = p_game_id;
    SELECT COUNT(*) INTO v_chk_ref FROM REFEREE WHERE RefereeID = p_referee_id;

    IF v_chk_stage = 0 OR v_chk_game = 0 OR v_chk_ref = 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'ORA-02291: Foreign key constraint failed on Stage, Game, or Referee.');
    END IF;

    -- Generate Next MatchID
    SELECT NVL(MAX(TO_NUMBER(SUBSTR(MatchID, 2))), 0) + 1 INTO v_max_num FROM MATCH;
    v_match_id := 'M' || LPAD(v_max_num, 2, '0');

    -- Insert Match
    INSERT INTO MATCH (MatchID, StageID, GameID, MatchDate, MatchTime, MatchResult, MatchStatus, RefereeID)
    VALUES (v_match_id, p_stage_id, p_game_id, TO_CHAR(SYSDATE, 'YYYY-MM-DD'), '20:00', 'TBD', 'Scheduled', p_referee_id);

    -- Insert Team Participations
    INSERT INTO TEAM_MATCH_PARTICIPATION (MatchID, TeamID, Result, TeamScore)
    VALUES (v_match_id, p_team1_id, 'Pending', 0);

    INSERT INTO TEAM_MATCH_PARTICIPATION (MatchID, Team2_id, Result, TeamScore)
    VALUES (v_match_id, p_team2_id, 'Pending', 0);

    DBMS_OUTPUT.PUT_LINE('Match scheduled: ' || v_match_id || ' (' || p_team1_id || ' vs ' || p_team2_id || ')');
    COMMIT;
END;`,
    execute: (p, db, onInsert) => {
      if (p.team1Id === p.team2Id) {
        return { output: ['ORA-20002: Opposing teams must be distinct.'], error: 'ORA-20002' };
      }
      const stageExists = (db.TOURNAMENT_STAGE || []).some((s) => s.StageID === p.stageId);
      const gameExists = (db.GAME || []).some((g) => g.GameID === p.gameId);
      const refExists = (db.REFEREE || []).some((r) => r.RefereeID === p.refereeId);
      if (!stageExists || !gameExists || !refExists) {
        return { output: ['ORA-02291: Foreign key constraint failed on Stage, Game, or Referee.'], error: 'ORA-02291' };
      }

      let maxNum = 0;
      (db.MATCH || []).forEach((row) => {
        const val = String(row.MatchID || '');
        if (val.startsWith('M')) {
          const num = parseInt(val.substring(1), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const newMatchId = `M${String(maxNum + 1).padStart(2, '0')}`;

      onInsert('MATCH', {
        MatchID: newMatchId,
        StageID: p.stageId,
        GameID: p.gameId,
        MatchDate: new Date().toISOString().split('T')[0],
        MatchTime: '20:00',
        MatchResult: 'TBD',
        MatchStatus: 'Scheduled',
        RefereeID: p.refereeId
      });

      onInsert('TEAM_MATCH_PARTICIPATION', {
        MatchID: newMatchId,
        TeamID: p.team1Id,
        Result: 'Pending',
        TeamScore: 0
      });

      onInsert('TEAM_MATCH_PARTICIPATION', {
        MatchID: newMatchId,
        TeamID: p.team2Id,
        Result: 'Pending',
        TeamScore: 0
      });

      return {
        output: [
          `ORA-SUCCESS: Scheduled Match ${newMatchId}`,
          `Stage: ${p.stageId} | Referee: ${p.refereeId}`,
          `Matchup: Team ${p.team1Id} vs Team ${p.team2Id}`,
          'Created 1 MATCH row and 2 TEAM_MATCH_PARTICIPATION rows.',
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  },
  {
    id: 'proc_record_perf',
    name: 'Procedure: Record_Player_Performance',
    type: 'procedure',
    title: 'Stored Procedure: Record_Player_Performance',
    description: 'Inserts high-resolution telemetry data for a player in a specific match, logging kills, deaths, assists, latency, and tactical score.',
    defaultParams: {
      playerId: 'P01',
      matchId: 'M01',
      score: 340,
      kills: 26,
      assists: 9,
      deaths: 7,
      equipmentId: 'EQ01',
      latency: 18
    },
    sourceCode: (p) => `CREATE OR REPLACE PROCEDURE Record_Player_Performance(
    p_player_id     IN PLAYER_PERFORMANCE.PlayerID%TYPE := '${p.playerId}',
    p_match_id      IN PLAYER_PERFORMANCE.MatchID%TYPE := '${p.matchId}',
    p_score         IN PLAYER_PERFORMANCE.Score%TYPE := ${p.score},
    p_kills         IN PLAYER_PERFORMANCE.Kills%TYPE := ${p.kills},
    p_assists       IN PLAYER_PERFORMANCE.Assists%TYPE := ${p.assists},
    p_deaths        IN PLAYER_PERFORMANCE.Deaths%TYPE := ${p.deaths},
    p_equipment_id  IN PLAYER_PERFORMANCE.EquipmentID%TYPE := '${p.equipmentId}',
    p_latency       IN PLAYER_PERFORMANCE.InternetLatencyMs%TYPE := ${p.latency}
) IS
    v_perf_id   PLAYER_PERFORMANCE.PerformanceID%TYPE;
    v_max_num   NUMBER;
BEGIN
    SELECT NVL(MAX(TO_NUMBER(SUBSTR(PerformanceID, 4))), 0) + 1 INTO v_max_num FROM PLAYER_PERFORMANCE;
    v_perf_id := 'PER' || LPAD(v_max_num, 2, '0');

    INSERT INTO PLAYER_PERFORMANCE (
        PerformanceID, PlayerID, MatchID, Score, Kills, Assists, Deaths,
        EquipmentID, InternetLatencyMs, GameplayAnalytics
    ) VALUES (
        v_perf_id, p_player_id, p_match_id, p_score, p_kills, p_assists, p_deaths,
        p_equipment_id, p_latency, 'Logged via PL/SQL Engine'
    );

    DBMS_OUTPUT.PUT_LINE('Performance record committed: ' || v_perf_id || ' for Player ' || p_player_id);
END;`,
    execute: (p, db, onInsert) => {
      let maxNum = 0;
      (db.PLAYER_PERFORMANCE || []).forEach((row) => {
        const val = String(row.PerformanceID || '');
        if (val.startsWith('PER')) {
          const num = parseInt(val.substring(3), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const newId = `PER${String(maxNum + 1).padStart(2, '0')}`;

      onInsert('PLAYER_PERFORMANCE', {
        PerformanceID: newId,
        PlayerID: p.playerId,
        MatchID: p.matchId,
        Score: Number(p.score) || 200,
        Kills: Number(p.kills) || 0,
        Assists: Number(p.assists) || 0,
        Deaths: Number(p.deaths) || 0,
        EquipmentID: p.equipmentId,
        InternetLatencyMs: Number(p.latency) || 20,
        GameplayAnalytics: 'Logged via PL/SQL Engine'
      });

      return {
        output: [
          `ORA-SUCCESS: Performance record committed: ${newId}`,
          `Player: ${p.playerId} | Match: ${p.matchId} | Score: ${p.score} | Latency: ${p.latency}ms`,
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  },
  {
    id: 'proc_record_action',
    name: 'Procedure: Record_Disciplinary_Action',
    type: 'procedure',
    title: 'Stored Procedure: Record_Disciplinary_Action',
    description: 'Records an official disciplinary sanction against either a player or team, enforcing the constraint that at least one entity is specified.',
    defaultParams: {
      playerId: 'P03',
      matchId: 'M01',
      actionType: 'Fine',
      penalty: '$1,500 Fine for Unsportsmanlike Conduct'
    },
    sourceCode: (p) => `CREATE OR REPLACE PROCEDURE Record_Disciplinary_Action(
    p_player_id   IN DISCIPLINARY_ACTION.PlayerID%TYPE := '${p.playerId}',
    p_team_id     IN DISCIPLINARY_ACTION.TeamID%TYPE := NULL,
    p_match_id    IN DISCIPLINARY_ACTION.MatchID%TYPE := '${p.matchId}',
    p_action_type IN DISCIPLINARY_ACTION.ActionType%TYPE := '${p.actionType}',
    p_penalty     IN DISCIPLINARY_ACTION.Penalty%TYPE := '${p.penalty}'
) IS
    v_action_id DISCIPLINARY_ACTION.ActionID%TYPE;
    v_max_num   NUMBER;
BEGIN
    IF p_player_id IS NULL AND p_team_id IS NULL THEN
        RAISE_APPLICATION_ERROR(-20005, 'ORA-20005: Sanction requires either PlayerID or TeamID to be non-null.');
    END IF;

    SELECT NVL(MAX(TO_NUMBER(SUBSTR(ActionID, 3))), 0) + 1 INTO v_max_num FROM DISCIPLINARY_ACTION;
    v_action_id := 'DA' || LPAD(v_max_num, 2, '0');

    INSERT INTO DISCIPLINARY_ACTION (ActionID, PlayerID, TeamID, MatchID, ActionType, Penalty, ActionDate)
    VALUES (v_action_id, p_player_id, p_team_id, p_match_id, p_action_type, p_penalty, TO_CHAR(SYSDATE, 'YYYY-MM-DD'));

    DBMS_OUTPUT.PUT_LINE('Disciplinary Sanction ' || v_action_id || ' recorded for Match ' || p_match_id);
END;`,
    execute: (p, db, onInsert) => {
      let maxNum = 0;
      (db.DISCIPLINARY_ACTION || []).forEach((row) => {
        const val = String(row.ActionID || '');
        if (val.startsWith('DA')) {
          const num = parseInt(val.substring(2), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const newId = `DA${String(maxNum + 1).padStart(2, '0')}`;

      onInsert('DISCIPLINARY_ACTION', {
        ActionID: newId,
        PlayerID: p.playerId || null,
        TeamID: p.teamId || null,
        MatchID: p.matchId,
        ActionType: p.actionType,
        Penalty: p.penalty,
        ActionDate: new Date().toISOString().split('T')[0]
      });

      return {
        output: [
          `ORA-SUCCESS: Disciplinary Sanction ${newId} recorded.`,
          `Entity: Player ${p.playerId || 'N/A'} / Team ${p.teamId || 'N/A'}`,
          `Type: ${p.actionType} | Penalty: ${p.penalty}`,
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  },
  {
    id: 'func_team_match_count',
    name: 'Function: Get_Team_Match_Count',
    type: 'function',
    title: 'Stored Function: Get_Team_Match_Count',
    description: 'Returns total count of competitive tournament matches completed or scheduled for a given team.',
    defaultParams: { teamId: 'TM01' },
    sourceCode: (p) => `CREATE OR REPLACE FUNCTION Get_Team_Match_Count(
    p_team_id IN TEAM.TeamID%TYPE := '${p.teamId}'
) RETURN NUMBER IS
    v_count NUMBER := 0;
BEGIN
    SELECT COUNT(*)
    INTO   v_count
    FROM   TEAM_MATCH_PARTICIPATION
    WHERE  TeamID = p_team_id;

    RETURN v_count;
END;`,
    execute: (p, db) => {
      const count = (db.TEAM_MATCH_PARTICIPATION || []).filter((r) => r.TeamID === p.teamId).length;
      const team = (db.TEAM || []).find((t) => t.TeamID === p.teamId);
      return {
        output: [
          `SQL> SELECT Get_Team_Match_Count('${p.teamId}') FROM DUAL;`,
          'GET_TEAM_MATCH_COUNT',
          '--------------------',
          `                   ${count}`,
          `Team: ${team ? team.TeamName : p.teamId} participating matches total: ${count}`,
          'PL/SQL function returned status 0.'
        ],
        returnVal: count
      };
    }
  },
  {
    id: 'func_player_avg_score',
    name: 'Function: Get_Player_Avg_Score',
    type: 'function',
    title: 'Stored Function: Get_Player_Avg_Score',
    description: 'Calculates and returns the floating-point average combat rating for an athlete.',
    defaultParams: { playerId: 'P01' },
    sourceCode: (p) => `CREATE OR REPLACE FUNCTION Get_Player_Avg_Score(
    p_player_id IN PLAYER.PlayerID%TYPE := '${p.playerId}'
) RETURN NUMBER IS
    v_avg NUMBER(6,2) := 0;
BEGIN
    SELECT NVL(ROUND(AVG(Score), 2), 0)
    INTO   v_avg
    FROM   PLAYER_PERFORMANCE
    WHERE  PlayerID = p_player_id;

    RETURN v_avg;
END;`,
    execute: (p, db) => {
      const perfs = (db.PLAYER_PERFORMANCE || []).filter((r) => r.PlayerID === p.playerId);
      const avg = perfs.length > 0 ? (perfs.reduce((acc, c) => acc + (c.Score || 0), 0) / perfs.length).toFixed(2) : '0.00';
      const player = (db.PLAYER || []).find((r) => r.PlayerID === p.playerId);
      return {
        output: [
          `SQL> SELECT Get_Player_Avg_Score('${p.playerId}') FROM DUAL;`,
          'GET_PLAYER_AVG_SCORE',
          '--------------------',
          `              ${avg}`,
          `Player: ${player ? player.PlayerName : p.playerId} average score: ${avg}`,
          'PL/SQL function returned status 0.'
        ],
        returnVal: Number(avg)
      };
    }
  },
  {
    id: 'func_player_acs',
    name: 'Function: Get_Player_ACS',
    type: 'function',
    title: 'Stored Function: Get_Player_ACS',
    description: 'Calculates and returns true tournament Average Combat Score using weighted formula SUM(TotalCombatScore) / SUM(RoundsPlayed).',
    defaultParams: { playerId: 'P01' },
    sourceCode: (p) => `CREATE OR REPLACE FUNCTION Get_Player_ACS(
    p_player_id IN PLAYER.PlayerID%TYPE := '${p.playerId}'
) RETURN NUMBER IS
    v_acs          NUMBER(6,1) := 0;
    v_total_score  NUMBER := 0;
    v_total_rounds NUMBER := 0;
BEGIN
    SELECT NVL(SUM(TotalCombatScore), 0), NVL(SUM(RoundsPlayed), 0)
    INTO   v_total_score, v_total_rounds
    FROM   PLAYER_PERFORMANCE
    WHERE  PlayerID = p_player_id;

    IF v_total_rounds > 0 THEN
        v_acs := ROUND(v_total_score / v_total_rounds, 1);
    END IF;

    RETURN v_acs;
END;`,
    execute: (p, db) => {
      const perfs = (db.PLAYER_PERFORMANCE || []).filter((r) => r.PlayerID === p.playerId);
      const totalScore = perfs.reduce((acc, c) => acc + (c.TotalCombatScore ?? c.Score ?? 0), 0);
      const totalRounds = perfs.reduce((acc, c) => acc + (c.RoundsPlayed ?? 0), 0);
      const acs = totalRounds > 0 ? (Math.round((totalScore / totalRounds) * 10) / 10).toFixed(1) : '0.0';
      const player = (db.PLAYER || []).find((r) => r.PlayerID === p.playerId);
      return {
        output: [
          `SQL> SELECT Get_Player_ACS('${p.playerId}') FROM DUAL;`,
          'GET_PLAYER_ACS',
          '--------------',
          `        ${acs}`,
          `Player: ${player ? player.PlayerName : p.playerId} | Total Combat Score: ${totalScore} | Rounds: ${totalRounds} | Tournament ACS: ${acs}`,
          'PL/SQL function returned status 0.'
        ],
        returnVal: Number(acs)
      };
    }
  },
  {
    id: 'func_map_acs',
    name: 'Function: Get_Map_ACS',
    type: 'function',
    title: 'Stored Function: Get_Map_ACS',
    description: 'Returns the Average Combat Score for an athlete on a specific map instance or map identifier.',
    defaultParams: { playerId: 'P01', mapId: 'MAP01' },
    sourceCode: (p) => `CREATE OR REPLACE FUNCTION Get_Map_ACS(
    p_player_id IN PLAYER.PlayerID%TYPE := '${p.playerId}',
    p_map_id    IN MATCH_MAP.MapID%TYPE := '${p.mapId}'
) RETURN NUMBER IS
    v_acs NUMBER(6,1) := 0;
BEGIN
    SELECT NVL(ROUND(TotalCombatScore / NULLIF(RoundsPlayed, 0), 1), 0)
    INTO   v_acs
    FROM   PLAYER_PERFORMANCE
    WHERE  PlayerID = p_player_id AND MapID = p_map_id;

    RETURN v_acs;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;`,
    execute: (p, db) => {
      const perf = (db.PLAYER_PERFORMANCE || []).find((r) => r.PlayerID === p.playerId && r.MapID === p.mapId);
      const player = (db.PLAYER || []).find((r) => r.PlayerID === p.playerId);
      const map = (db.MATCH_MAP || []).find((m) => m.MapID === p.mapId);
      const acs = perf ? (perf.ACS || (perf.RoundsPlayed ? (perf.TotalCombatScore / perf.RoundsPlayed).toFixed(1) : 0)) : 0;
      return {
        output: [
          `SQL> SELECT Get_Map_ACS('${p.playerId}', '${p.mapId}') FROM DUAL;`,
          'GET_MAP_ACS',
          '-----------',
          `     ${acs}`,
          `Player: ${player ? player.PlayerName : p.playerId} on Map: ${map ? map.MapName : p.mapId} | ACS: ${acs}`,
          'PL/SQL function returned status 0.'
        ],
        returnVal: Number(acs)
      };
    }
  },
  {
    id: 'proc_record_map_perf',
    name: 'Procedure: Record_Map_Performance',
    type: 'procedure',
    title: 'Stored Procedure: Record_Map_Performance',
    description: 'Inserts or records map combat performance with integrity checks (TotalCombatScore >= DamageDealt, RoundsPlayed > 0) and computes derived metrics ACS, ADR, Score, ImpactIndex.',
    defaultParams: {
      playerId: 'P01',
      matchId: 'M22',
      mapId: 'MAP01',
      rounds: 22,
      damage: 3200,
      combatScore: 5200,
      kills: 21,
      assists: 6,
      deaths: 14,
      firstKills: 4,
      firstDeaths: 2
    },
    sourceCode: (p) => `CREATE OR REPLACE PROCEDURE Record_Map_Performance(
    p_player_id     IN PLAYER_PERFORMANCE.PlayerID%TYPE := '${p.playerId}',
    p_match_id      IN PLAYER_PERFORMANCE.MatchID%TYPE := '${p.matchId}',
    p_map_id        IN PLAYER_PERFORMANCE.MapID%TYPE := '${p.mapId}',
    p_rounds        IN PLAYER_PERFORMANCE.RoundsPlayed%TYPE := ${p.rounds},
    p_damage        IN PLAYER_PERFORMANCE.DamageDealt%TYPE := ${p.damage},
    p_combat_score  IN PLAYER_PERFORMANCE.TotalCombatScore%TYPE := ${p.combatScore},
    p_kills         IN PLAYER_PERFORMANCE.Kills%TYPE := ${p.kills},
    p_assists       IN PLAYER_PERFORMANCE.Assists%TYPE := ${p.assists},
    p_deaths        IN PLAYER_PERFORMANCE.Deaths%TYPE := ${p.deaths},
    p_first_kills   IN PLAYER_PERFORMANCE.FirstKills%TYPE := ${p.firstKills},
    p_first_deaths  IN PLAYER_PERFORMANCE.FirstDeaths%TYPE := ${p.firstDeaths}
) IS
    v_perf_id   PLAYER_PERFORMANCE.PerformanceID%TYPE;
    v_acs       NUMBER(6,1);
    v_adr       NUMBER(6,1);
    v_max_num   NUMBER;
BEGIN
    IF p_combat_score < p_damage THEN
        RAISE_APPLICATION_ERROR(-20010, 'ORA-20010: TotalCombatScore (' || p_combat_score || ') cannot be less than DamageDealt (' || p_damage || ').');
    END IF;

    IF p_rounds <= 0 THEN
        RAISE_APPLICATION_ERROR(-20011, 'ORA-20011: RoundsPlayed must be strictly greater than 0.');
    END IF;

    v_acs := ROUND(p_combat_score / p_rounds, 1);
    v_adr := ROUND(p_damage / p_rounds, 1);

    SELECT NVL(MAX(TO_NUMBER(SUBSTR(PerformanceID, 4))), 0) + 1 INTO v_max_num FROM PLAYER_PERFORMANCE;
    v_perf_id := 'PER' || LPAD(v_max_num, 2, '0');

    INSERT INTO PLAYER_PERFORMANCE (
        PerformanceID, PlayerID, MatchID, MapID, RoundsPlayed, DamageDealt,
        TotalCombatScore, ACS, ADR, Kills, Assists, Deaths, FirstKills, FirstDeaths, Score
    ) VALUES (
        v_perf_id, p_player_id, p_match_id, p_map_id, p_rounds, p_damage,
        p_combat_score, v_acs, v_adr, p_kills, p_assists, p_deaths, p_first_kills, p_first_deaths, p_combat_score
    );

    DBMS_OUTPUT.PUT_LINE('ORA-SUCCESS: Map telemetry ' || v_perf_id || ' committed. ACS: ' || v_acs || ' | ADR: ' || v_adr);
END;`,
    execute: (p, db, onInsert) => {
      const rounds = Number(p.rounds) || 1;
      const damage = Number(p.damage) || 0;
      const combatScore = Number(p.combatScore) || 0;

      if (combatScore < damage) {
        return {
          output: [`ORA-20010: TotalCombatScore (${combatScore}) cannot be less than DamageDealt (${damage}).`],
          error: 'ORA-20010'
        };
      }
      if (rounds <= 0) {
        return {
          output: ['ORA-20011: RoundsPlayed must be strictly greater than 0.'],
          error: 'ORA-20011'
        };
      }

      let maxNum = 0;
      (db.PLAYER_PERFORMANCE || []).forEach((row) => {
        const val = String(row.PerformanceID || '');
        if (val.startsWith('PER')) {
          const num = parseInt(val.substring(3), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const newId = `PER${String(maxNum + 1).padStart(2, '0')}`;
      const acs = Math.round((combatScore / rounds) * 10) / 10;
      const adr = Math.round((damage / rounds) * 10) / 10;

      onInsert('PLAYER_PERFORMANCE', {
        PerformanceID: newId,
        PlayerID: p.playerId,
        MatchID: p.matchId,
        MapID: p.mapId,
        RoundsPlayed: rounds,
        DamageDealt: damage,
        TotalCombatScore: combatScore,
        ACS: acs,
        ADR: adr,
        Kills: Number(p.kills) || 0,
        Assists: Number(p.assists) || 0,
        Deaths: Number(p.deaths) || 0,
        FirstKills: Number(p.firstKills) || 0,
        FirstDeaths: Number(p.firstDeaths) || 0,
        Score: combatScore,
        EquipmentID: 'EQ01',
        InternetLatencyMs: 16,
        GameplayAnalytics: 'Committed via Record_Map_Performance PL/SQL'
      });

      return {
        output: [
          `ORA-SUCCESS: Map telemetry ${newId} committed.`,
          `Player: ${p.playerId} | Map: ${p.mapId} | Rounds: ${rounds}`,
          `Combat Score: ${combatScore} | Damage: ${damage} | ACS: ${acs} | ADR: ${adr}`,
          'PL/SQL procedure successfully completed.'
        ]
      };
    }
  }
];
