# Analytical SQL Queries and Benchmark Suite

This document outlines the **7 high-performance analytical SQL queries** modeled in the **Renewable Energy DB Simulator**. These queries reflect advanced database capabilities tailored for industrial SCADA architectures, renewable microgrids, and high-frequency IoT streaming telemetry.

---

## Summary Benchmark Matrix

| ID | Query Name | Advanced Feature | Primary Purpose | Vectorized Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Q01** | Vectorized ASOF Temporal Alignment | `ASOF JOIN` | Align high-frequency IoT timestamps with nearest weather observation | `~1.4 ms` |
| **Q02** | Time-Series Downsampling & Bucketing | `time_bucket()` | Aggregate raw telemetry into 1-hour analytical dispatch windows | `~1.8 ms` |
| **Q03** | Window Moving Average & Anomaly Flagging | `WINDOW FRAMES` | Detect underperforming assets using a 3-period rolling baseline | `~1.1 ms` |
| **Q04** | Dynamic Cross-Tabulation | Native `PIVOT` | Reshape polymorphic IoT sensor key-value logs into columnar fields | `~1.9 ms` |
| **Q05** | Multi-Dimensional Hierarchical Rollup | `GROUP BY ROLLUP` | Executive summary totals across Region and Facility Type | `~1.3 ms` |
| **Q06** | BESS Battery Degradation Analytics | Derived Metrics | Compute State of Health (SoH) and charge/discharge mode | `~0.9 ms` |
| **Q07** | Vectorized Execution Profiling | `EXPLAIN ANALYZE` | Inspect SIMD hash joins, columnar scans, and morsel execution | `~0.6 ms` |

---

## Detailed Query Walkthroughs

### Q01: Vectorized ASOF Temporal Alignment
> **Feature**: `ASOF JOIN` (As-Of Join)  
> **Target Engines**: DuckDB, Snowflake, ClickHouse, TimescaleDB, Kdb+

#### Problem Context
IoT sensors (pyranometers, anemometers) sample at sub-second frequencies, while meteorological environmental logs are sampled at discrete intervals (example: hourly). Traditional equality joins (`ON sensor.ts = env.ts`) yield zero matches due to clock drift. An unconstrained inequality cross-join is O(N * M) and computationally prohibitive.

#### Solution
The `ASOF JOIN` matches each sensor observation with the **nearest preceding** meteorological record in O(N log M) time using binary search over sorted timestamp vectors.

```sql
SELECT 
    t.TelemetryID, 
    t.SensorID, 
    r.SensorCategory,
    t.ReadingTimestamp AS SensorTime,
    ROUND(t.MetricPayload.reading_value, 2) AS SensorVal,
    e.LogTimestamp AS NearestEnvTime,
    e.SolarIrradiance, 
    e.WindSpeed, 
    e.Temperature
FROM IOT_TELEMETRY_LOG t
JOIN IOT_SENSOR_REGISTRY r ON t.SensorID = r.SensorID
JOIN GENERATION_UNIT u ON r.UnitID = u.UnitID
ASOF JOIN ENVIRONMENTAL_TELEMETRY e 
    ON u.FacilityID = e.FacilityID 
    AND t.ReadingTimestamp >= e.LogTimestamp
ORDER BY t.ReadingTimestamp;
```

#### Benchmark Result Set
| TelemetryID | SensorID | Category | SensorTime | SensorVal | EnvTime | SolarIrr | WindSpd | TempC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TEL01` | `SEN01` | Pyranometer | 09:59:58 | 950.45 | 09:00:00 | 820.00 | 2.10 | 31.5 |
| `TEL05` | `SEN05` | Hydrosonic Flowmeter | 10:00:00 | 180.50 | 10:00:00 | 100.00 | 1.20 | 21.0 |
| `TEL04` | `SEN04` | Vibration Accelerometer | 10:00:01 | 1.85 | 10:00:00 | 210.00 | 14.80 | 27.0 |
| `TEL02` | `SEN02` | Inverter Temp Probe | 10:00:02 | 48.20 | 10:00:00 | 950.50 | 2.50 | 34.5 |
| `TEL06` | `SEN06` | Battery Cell Temp | 10:00:04 | 28.50 | 10:00:00 | 890.00 | 4.50 | 33.0 |
| `TEL03` | `SEN03` | Ultrasonic Anemometer | 10:00:05 | 14.82 | 10:00:00 | 210.00 | 14.80 | 27.0 |

---

### Q02: Time-Series Downsampling & Bucketing
> **Feature**: `time_bucket()` / `date_trunc()`  
> **Target Engines**: TimescaleDB, DuckDB, PostgreSQL, ClickHouse

#### Problem Context
Microgrid telemetry produces millions of raw generation ticks. Dashboards and billing engines require downsampled, constant-interval time buckets for reliable trend reporting without transferring gigabytes of raw data to clients.

#### Solution
Aggregates production into uniform 1-hour temporal buckets per facility, computing the observation count, aggregate energy generated (kWh), and average capacity factor (CF%).

```sql
SELECT 
    time_bucket(INTERVAL '1 hour', ProductionTimestamp) AS TimeWindow,
    u.FacilityID, 
    COUNT(ProductionID) AS ReadingCount,
    ROUND(SUM(EnergyGeneratedKWh), 2) AS TotalEnergyKWh,
    ROUND(AVG(CapacityFactorPct), 2) AS AvgCapacityFactorPct
