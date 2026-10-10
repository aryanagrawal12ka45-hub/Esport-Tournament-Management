import React from 'react';
import type { DatabaseTable } from '../data/databaseData';
import {
  Zap,
  Activity,
  BatteryCharging,
  Leaf,
  Sun,
  Wind,
  Droplets,
  ShieldCheck,
  Play,
  Pause,
  Wrench,
  FileText
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Props {
  tables: DatabaseTable[];
  tableData: Record<string, any[]>;
  isLiveSimulating: boolean;
  onToggleLiveSimulation: () => void;
  onSelectTable: (tableId: string) => void;
}

export const DashboardOverview: React.FC<Props> = ({
  tableData,
  isLiveSimulating,
  onToggleLiveSimulation,
  onSelectTable,
}) => {
  const isMobile = useIsMobile(768);
  const facilities = tableData['POWER_FACILITY'] || [];
  const units = tableData['GENERATION_UNIT'] || [];
  const agreements = tableData['SUPPLY_AGREEMENT'] || [];
  const carbonCredits = tableData['CARBON_CREDIT_LEDGER'] || [];
  const bessLogs = tableData['BATTERY_STORAGE_TELEMETRY'] || [];
  const maintenanceLogs = tableData['EQUIPMENT_MAINTENANCE_LOG'] || [];
  const inspections = tableData['COMPLIANCE_INSPECTION'] || [];

  const totalCapacityMW = facilities.reduce((acc, f) => acc + (Number(f.TotalCapacityMW) || 0), 0);
  const activeUnits = units.filter((u) => u.OperationalStatus === 'Operational').length;
  const totalContractedMW = agreements.reduce((acc, a) => acc + (Number(a.ContractedCapacityMW) || 0), 0);
  const latestBess = bessLogs[bessLogs.length - 1] || { StateOfChargePct: 88.0, CellTemperatureC: 27.4, CycleCount: 215 };
  const totalOffsetTons = carbonCredits.reduce((acc, c) => acc + (Number(c.CO2OffsetTons) || 0), 0);
  const avgAuditScore = inspections.length > 0
    ? (inspections.reduce((acc, i) => acc + (Number(i.AuditScore) || 0), 0) / inspections.length).toFixed(1)
    : '97.2';

  return (
    <div
      style={{
        padding: isMobile ? '12px 14px' : '24px 32px',
        maxWidth: 1600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 14 : 24,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        height: isMobile ? 'calc(100vh - 54px - 56px)' : 'calc(100vh - 60px)',
        backgroundColor: '#000000'
      }}
    >
      {/* Top Banner - Pitch-Black & Metallic Silver Wafer Style */}
      <div
        className="card-glass"
        style={{
          padding: isMobile ? '14px 16px' : '18px 24px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 12,
          backgroundColor: 'rgba(12, 12, 16, 0.85)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`status-dot ${isLiveSimulating ? 'green' : 'silver'}`} />
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 15 : 17,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em'
              }}
            >
              Operations & Telemetry Overview
            </h1>
            <span
              className="tag-wafer"
              style={{
                fontSize: 10.5,
                padding: '2px 8px'
              }}
            >
              DuckDB Live State
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>
            Aggregated operational metrics derived directly from the 15 database tables.
          </p>
        </div>

        <button
          onClick={onToggleLiveSimulation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isLiveSimulating ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isLiveSimulating ? '#ef4444' : 'var(--border-metallic)'}`,
            color: isLiveSimulating ? '#ef4444' : '#ffffff',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          {isLiveSimulating ? <Pause size={13} /> : <Play size={13} />}
          {isLiveSimulating ? 'Pause Telemetry Feed' : 'Simulate Telemetry Feed'}
        </button>
      </div>

      {/* Primary KPI Grid (Smooth 20px Curved Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: isMobile ? 10 : 16
        }}
      >
        {/* Card 1 */}
        <div
          className="card-glass"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Nameplate Capacity</span>
            <Zap size={15} style={{ color: 'var(--accent-silver)' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '10px 0 3px 0', fontFamily: 'var(--font-mono)' }}>
            {totalCapacityMW.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {facilities.length} Interconnected Facilities
          </div>
        </div>

        {/* Card 2 */}
        <div
          className="card-glass"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Active Generation Units</span>
            <Activity size={15} style={{ color: 'var(--accent-silver)' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '10px 0 3px 0', fontFamily: 'var(--font-mono)' }}>
            {activeUnits} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/ {units.length} Active</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {units.length - activeUnits} in Scheduled Maintenance
          </div>
        </div>

        {/* Card 3 */}
        <div
          className="card-glass"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Contracted Power PPAs</span>
            <ShieldCheck size={15} style={{ color: 'var(--accent-silver)' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '10px 0 3px 0', fontFamily: 'var(--font-mono)' }}>
            {totalContractedMW.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            Under {agreements.length} Long-term Utility Agreements
          </div>
        </div>

        {/* Card 4 */}
        <div
          className="card-glass"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>BESS Storage State</span>
            <BatteryCharging size={15} style={{ color: '#fbbf24' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '10px 0 3px 0', fontFamily: 'var(--font-mono)' }}>
            {latestBess.StateOfChargePct}% <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>SoC</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            Cell Temp: {latestBess.CellTemperatureC}°C &bull; {latestBess.CycleCount} Cycles
          </div>
        </div>

        {/* Card 5 */}
        <div
          className="card-glass"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Avoided CO₂ Offsets</span>
            <Leaf size={15} style={{ color: '#34d399' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '10px 0 3px 0', fontFamily: 'var(--font-mono)' }}>
            {totalOffsetTons.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>Tons</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            From 4 Verified Ledger Entries
          </div>
        </div>

        {/* Card 6 */}
        <div
          className="card-glass"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Audit Compliance Score</span>
            <ShieldCheck size={15} style={{ color: 'var(--accent-silver)' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '10px 0 3px 0', fontFamily: 'var(--font-mono)' }}>
            {avgAuditScore}%
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {inspections.length} Statutory Audits Passed
          </div>
        </div>
      </div>

      {/* Facilities Breakdown (Smooth 20px Curved Cards) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.01em'
            }}
          >
            Generation Facilities (POWER_FACILITY)
          </h2>
          <button
            onClick={() => onSelectTable('POWER_FACILITY')}
            style={{ fontSize: 12, color: 'var(--accent-silver)', fontWeight: 500 }}
          >
            View all facility rows &rarr;
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: isMobile ? 12 : 16
          }}
        >
          {facilities.map((fac) => {
            const facUnits = units.filter((u) => u.FacilityID === fac.FacilityID);
            const facActiveUnits = facUnits.filter((u) => u.OperationalStatus === 'Operational').length;

            let icon = <Sun size={18} style={{ color: '#fbbf24' }} />;
            if (fac.FacilityType === 'Wind Farm') {
              icon = <Wind size={18} style={{ color: '#f4f4f5' }} />;
            } else if (fac.FacilityType === 'Hydroelectric Station') {
              icon = <Droplets size={18} style={{ color: '#d4d4d8' }} />;
            } else if (fac.FacilityType === 'Battery Storage') {
              icon = <BatteryCharging size={18} style={{ color: '#fbbf24' }} />;
            }

            return (
              <div
                key={fac.FacilityID}
                className="card-glass"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  backgroundColor: 'rgba(12, 12, 16, 0.85)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {icon}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {fac.FacilityName}
                      </h3>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {fac.Region} &bull; {fac.FacilityType} &bull; {fac.FacilityID}
                      </p>
                    </div>
                  </div>

                  <span
                    className="tag-wafer"
                    style={{
                      fontSize: 10.5,
                      padding: '3px 8px'
                    }}
                  >
                    Online
                  </span>
                </div>

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nameplate Capacity:</span>
                    <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {fac.TotalCapacityMW} MW
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Assets:</span>
                    <span style={{ color: '#ffffff' }}>
                      {facActiveUnits} of {facUnits.length} Units Active
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Interconnection Date:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {fac.CommissionDate}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11.5
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Coordinates: {fac.Latitude}, {fac.Longitude}
                  </span>
                  <button
                    onClick={() => onSelectTable('GENERATION_UNIT')}
                    style={{ color: 'var(--accent-silver)', fontWeight: 500 }}
                  >
                    View Units &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Grounded Operational Tables: Maintenance & PPAs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: isMobile ? 12 : 16
        }}
      >
        {/* Maintenance Log */}
        <div
          className="card-glass"
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wrench size={15} style={{ color: 'var(--accent-silver)' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                Equipment Maintenance Log (EQUIPMENT_MAINTENANCE_LOG)
              </h3>
            </div>
            <button
              onClick={() => onSelectTable('EQUIPMENT_MAINTENANCE_LOG')}
              style={{ fontSize: 11.5, color: 'var(--accent-silver)', fontWeight: 500 }}
            >
              Table View &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {maintenanceLogs.map((m) => (
              <div
                key={m.MaintenanceID}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border)',
                  fontSize: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>
                    {m.MaintenanceID} &bull; Unit {m.UnitID}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {m.MaintenanceDate}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                  {m.ActionTaken}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, color: 'var(--text-muted)', fontSize: 11 }}>
                  <span>Downtime: {m.DowntimeHours} hrs</span>
                  <span>Cost: ${Number(m.MaintenanceCost).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Power Purchase Agreements */}
        <div
          className="card-glass"
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            backgroundColor: 'rgba(12, 12, 16, 0.85)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} style={{ color: 'var(--accent-silver)' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                Power Supply Agreements (SUPPLY_AGREEMENT)
              </h3>
            </div>
            <button
              onClick={() => onSelectTable('SUPPLY_AGREEMENT')}
              style={{ fontSize: 11.5, color: 'var(--accent-silver)', fontWeight: 500 }}
            >
              Table View &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agreements.map((a) => (
              <div
                key={a.AgreementID}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border)',
                  fontSize: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>
                    {a.AgreementID} &bull; {a.FacilityID} &rarr; {a.CompanyID}
                  </span>
                  <span
                    className="tag-wafer"
                    style={{
                      fontSize: 10.5,
                      padding: '2px 8px'
                    }}
                  >
                    {a.AgreementStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, color: 'var(--text-secondary)' }}>
                  <span>Contracted: {a.ContractedCapacityMW} MW</span>
                  <span>Tariff: ${a.TariffPerKWh} / kWh</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>
                  Period: {a.StartDate} to {a.EndDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
