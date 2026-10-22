# VALORANT Competitive Scoring & Telemetry Guide
## ArenaDB Tactical Analytics • VALORANT Champions 2026 Shanghai

---

### Public Attribution & Legal Disclosure
*All tournament outcomes, roster details, and match scores are verified against public esports reporting platforms including vlr.gg, Liquipedia VALORANT, thespike.gg, and Riot Games broadcast archives. ArenaDB is an independent educational database lab and is **not affiliated with, endorsed by, or sponsored by Riot Games**. Any detailed sub-round metrics or simulated telemetry logs not exposed via public match APIs are explicitly marked as illustrative.*

---

## 1. The Combat Score Core: Round Combat Score (RCS)

In tactical shooter esports, combat score evaluates player impact beyond simple frags by combining three distinct pillars:

### Pillar 1: Damage Dealt
- **1 point** per **1 HP** of direct damage dealt to enemy hitpoints.
- Includes weapon hits, ability damage, and area-of-effect chip damage.
- Overkill damage beyond 0 HP does not award extra points.

### Pillar 2: Elimination Timing (Enemies Alive)
Eliminating an enemy early in the round drastically swings round win probability:
| Enemies Alive When Eliminated | Kill Points Awarded | Tactical Rationale |
| :---: | :---: | :--- |
| **5 Enemies Alive** | **150 Pts** | Opening entry frag. Converts a 5v5 into a 5v4 (~74% win probability). |
| **4 Enemies Alive** | **130 Pts** | Trade frag or secondary site breach kill. |
| **3 Enemies Alive** | **110 Pts** | Mid-round conversion, breaks enemy retake or site hold. |
| **2 Enemies Alive** | **90 Pts** | Late-round isolation kill. |
| **1 Enemy Alive** | **70 Pts** | Final elimination / cleanup frag. |

### Pillar 3: Multi-Kill Bonuses & Utility Assists
- **Multi-Kill Escalation (in a single round):**
  - 1st Kill: **+0**
  - 2nd Kill: **+50**
  - 3rd Kill: **+75** (or +100 depending on round state)
  - 4th Kill: **+100**
  - 5th Kill (ACE): **+125**
- **Non-Damaging Assists:**
  - Flat **25 points** for utility assists (flashes, concusses, recons, smokes, suppression, heals, resurrection) where the assister dealt zero direct weapon damage.