FROM ENERGY_PRODUCTION_TIMESERIES p
JOIN GENERATION_UNIT u ON p.UnitID = u.UnitID
GROUP BY TimeWindow, u.FacilityID
ORDER BY TimeWindow, u.FacilityID;
```

#### Benchmark Result Set
| TimeWindow | FacilityID | Readings | TotalEnergyKWh | AvgCapacityFactorPct |
| :--- | :--- | :--- | :--- | :--- |
| `2026-09-10 09:00:00` | `FAC01` | 2 | 815.00 | 81.50% |
| `2026-09-10 09:00:00` | `FAC02` | 1 | 260.00 | 86.67% |
| `2026-09-10 10:00:00` | `FAC01` | 2 | 955.50 | 95.55% |
| `2026-09-10 10:00:00` | `FAC02` | 2 | 585.00 | 97.50% |
| `2026-09-10 10:00:00` | `FAC03` | 2 | 975.00 | 97.50% |
| `2026-09-10 10:00:00` | `FAC04` | 1 | 240.00 | 96.00% |
| `2026-09-10 11:00:00` | `FAC01` | 2 | 980.00 | 98.00% |

---

### Q03: Window Moving Average & Anomaly Flagging
> **Feature**: `AVG(...) OVER (PARTITION BY ... ROWS BETWEEN)`  
> **Target Engines**: ANSI SQL:2016 standard, PostgreSQL, DuckDB, BigQuery

#### Problem Context
A sudden drop in turbine or inverter generation could indicate equipment degradation, shading, or mechanical fault. Simple static thresholds trigger false alarms due to seasonal and diurnal variations.

#### Solution
A dynamic 3-period moving window (`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`) partitions by generator unit. If the current interval yield falls below 90% of the rolling baseline, the query flags the row as `UNDERPERFORMING`.

```sql
SELECT 
    ProductionID, 
    UnitID, 
    ProductionTimestamp, 
    EnergyGeneratedKWh,
    ROUND(AVG(EnergyGeneratedKWh) OVER (
        PARTITION BY UnitID 
        ORDER BY ProductionTimestamp 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS RollingAvg3PeriodKWh,
    CASE 
        WHEN EnergyGeneratedKWh < 0.90 * AVG(EnergyGeneratedKWh) OVER (
            PARTITION BY UnitID 
            ORDER BY ProductionTimestamp 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) THEN 'UNDERPERFORMING'
        ELSE 'NORMAL'
    END AS PerformanceFlag
FROM ENERGY_PRODUCTION_TIMESERIES
ORDER BY UnitID, ProductionTimestamp;
```

---

### Q04: Dynamic Cross-Tabulation (PIVOT)
> **Feature**: Native `PIVOT ... ON ... USING`  
> **Target Engines**: DuckDB, Snowflake, Microsoft SQL Server, Oracle

#### Problem Context
Modern IoT telemetry logs use flexible key-value formats (`MetricPayload.metric_name` and `MetricPayload.reading_value`) to support heterogeneous sensor hardware. For regression analysis and machine learning, analysts require separate columns for each measurement type.

#### Solution
Uses the native vectorized SQL `PIVOT` operator to transpose rows into dedicated metric columns without cumbersome conditional `MAX(CASE ...)` aggregation logic.

```sql
PIVOT (
    SELECT 
        t.ReadingTimestamp,
        t.MetricPayload.metric_name AS Metric,
        t.MetricPayload.reading_value AS Value
    FROM IOT_TELEMETRY_LOG t
)
ON Metric
USING FIRST(Value);
```

#### Transposed Column Structure
- `Timestamp`
- `Solar Irradiance` (W/m2)
- `Inverter Core Temp` (°C)
- `Wind Velocity` (m/s)
- `Drive Shaft Vibration` (mm/s)
- `Penstock Flow` (m3/s)
- `Battery Pack Temp` (°C)

---

### Q05: Multi-Dimensional Hierarchical Rollup
> **Feature**: `GROUP BY ROLLUP(...)`  
> **Target Engines**: PostgreSQL, DuckDB, Oracle, MySQL 8+, Trino

#### Problem Context
Executive dashboards require aggregation across multiple dimensions (such as Geographic Region and Facility Type) simultaneously, with regional subtotals and an overall portfolio grand total.

#### Solution
The `ROLLUP` construct computes hierarchically nested subtotals:
1. `(Region, FacilityType)`
2. `(Region)` to Regional Subtotal
3. `()` to Portfolio Grand Total

```sql
SELECT 
    COALESCE(f.Region, '--> ALL REGIONS') AS Region,
    COALESCE(f.FacilityType, '--> ALL TYPES') AS FacilityType,
    COUNT(DISTINCT f.FacilityID) AS FacilityCount,
    COUNT(DISTINCT u.UnitID) AS TotalUnits,
    ROUND(SUM(u.RatedCapacityKW), 2) AS TotalRatedKW,
    ROUND(SUM(p.EnergyGeneratedKWh), 2) AS TotalGeneratedKWh
FROM POWER_FACILITY f
JOIN GENERATION_UNIT u ON f.FacilityID = u.FacilityID
LEFT JOIN ENERGY_PRODUCTION_TIMESERIES p ON u.UnitID = p.UnitID
GROUP BY ROLLUP (f.Region, f.FacilityType)
ORDER BY f.Region NULLS LAST, f.FacilityType NULLS LAST;
```

---

### Q06: BESS Battery Storage & Degradation Analytics
> **Feature**: Derived Thermodynamic & Cycle Life Metrics  
> **Target Engines**: All Relational and Analytical Engines

#### Problem Context
Lithium-ion Battery Energy Storage Systems (BESS) represent critical capital investments. Grid operators must continuously monitor instantaneous charging/discharging modes, cell thermal stability, and long-term capacity retention (State of Health).

#### Solution
Analyzes directional power flow (kW) and projects residual capacity using empirical cycle degradation modeling:
Estimated SoH = 100.0% - (CycleCount * 0.015)

```sql
SELECT 
    b.BESSLogID, 
    f.FacilityName, 
    b.LogTimestamp,
    b.StateOfChargePct, 
    b.CellTemperatureC, 
    b.ChargeDischargeRateKW,
    CASE 
        WHEN b.ChargeDischargeRateKW < 0 THEN 'DISCHARGING'
        WHEN b.ChargeDischargeRateKW > 0 THEN 'CHARGING'
        ELSE 'IDLE'
    END AS OperationalMode,
    b.CycleCount,
    ROUND(100.0 - (b.CycleCount * 0.015), 2) AS EstimatedStateOfHealthPct
FROM BATTERY_STORAGE_TELEMETRY b
JOIN POWER_FACILITY f ON b.FacilityID = f.FacilityID
ORDER BY b.LogTimestamp;
```

---

### Q07: Vectorized Execution Profiling (EXPLAIN ANALYZE)
> **Feature**: `EXPLAIN ANALYZE` / Vectorized Physical Plan  
> **Target Engines**: DuckDB, PostgreSQL, ClickHouse

#### Problem Context
Understanding query plan optimization, push-down filter evaluation, and memory morsel allocation is vital for low-latency time-series analytics.

#### Solution
Profiles the physical execution pipeline to demonstrate columnar chunk scanning, parallel morsel aggregation, and SIMD filter pushdown.

```sql
EXPLAIN ANALYZE
SELECT 
    f.FacilityName, 
    u.UnitType,
    ROUND(SUM(p.EnergyGeneratedKWh), 2) AS TotalEnergy
FROM POWER_FACILITY f
JOIN GENERATION_UNIT u ON f.FacilityID = u.FacilityID
JOIN ENERGY_PRODUCTION_TIMESERIES p ON u.UnitID = p.UnitID
WHERE p.CapacityFactorPct >= 90.00
GROUP BY f.FacilityName, u.UnitType;
```

#### Physical Execution Pipeline Breakdown
| Physical Operator | Latency | Processed Rows | Internal Vector Pipeline State |
| :--- | :--- | :--- | :--- |
| `HASH_GROUP_BY` | `0.0001s` | 7 rows | Vectorized Parallel Morsel Aggregation |
| `PROJECTION` | `0.0000s` | 11 rows | Direct Column Expression Evaluation |
| `HASH_JOIN (FacilityID)` | `0.0001s` | 11 rows | SIMD Hash Probe & Filter |
| `TABLE_SCAN (POWER_FACILITY)` | `0.0000s` | 4 rows | Sequential Columnar Chunk Scan |
| `TABLE_SCAN (ENERGY_PRODUCTION)`| `0.0001s`| 11 rows | Pushed down Filter: `CapacityFactor >= 90.0` |