### Verified Worked Example: Round 7 Breakdown
An athlete deals **210 damage**, gets **2 kills** (Kill #1 with 5 alive, Kill #2 with 4 alive), and delivers **1 non-damaging flash assist**:
$$\text{RCS} = 210_{\text{DMG}} + 150_{\text{Kill 1}} + 130_{\text{Kill 2}} + 50_{\text{2nd Kill Bonus}} + 25_{\text{Assist}} = 565\text{ Points}$$

---

## 2. Average Combat Score (ACS)

### Single Map ACS Formula
$$\text{Map ACS} = \frac{\sum_{r=1}^{N} \text{RCS}_r}{N}$$
Where $N$ is the total number of regulation and overtime rounds played in the map.
- *Example:* 5,400 Total Combat Score across 24 rounds $= 225.0$ ACS.

### Tournament ACS (True Weighted Aggregation)
$$\text{Tournament ACS} = \frac{\sum_{\text{all maps}} \text{TotalCombatScore}}{\sum_{\text{all maps}} \text{RoundsPlayed}}$$

### The Arithmetic Mean Fallacy in Multi-Map Series
Averaging the ACS of multiple maps produces severe mathematical distortion:
$$\frac{\text{Map 1 ACS} + \text{Map 2 ACS}}{2} \neq \text{Tournament ACS}$$

**Proof:**
- **Map 1 (13–1 blowout, 14 rounds):** 4,200 points $\to 300.0$ ACS.
- **Map 2 (16–14 double overtime, 30 rounds):** 6,000 points $\to 200.0$ ACS.
- **Arithmetic Mean of Map ACS:** $\frac{300.0 + 200.0}{2} = \mathbf{250.0\text{ ACS}}$ (Distorted).
- **True Tournament ACS:** $\frac{4,200 + 6,000}{14 + 30} = \frac{10,200}{44} = \mathbf{231.8\text{ ACS}}$.
- **Delta:** Arithmetic mean exaggerates performance by $+18.2$ points because it incorrectly weights 14 blowout rounds equally with 30 overtime rounds.

---

## 3. Official Performance Benchmark Bands

Calibrated against international Tier-1 VCT competition:
| ACS Range | Bracket ID | Tier Label | PL/SQL Bracket | Tactical Description |
| :---: | :---: | :---: | :---: | :--- |
| **0 – 100** | `very_poor` | Very Poor | `LOW` | Severely deficient combat presence; requires immediate role review. |
| **100 – 150** | `below_average` | Below Average | `LOW` | Sub-par frag output; utility or opening survival needs calibration. |
| **150 – 200** | `average` | Average | `MODERATE` | Standard competitive baseline for support or anchor specialists. |
| **200 – 250** | `good` | Good | `MODERATE` | Reliable tournament fragger; consistent trades and site execution. |
| **250 – 300** | `great` | Great | `HIGH` | Star entry duelist or high-fragging initiator carrying team rounds. |
| **300+** | `elite` | Elite / MVP | `EXCELLENT` | Historic tournament MVP contention; historic fragging rate. |

---

## 4. Secondary & Composite Metrics

1. **ADR (Average Damage per Round):**
   $$\text{ADR} = \frac{\text{Total Damage Dealt}}{\text{Rounds Played}}$$
   Baseline: $130 - 140$; Elite: $160+$.

2. **K/D & KDA Ratio:**
   $$\text{K/D} = \frac{\text{Kills}}{\text{Deaths}} \quad\quad \text{KDA} = \frac{\text{Kills} + 0.5 \times \text{Assists}}{\text{Deaths}}$$

3. **KAST% (Kill, Assist, Survived, Traded):**
   Percentage of rounds where an athlete had positive tangible round contribution.
   $$\text{KAST\%} = \frac{\text{Rounds with (Kills} \ge 1 \lor \text{Assists} \ge 1 \lor \text{Survived} \lor \text{Traded within 4s)}}{\text{Total Rounds Played}} \times 100$$
   World-class benchmark: $74\% - 80\%+$.

4. **ArenaDB Impact Index:**
   $$\text{Impact Index} = 0.40 \left(\frac{\text{ACS}}{200.0}\right) + 0.25 \left(\frac{\text{ADR}}{135.0}\right) + 0.20 \left(\frac{\text{KAST\%}}{70.0}\right) + 0.15 \left(1.0 + \frac{\text{FK} - \text{FD}}{\text{Rounds}}\right)$$
   Normalized so $1.00$ represents average Tier-1 performance.

---

## 5. Official Prize Pool Distribution: Champions 2026 Shanghai

Total Prize Purse: **$2,250,000.00 USD**

| Place | Qualified Team(s) | Prize (USD) | Share |
| :--- | :--- | :---: | :---: |
| **1st (Champions)** | **LOUD** | **$1,000,000.00** | 44.44% |
| **2nd (Runner-Up)** | **Team Vitality** | **$400,000.00** | 17.78% |
| **3rd** | Paper Rex | $250,000.00 | 11.11% |
| **4th** | Fnatic | $130,000.00 | 5.78% |
| **5th – 6th** | Sentinels, Gen.G Esports | $85,000.00 each ($170,000) | 7.56% |
| **7th – 8th** | EDward Gaming, DRX | $50,000.00 each ($100,000) | 4.44% |
| **9th – 12th** | Team Heretics, FunPlus Phoenix, Trace, Talon | $30,000.00 each ($120,000) | 5.33% |
| **13th – 16th** | KRÜ Esports, Bilibili Gaming, Leviatán, FUT Esports | $20,000.00 each ($80,000) | 3.56% |
| **TOTAL** | **16 Teams** | **$2,250,000.00** | **100.00%** |

---

## 6. Embedded Interactive Calculators in ArenaDB

The application features 5 interactive calculators wired to live state in the **Scoring Academy** (`src/components/ScoringAcademy.tsx`):
1. **Round Combat Score (RCS) Builder:** Interactive damage slider, enemies-alive dropdowns for up to 5 kills, multi-kill bonus, and non-damaging assist toggles with animated breakdown.
2. **Map ACS & Efficiency Simulator:** Full map inputs (damage, rounds, kills, deaths, assists, first kills/deaths) producing ACS, ADR, K/D, KDA, Impact Index, and benchmark band.
3. **Champions 2026 Athlete Lookup:** Dropdown selector of all 80 rostered athletes across 16 teams with per-map records, true tournament ACS, and arithmetic mean delta.
4. **Series ACS & Map Variance Analyzer:** Match fixture selector showing map-by-map progression and score rollup for the Best-of-3 and Best-of-5 brackets.
5. **"What Changed My ACS?" Sensitivity Slider:** Live slider adjusting damage, opening duels, and assists to demonstrate marginal ACS impact per round.
