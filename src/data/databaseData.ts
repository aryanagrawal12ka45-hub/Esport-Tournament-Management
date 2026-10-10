export interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  isNullable?: boolean;
  defaultValue?: string;
  description?: string;
}

export type SubsystemCategory = 'Assets' | 'Telemetry' | 'Storage' | 'Grid' | 'Compliance';

export interface DatabaseTable {
  id: string;
  name: string;
  category: SubsystemCategory;
  description: string;
  iconName: string;
  columns: TableColumn[];
  initialRows: Record<string, any>[];
  canvasPos: { x: number; y: number };
}

export interface TableRelation {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: 'one-to-many' | 'many-to-one';
  label: string;
}

export const INITIAL_TABLES: DatabaseTable[] = [
  {
    id: 'POWER_FACILITY',
    name: 'POWER_FACILITY',
    category: 'Assets',
    description: 'Renewable energy production plants across geographic regions.',
    iconName: 'Zap',
    canvasPos: { x: 50, y: 80 },
    columns: [
      { name: 'FacilityID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false, description: 'Unique facility identifier' },
      { name: 'FacilityName', type: 'VARCHAR(100)', isNullable: false, description: 'Commercial plant name' },
      { name: 'FacilityType', type: 'ENUM', isNullable: false, description: 'Solar, Wind, Hydro, or Battery' },
      { name: 'Region', type: 'VARCHAR(50)', isNullable: false, description: 'Geographic state / province' },
      { name: 'TotalCapacityMW', type: 'DECIMAL(10,2)', isNullable: false, description: 'Nameplate peak capacity in MW' },
      { name: 'CommissionDate', type: 'DATE', isNullable: false, description: 'Grid interconnection date' },
      { name: 'Latitude', type: 'DECIMAL(8,4)', isNullable: true, description: 'Geographical latitude' },
      { name: 'Longitude', type: 'DECIMAL(8,4)', isNullable: true, description: 'Geographical longitude' },
    ],
    initialRows: [
      { FacilityID: 'FAC01', FacilityName: 'Bhadla Solar Park', FacilityType: 'Solar Farm', Region: 'Rajasthan', TotalCapacityMW: 2245.0, CommissionDate: '2020-03-15', Latitude: 27.5385, Longitude: 71.9161 },
      { FacilityID: 'FAC02', FacilityName: 'Muppandal Wind Farm', FacilityType: 'Wind Farm', Region: 'Tamil Nadu', TotalCapacityMW: 1500.0, CommissionDate: '2019-06-20', Latitude: 8.2588, Longitude: 77.5458 },
      { FacilityID: 'FAC03', FacilityName: 'Tehri Hydro Complex', FacilityType: 'Hydroelectric Station', Region: 'Uttarakhand', TotalCapacityMW: 1000.0, CommissionDate: '2018-01-10', Latitude: 30.378, Longitude: 78.4803 },
      { FacilityID: 'FAC04', FacilityName: 'Khavda BESS Substation', FacilityType: 'Battery Storage', Region: 'Gujarat', TotalCapacityMW: 500.0, CommissionDate: '2025-11-01', Latitude: 23.8437, Longitude: 69.7289 },
    ]
  },
  {
    id: 'GENERATION_UNIT',
    name: 'GENERATION_UNIT',
    category: 'Assets',
    description: 'Specific generation assets (PV arrays, wind turbines, hydro turbines, BESS racks).',
    iconName: 'Cpu',
    canvasPos: { x: 420, y: 80 },
    columns: [
      { name: 'UnitID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'FacilityID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'POWER_FACILITY', referencesColumn: 'FacilityID', isNullable: false },
      { name: 'UnitType', type: 'VARCHAR(50)', isNullable: false },
      { name: 'RatedCapacityKW', type: 'DECIMAL(10,2)', isNullable: false },
      { name: 'OperationalStatus', type: 'ENUM', isNullable: false, defaultValue: "'Operational'" },
      { name: 'CommissionDate', type: 'DATE', isNullable: false },
    ],
    initialRows: [
      { UnitID: 'U101', FacilityID: 'FAC01', UnitType: 'Photovoltaic Array Alpha', RatedCapacityKW: 500.0, OperationalStatus: 'Operational', CommissionDate: '2020-03-15' },
      { UnitID: 'U102', FacilityID: 'FAC01', UnitType: 'Photovoltaic Array Beta', RatedCapacityKW: 500.0, OperationalStatus: 'Operational', CommissionDate: '2020-03-15' },
      { UnitID: 'U103', FacilityID: 'FAC01', UnitType: 'Photovoltaic Array Gamma', RatedCapacityKW: 450.0, OperationalStatus: 'Maintenance', CommissionDate: '2021-01-10' },
      { UnitID: 'U201', FacilityID: 'FAC02', UnitType: 'Vestas V126 Wind Turbine 1', RatedCapacityKW: 300.0, OperationalStatus: 'Operational', CommissionDate: '2019-06-20' },
      { UnitID: 'U202', FacilityID: 'FAC02', UnitType: 'Vestas V126 Wind Turbine 2', RatedCapacityKW: 300.0, OperationalStatus: 'Operational', CommissionDate: '2019-06-20' },
      { UnitID: 'U203', FacilityID: 'FAC02', UnitType: 'Vestas V126 Wind Turbine 3', RatedCapacityKW: 300.0, OperationalStatus: 'Operational', CommissionDate: '2019-06-20' },
      { UnitID: 'U301', FacilityID: 'FAC03', UnitType: 'Francis Hydro Turbine 1', RatedCapacityKW: 500.0, OperationalStatus: 'Operational', CommissionDate: '2018-01-10' },
      { UnitID: 'U302', FacilityID: 'FAC03', UnitType: 'Francis Hydro Turbine 2', RatedCapacityKW: 500.0, OperationalStatus: 'Operational', CommissionDate: '2018-01-10' },
      { UnitID: 'U401', FacilityID: 'FAC04', UnitType: 'Tesla Megapack BESS Rack A', RatedCapacityKW: 250.0, OperationalStatus: 'Operational', CommissionDate: '2025-11-01' },
      { UnitID: 'U402', FacilityID: 'FAC04', UnitType: 'Tesla Megapack BESS Rack B', RatedCapacityKW: 250.0, OperationalStatus: 'Operational', CommissionDate: '2025-11-01' },
    ]
  },
  {
    id: 'ENVIRONMENTAL_TELEMETRY',
    name: 'ENVIRONMENTAL_TELEMETRY',
    category: 'Telemetry',
    description: 'Continuous environmental telemetry streams (solar irradiance, wind velocity, water flow, temperature).',
    iconName: 'Sun',
    canvasPos: { x: 50, y: 530 },
    columns: [
      { name: 'EnvLogID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'FacilityID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'POWER_FACILITY', referencesColumn: 'FacilityID', isNullable: false },
      { name: 'LogTimestamp', type: 'TIMESTAMP', isNullable: false },
      { name: 'SolarIrradiance', type: 'DECIMAL(8,2)', defaultValue: '0.00' },
      { name: 'WindSpeed', type: 'DECIMAL(6,2)', defaultValue: '0.00' },
      { name: 'WaterFlowRate', type: 'DECIMAL(8,2)', defaultValue: '0.00' },
      { name: 'Temperature', type: 'DECIMAL(5,2)', isNullable: false },
      { name: 'HumidityPct', type: 'DECIMAL(5,2)', isNullable: true },
    ],
    initialRows: [
      { EnvLogID: 'ENV01', FacilityID: 'FAC01', LogTimestamp: '2026-09-10 09:00:00', SolarIrradiance: 820.0, WindSpeed: 2.1, WaterFlowRate: 0.0, Temperature: 31.5, HumidityPct: 28.0 },
      { EnvLogID: 'ENV02', FacilityID: 'FAC01', LogTimestamp: '2026-09-10 10:00:00', SolarIrradiance: 950.5, WindSpeed: 2.5, WaterFlowRate: 0.0, Temperature: 34.5, HumidityPct: 24.5 },
      { EnvLogID: 'ENV03', FacilityID: 'FAC01', LogTimestamp: '2026-09-10 11:00:00', SolarIrradiance: 1020.0, WindSpeed: 3.2, WaterFlowRate: 0.0, Temperature: 37.0, HumidityPct: 21.0 },
      { EnvLogID: 'ENV04', FacilityID: 'FAC01', LogTimestamp: '2026-09-10 12:00:00', SolarIrradiance: 1050.0, WindSpeed: 3.8, WaterFlowRate: 0.0, Temperature: 38.5, HumidityPct: 19.0 },
      { EnvLogID: 'ENV05', FacilityID: 'FAC02', LogTimestamp: '2026-09-10 09:00:00', SolarIrradiance: 180.0, WindSpeed: 12.4, WaterFlowRate: 0.0, Temperature: 26.5, HumidityPct: 68.0 },
      { EnvLogID: 'ENV06', FacilityID: 'FAC02', LogTimestamp: '2026-09-10 10:00:00', SolarIrradiance: 210.0, WindSpeed: 14.8, WaterFlowRate: 0.0, Temperature: 27.0, HumidityPct: 65.0 },
      { EnvLogID: 'ENV07', FacilityID: 'FAC02', LogTimestamp: '2026-09-10 11:00:00', SolarIrradiance: 230.0, WindSpeed: 15.6, WaterFlowRate: 0.0, Temperature: 28.2, HumidityPct: 62.0 },
      { EnvLogID: 'ENV08', FacilityID: 'FAC03', LogTimestamp: '2026-09-10 10:00:00', SolarIrradiance: 100.0, WindSpeed: 1.2, WaterFlowRate: 180.5, Temperature: 21.0, HumidityPct: 75.0 },
      { EnvLogID: 'ENV09', FacilityID: 'FAC03', LogTimestamp: '2026-09-10 11:00:00', SolarIrradiance: 120.0, WindSpeed: 1.5, WaterFlowRate: 192.0, Temperature: 22.5, HumidityPct: 72.0 },
      { EnvLogID: 'ENV10', FacilityID: 'FAC04', LogTimestamp: '2026-09-10 10:00:00', SolarIrradiance: 890.0, WindSpeed: 4.5, WaterFlowRate: 0.0, Temperature: 33.0, HumidityPct: 40.0 },
    ]
  },
  {
    id: 'ENERGY_PRODUCTION_TIMESERIES',
    name: 'ENERGY_PRODUCTION_TIMESERIES',
    category: 'Telemetry',
    description: 'High-resolution time-series energy generation logged across generation units.',
    iconName: 'Activity',
    canvasPos: { x: 790, y: 80 },
    columns: [
      { name: 'ProductionID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'UnitID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'GENERATION_UNIT', referencesColumn: 'UnitID', isNullable: false },
      { name: 'ProductionTimestamp', type: 'TIMESTAMP', isNullable: false },
      { name: 'EnergyGeneratedKWh', type: 'DECIMAL(12,2)', isNullable: false },
      { name: 'GridFrequencyHz', type: 'DECIMAL(5,2)', defaultValue: '50.00' },
      { name: 'CapacityFactorPct', type: 'DECIMAL(5,2)', isNullable: false },
    ],
    initialRows: [
      { ProductionID: 'PRD01', UnitID: 'U101', ProductionTimestamp: '2026-09-10 09:00:00', EnergyGeneratedKWh: 410.0, GridFrequencyHz: 50.02, CapacityFactorPct: 82.0 },
      { ProductionID: 'PRD02', UnitID: 'U101', ProductionTimestamp: '2026-09-10 10:00:00', EnergyGeneratedKWh: 480.0, GridFrequencyHz: 49.98, CapacityFactorPct: 96.0 },
      { ProductionID: 'PRD03', UnitID: 'U101', ProductionTimestamp: '2026-09-10 11:00:00', EnergyGeneratedKWh: 492.0, GridFrequencyHz: 50.01, CapacityFactorPct: 98.4 },
      { ProductionID: 'PRD04', UnitID: 'U101', ProductionTimestamp: '2026-09-10 12:00:00', EnergyGeneratedKWh: 495.0, GridFrequencyHz: 50.0, CapacityFactorPct: 99.0 },
      { ProductionID: 'PRD05', UnitID: 'U102', ProductionTimestamp: '2026-09-10 09:00:00', EnergyGeneratedKWh: 405.0, GridFrequencyHz: 50.01, CapacityFactorPct: 81.0 },
      { ProductionID: 'PRD06', UnitID: 'U102', ProductionTimestamp: '2026-09-10 10:00:00', EnergyGeneratedKWh: 475.5, GridFrequencyHz: 49.99, CapacityFactorPct: 95.1 },
      { ProductionID: 'PRD07', UnitID: 'U102', ProductionTimestamp: '2026-09-10 11:00:00', EnergyGeneratedKWh: 488.0, GridFrequencyHz: 50.02, CapacityFactorPct: 97.6 },
      { ProductionID: 'PRD08', UnitID: 'U201', ProductionTimestamp: '2026-09-10 09:00:00', EnergyGeneratedKWh: 260.0, GridFrequencyHz: 50.0, CapacityFactorPct: 86.67 },
      { ProductionID: 'PRD09', UnitID: 'U201', ProductionTimestamp: '2026-09-10 10:00:00', EnergyGeneratedKWh: 290.0, GridFrequencyHz: 49.97, CapacityFactorPct: 96.67 },
      { ProductionID: 'PRD10', UnitID: 'U201', ProductionTimestamp: '2026-09-10 11:00:00', EnergyGeneratedKWh: 298.0, GridFrequencyHz: 50.03, CapacityFactorPct: 99.33 },
      { ProductionID: 'PRD11', UnitID: 'U202', ProductionTimestamp: '2026-09-10 10:00:00', EnergyGeneratedKWh: 295.0, GridFrequencyHz: 50.01, CapacityFactorPct: 98.33 },
      { ProductionID: 'PRD12', UnitID: 'U301', ProductionTimestamp: '2026-09-10 10:00:00', EnergyGeneratedKWh: 490.0, GridFrequencyHz: 50.0, CapacityFactorPct: 98.0 },
      { ProductionID: 'PRD13', UnitID: 'U302', ProductionTimestamp: '2026-09-10 10:00:00', EnergyGeneratedKWh: 485.0, GridFrequencyHz: 50.02, CapacityFactorPct: 97.0 },
      { ProductionID: 'PRD14', UnitID: 'U401', ProductionTimestamp: '2026-09-10 10:00:00', EnergyGeneratedKWh: 240.0, GridFrequencyHz: 50.0, CapacityFactorPct: 96.0 },
    ]
  },
  {
    id: 'IOT_SENSOR_REGISTRY',
    name: 'IOT_SENSOR_REGISTRY',
    category: 'Telemetry',
    description: 'Catalog of IoT sensors deployed across units (Pyranometers, Anemometers, Flowmeters).',
    iconName: 'Radio',
    canvasPos: { x: 420, y: 530 },
    columns: [
      { name: 'SensorID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'UnitID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'GENERATION_UNIT', referencesColumn: 'UnitID', isNullable: false },
      { name: 'SensorCategory', type: 'VARCHAR(50)', isNullable: false },
      { name: 'ModelNumber', type: 'VARCHAR(50)', isNullable: false },
      { name: 'SamplingIntervalSec', type: 'INTEGER', defaultValue: '10' },
      { name: 'Status', type: 'VARCHAR(20)', defaultValue: "'Active'" },
    ],
    initialRows: [
      { SensorID: 'SEN01', UnitID: 'U101', SensorCategory: 'Pyranometer', ModelNumber: 'Kipp-Zonen-CMP10', SamplingIntervalSec: 5, Status: 'Active' },
      { SensorID: 'SEN02', UnitID: 'U101', SensorCategory: 'Inverter Temperature Probe', ModelNumber: 'PT100-Industrial', SamplingIntervalSec: 10, Status: 'Active' },
      { SensorID: 'SEN03', UnitID: 'U201', SensorCategory: 'Ultrasonic Anemometer', ModelNumber: 'Gill-WindSonic', SamplingIntervalSec: 5, Status: 'Active' },
      { SensorID: 'SEN04', UnitID: 'U201', SensorCategory: 'Vibration Accelerometer', ModelNumber: 'PCB-Piezotronics-603C', SamplingIntervalSec: 1, Status: 'Active' },
      { SensorID: 'SEN05', UnitID: 'U301', SensorCategory: 'Hydrosonic Flowmeter', ModelNumber: 'Siemens-SITRANS-FUS', SamplingIntervalSec: 10, Status: 'Active' },
      { SensorID: 'SEN06', UnitID: 'U401', SensorCategory: 'Battery Cell Temp Matrix', ModelNumber: 'TexasInst-BQ79616', SamplingIntervalSec: 5, Status: 'Active' },
    ]
  },
  {
    id: 'IOT_TELEMETRY_LOG',
    name: 'IOT_TELEMETRY_LOG',
    category: 'Telemetry',
    description: 'High-frequency telemetry stream with nested STRUCT payloads and LIST diagnostic tags.',
    iconName: 'Layers',
    canvasPos: { x: 790, y: 530 },
    columns: [
      { name: 'TelemetryID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'SensorID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'IOT_SENSOR_REGISTRY', referencesColumn: 'SensorID', isNullable: false },
      { name: 'ReadingTimestamp', type: 'TIMESTAMP', isNullable: false },
      { name: 'MetricPayload', type: 'STRUCT', description: '{metric_name, reading_value, unit, calibration_offset}' },
      { name: 'DiagnosticFlags', type: 'VARCHAR[]', description: 'LIST of alarm / nominal tags' },
      { name: 'BatterySoCPct', type: 'DECIMAL(5,2)', isNullable: true },
    ],
    initialRows: [
      { TelemetryID: 'TEL01', SensorID: 'SEN01', ReadingTimestamp: '2026-09-10 09:59:58', MetricPayload: { metric_name: 'Solar Irradiance', reading_value: 950.45, unit: 'W/m2', calibration_offset: 0.02 }, DiagnosticFlags: ['NORMAL', 'HIGH_SOLAR_FLUX'], BatterySoCPct: null },
      { TelemetryID: 'TEL02', SensorID: 'SEN02', ReadingTimestamp: '2026-09-10 10:00:02', MetricPayload: { metric_name: 'Inverter Core Temp', reading_value: 48.2, unit: 'Celsius', calibration_offset: -0.1 }, DiagnosticFlags: ['NORMAL'], BatterySoCPct: null },
      { TelemetryID: 'TEL03', SensorID: 'SEN03', ReadingTimestamp: '2026-09-10 10:00:05', MetricPayload: { metric_name: 'Wind Velocity', reading_value: 14.82, unit: 'm/s', calibration_offset: 0.0 }, DiagnosticFlags: ['NORMAL', 'STEADY_GUST'], BatterySoCPct: null },
      { TelemetryID: 'TEL04', SensorID: 'SEN04', ReadingTimestamp: '2026-09-10 10:00:01', MetricPayload: { metric_name: 'Drive Shaft Vibration', reading_value: 1.85, unit: 'mm/s', calibration_offset: 0.05 }, DiagnosticFlags: ['NORMAL'], BatterySoCPct: null },
      { TelemetryID: 'TEL05', SensorID: 'SEN05', ReadingTimestamp: '2026-09-10 10:00:00', MetricPayload: { metric_name: 'Penstock Flow', reading_value: 180.5, unit: 'm3/s', calibration_offset: 0.0 }, DiagnosticFlags: ['OPTIMAL_HEAD'], BatterySoCPct: null },
      { TelemetryID: 'TEL06', SensorID: 'SEN06', ReadingTimestamp: '2026-09-10 10:00:04', MetricPayload: { metric_name: 'Battery Pack Temp', reading_value: 28.5, unit: 'Celsius', calibration_offset: 0.01 }, DiagnosticFlags: ['NORMAL', 'THERMAL_STABLE'], BatterySoCPct: 92.5 },
      { TelemetryID: 'TEL07', SensorID: 'SEN01', ReadingTimestamp: '2026-09-10 10:59:55', MetricPayload: { metric_name: 'Solar Irradiance', reading_value: 1021.1, unit: 'W/m2', calibration_offset: 0.02 }, DiagnosticFlags: ['PEAK_IRRADIANCE'], BatterySoCPct: null },
      { TelemetryID: 'TEL08', SensorID: 'SEN03', ReadingTimestamp: '2026-09-10 10:59:58', MetricPayload: { metric_name: 'Wind Velocity', reading_value: 15.65, unit: 'm/s', calibration_offset: 0.0 }, DiagnosticFlags: ['HIGH_YIELD_WIND'], BatterySoCPct: null },
    ]
  },
  {
    id: 'BATTERY_STORAGE_TELEMETRY',
    name: 'BATTERY_STORAGE_TELEMETRY',
    category: 'Storage',
    description: 'Specialized BESS telemetry tracking State of Charge, cycling, cell temperature, and power flows.',
    iconName: 'BatteryCharging',
    canvasPos: { x: 50, y: 980 },
    columns: [
      { name: 'BESSLogID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'FacilityID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'POWER_FACILITY', referencesColumn: 'FacilityID', isNullable: false },
      { name: 'LogTimestamp', type: 'TIMESTAMP', isNullable: false },
      { name: 'StateOfChargePct', type: 'DECIMAL(5,2)', isNullable: false },
      { name: 'CellTemperatureC', type: 'DECIMAL(5,2)', isNullable: false },
      { name: 'ChargeDischargeRateKW', type: 'DECIMAL(10,2)', isNullable: false },
      { name: 'CycleCount', type: 'INTEGER', isNullable: false },
    ],
    initialRows: [
      { BESSLogID: 'BESS01', FacilityID: 'FAC04', LogTimestamp: '2026-09-10 08:00:00', StateOfChargePct: 98.0, CellTemperatureC: 26.2, ChargeDischargeRateKW: -50.0, CycleCount: 214 },
      { BESSLogID: 'BESS02', FacilityID: 'FAC04', LogTimestamp: '2026-09-10 10:00:00', StateOfChargePct: 92.5, CellTemperatureC: 28.5, ChargeDischargeRateKW: -120.0, CycleCount: 214 },
      { BESSLogID: 'BESS03', FacilityID: 'FAC04', LogTimestamp: '2026-09-10 14:00:00', StateOfChargePct: 78.0, CellTemperatureC: 31.0, ChargeDischargeRateKW: -180.0, CycleCount: 214 },
      { BESSLogID: 'BESS04', FacilityID: 'FAC04', LogTimestamp: '2026-09-10 18:00:00', StateOfChargePct: 65.0, CellTemperatureC: 29.8, ChargeDischargeRateKW: -220.0, CycleCount: 215 },
      { BESSLogID: 'BESS05', FacilityID: 'FAC04', LogTimestamp: '2026-09-10 22:00:00', StateOfChargePct: 88.0, CellTemperatureC: 27.4, ChargeDischargeRateKW: 150.0, CycleCount: 215 },
    ]
  },
  {
    id: 'MAINTENANCE_ENGINEER',
    name: 'MAINTENANCE_ENGINEER',
    category: 'Assets',
    description: 'Certified reliability engineers overseeing preventive & corrective asset maintenance.',
    iconName: 'Wrench',
    canvasPos: { x: 1160, y: 80 },
    columns: [
      { name: 'EngineerID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'FirstName', type: 'VARCHAR(50)', isNullable: false },
      { name: 'LastName', type: 'VARCHAR(50)', isNullable: false },
      { name: 'Specialization', type: 'VARCHAR(50)', isNullable: false },
      { name: 'CertificationLevel', type: 'VARCHAR(40)', isNullable: false },
    ],
    initialRows: [
      { EngineerID: 'ENG01', FirstName: 'Rahul', LastName: 'Sharma', Specialization: 'Solar Inverters & High Voltage', CertificationLevel: 'Master Reliability Engineer' },
      { EngineerID: 'ENG02', FirstName: 'Priya', LastName: 'Nair', Specialization: 'Wind Turbines & Aerodynamics', CertificationLevel: 'Lead Turbomachinery Specialist' },
      { EngineerID: 'ENG03', FirstName: 'Amit', LastName: 'Verma', Specialization: 'Hydro Turbines & Governors', CertificationLevel: 'Chief Hydrologist' },
      { EngineerID: 'ENG04', FirstName: 'Sneha', LastName: 'Patel', Specialization: 'Electrochemical Energy Storage', CertificationLevel: 'Certified Battery Systems Engineer' },
    ]
  },
  {
    id: 'EQUIPMENT_MAINTENANCE_LOG',
    name: 'EQUIPMENT_MAINTENANCE_LOG',
    category: 'Assets',
    description: 'Maintenance inspection records, component replacements, downtime, and costs.',
    iconName: 'FileText',
    canvasPos: { x: 1160, y: 480 },
    columns: [
      { name: 'MaintenanceID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'UnitID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'GENERATION_UNIT', referencesColumn: 'UnitID', isNullable: false },
      { name: 'EngineerID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'MAINTENANCE_ENGINEER', referencesColumn: 'EngineerID', isNullable: false },
      { name: 'MaintenanceDate', type: 'DATE', isNullable: false },
      { name: 'ActionTaken', type: 'VARCHAR(255)', isNullable: false },
      { name: 'DowntimeHours', type: 'DECIMAL(6,2)', isNullable: false },
      { name: 'MaintenanceCost', type: 'DECIMAL(10,2)', isNullable: false },
      { name: 'ComponentReplaced', type: 'VARCHAR(100)', isNullable: true },
    ],
    initialRows: [
      { MaintenanceID: 'MNT01', UnitID: 'U103', EngineerID: 'ENG01', MaintenanceDate: '2026-09-08', ActionTaken: 'Inverter MPPT Calibration & IGBT Module Replacement', DowntimeHours: 14.5, MaintenanceCost: 12500.0, ComponentReplaced: 'IGBT Module 1200V' },
      { MaintenanceID: 'MNT02', UnitID: 'U203', EngineerID: 'ENG02', MaintenanceDate: '2026-09-05', ActionTaken: 'Pitch Control Hydraulic Bleed & Gearbox Oil Flushing', DowntimeHours: 8.0, MaintenanceCost: 18000.0, ComponentReplaced: 'Hydraulic Seal Kit' },
      { MaintenanceID: 'MNT03', UnitID: 'U302', EngineerID: 'ENG03', MaintenanceDate: '2026-08-20', ActionTaken: 'Draft Tube Cavitation Inspection & Runner Polish', DowntimeHours: 24.0, MaintenanceCost: 25000.0, ComponentReplaced: 'Cavitation Sacrificial Anodes' },
      { MaintenanceID: 'MNT04', UnitID: 'U402', EngineerID: 'ENG04', MaintenanceDate: '2026-09-02', ActionTaken: 'BMS Sensor Calibration & Coolant Loop Balancing', DowntimeHours: 4.5, MaintenanceCost: 7500.0, ComponentReplaced: 'Glycol Coolant Valve' },
    ]
  },
  {
    id: 'DISTRIBUTION_COMPANY',
    name: 'DISTRIBUTION_COMPANY',
    category: 'Grid',
    description: 'Power distribution utilities (DISCOMs) purchasing clean generated power.',
    iconName: 'Building',
    canvasPos: { x: 1530, y: 80 },
    columns: [
      { name: 'CompanyID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'CompanyName', type: 'VARCHAR(100)', isNullable: false },
      { name: 'LicenseNumber', type: 'VARCHAR(50)', isNullable: false },
      { name: 'ContactEmail', type: 'VARCHAR(100)', isNullable: false },
      { name: 'GridRegion', type: 'VARCHAR(50)', isNullable: false },
    ],
    initialRows: [
      { CompanyID: 'DIS01', CompanyName: 'Northern Regional Grid Power Corp', LicenseNumber: 'LIC-NRG-2021', ContactEmail: 'contracts@nrgpower.gov.in', GridRegion: 'Northern Grid' },
      { CompanyID: 'DIS02', CompanyName: 'Southern Grid Clean Energy Ltd', LicenseNumber: 'LIC-SGE-4055', ContactEmail: 'dispatch@southerngrid.com', GridRegion: 'Southern Grid' },
      { CompanyID: 'DIS03', CompanyName: 'Western Energy Distribution Utility', LicenseNumber: 'LIC-WED-9921', ContactEmail: 'trading@westernenergy.org', GridRegion: 'Western Grid' },
    ]
  },
  {
    id: 'SUPPLY_AGREEMENT',
    name: 'SUPPLY_AGREEMENT',
    category: 'Grid',
    description: 'Long-term Power Purchase Agreements (PPAs) between generation plants and utilities.',
    iconName: 'ShieldCheck',
    canvasPos: { x: 1530, y: 480 },
    columns: [
      { name: 'AgreementID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'FacilityID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'POWER_FACILITY', referencesColumn: 'FacilityID', isNullable: false },
      { name: 'CompanyID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'DISTRIBUTION_COMPANY', referencesColumn: 'CompanyID', isNullable: false },
      { name: 'StartDate', type: 'DATE', isNullable: false },
      { name: 'EndDate', type: 'DATE', isNullable: false },
      { name: 'ContractedCapacityMW', type: 'DECIMAL(8,2)', isNullable: false },
      { name: 'TariffPerKWh', type: 'DECIMAL(6,4)', isNullable: false },
      { name: 'AgreementStatus', type: 'VARCHAR(20)', defaultValue: "'Active'" },
    ],
    initialRows: [
      { AgreementID: 'AGR01', FacilityID: 'FAC01', CompanyID: 'DIS01', StartDate: '2025-01-01', EndDate: '2045-01-01', ContractedCapacityMW: 1200.0, TariffPerKWh: 0.0425, AgreementStatus: 'Active' },
      { AgreementID: 'AGR02', FacilityID: 'FAC02', CompanyID: 'DIS02', StartDate: '2024-06-01', EndDate: '2044-06-01', ContractedCapacityMW: 800.0, TariffPerKWh: 0.051, AgreementStatus: 'Active' },
      { AgreementID: 'AGR03', FacilityID: 'FAC03', CompanyID: 'DIS01', StartDate: '2023-01-01', EndDate: '2048-01-01', ContractedCapacityMW: 600.0, TariffPerKWh: 0.048, AgreementStatus: 'Active' },
      { AgreementID: 'AGR04', FacilityID: 'FAC04', CompanyID: 'DIS03', StartDate: '2026-01-01', EndDate: '2036-01-01', ContractedCapacityMW: 250.0, TariffPerKWh: 0.065, AgreementStatus: 'Active' },
    ]
  },
  {
    id: 'ELECTRICITY_DISTRIBUTION',
    name: 'ELECTRICITY_DISTRIBUTION',
    category: 'Grid',
    description: 'Periodic physical grid dispatch logs and transmission losses.',
    iconName: 'Send',
    canvasPos: { x: 1530, y: 920 },
    columns: [
      { name: 'DistributionID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'AgreementID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'SUPPLY_AGREEMENT', referencesColumn: 'AgreementID', isNullable: false },
      { name: 'DispatchTimestamp', type: 'TIMESTAMP', isNullable: false },
      { name: 'EnergySuppliedMWh', type: 'DECIMAL(10,2)', isNullable: false },
      { name: 'TransmissionLossPct', type: 'DECIMAL(5,2)', defaultValue: '2.10' },
    ],
    initialRows: [
      { DistributionID: 'DST01', AgreementID: 'AGR01', DispatchTimestamp: '2026-09-10 12:00:00', EnergySuppliedMWh: 1420.5, TransmissionLossPct: 1.85 },
      { DistributionID: 'DST02', AgreementID: 'AGR02', DispatchTimestamp: '2026-09-10 12:00:00', EnergySuppliedMWh: 890.2, TransmissionLossPct: 2.1 },
      { DistributionID: 'DST03', AgreementID: 'AGR03', DispatchTimestamp: '2026-09-10 12:00:00', EnergySuppliedMWh: 740.0, TransmissionLossPct: 1.95 },
      { DistributionID: 'DST04', AgreementID: 'AGR04', DispatchTimestamp: '2026-09-10 12:00:00', EnergySuppliedMWh: 210.8, TransmissionLossPct: 2.4 },
    ]
  },
  {
    id: 'REGULATORY_AGENCY',
    name: 'REGULATORY_AGENCY',
    category: 'Compliance',
    description: 'Government regulatory bodies overseeing statutory grid compliance and safety standards.',
    iconName: 'Award',
    canvasPos: { x: 1900, y: 80 },
    columns: [
      { name: 'AgencyID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'AgencyName', type: 'VARCHAR(100)', isNullable: false },
      { name: 'Jurisdiction', type: 'VARCHAR(50)', isNullable: false },
    ],
    initialRows: [
      { AgencyID: 'REG01', AgencyName: 'Central Electricity Regulatory Commission (CERC)', Jurisdiction: 'National / Federal' },
      { AgencyID: 'REG02', AgencyName: 'State Pollution Control Board (SPCB)', Jurisdiction: 'Regional / Environmental' },
      { AgencyID: 'REG03', AgencyName: 'Bureau of Energy Efficiency (BEE)', Jurisdiction: 'National / Sustainability' },
    ]
  },
  {
    id: 'COMPLIANCE_INSPECTION',
    name: 'COMPLIANCE_INSPECTION',
    category: 'Compliance',
    description: 'Statutory compliance inspections, environmental audits, and safety scorecards.',
    iconName: 'ClipboardCheck',
    canvasPos: { x: 1900, y: 480 },
    columns: [
      { name: 'InspectionID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'FacilityID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'POWER_FACILITY', referencesColumn: 'FacilityID', isNullable: false },
      { name: 'AgencyID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'REGULATORY_AGENCY', referencesColumn: 'AgencyID', isNullable: false },
      { name: 'InspectionDate', type: 'DATE', isNullable: false },
      { name: 'ComplianceStatus', type: 'VARCHAR(30)', isNullable: false },
      { name: 'AuditScore', type: 'DECIMAL(5,2)', isNullable: false },
      { name: 'Notes', type: 'VARCHAR(255)', isNullable: false },
    ],
    initialRows: [
      { InspectionID: 'INS01', FacilityID: 'FAC01', AgencyID: 'REG01', InspectionDate: '2026-08-15', ComplianceStatus: 'Compliant', AuditScore: 98.5, Notes: 'Inverter grid synchronisation and harmonics verified within IEEE 519 standards.' },
      { InspectionID: 'INS02', FacilityID: 'FAC02', AgencyID: 'REG02', InspectionDate: '2026-07-22', ComplianceStatus: 'Compliant', AuditScore: 95.0, Notes: 'Avian collision prevention radars and acoustic noise levels fully verified.' },
      { InspectionID: 'INS03', FacilityID: 'FAC03', AgencyID: 'REG02', InspectionDate: '2026-06-30', ComplianceStatus: 'Compliant', AuditScore: 96.2, Notes: 'Environmental flow discharge and silt management audited with zero violations.' },
      { InspectionID: 'INS04', FacilityID: 'FAC04', AgencyID: 'REG03', InspectionDate: '2026-08-05', ComplianceStatus: 'Compliant', AuditScore: 99.1, Notes: 'Thermal runaway mitigation and containment barriers certified under NFPA 855.' },
    ]
  },
  {
    id: 'CARBON_CREDIT_LEDGER',
    name: 'CARBON_CREDIT_LEDGER',
    category: 'Compliance',
    description: 'Certified emission reduction (CER) credits issued, verified offset tonnage, and valuation.',
    iconName: 'Leaf',
    canvasPos: { x: 1900, y: 920 },
    columns: [
      { name: 'CreditID', type: 'VARCHAR(10)', isPrimaryKey: true, isNullable: false },
      { name: 'FacilityID', type: 'VARCHAR(10)', isForeignKey: true, referencesTable: 'POWER_FACILITY', referencesColumn: 'FacilityID', isNullable: false },
      { name: 'IssuanceDate', type: 'DATE', isNullable: false },
      { name: 'CreditsIssued', type: 'INTEGER', isNullable: false },
      { name: 'CO2OffsetTons', type: 'DECIMAL(10,2)', isNullable: false },
      { name: 'Standard', type: 'VARCHAR(50)', defaultValue: "'Gold Standard'" },
      { name: 'MarketValueUSD', type: 'DECIMAL(12,2)', isNullable: false },
    ],
    initialRows: [
      { CreditID: 'CRD01', FacilityID: 'FAC01', IssuanceDate: '2026-09-01', CreditsIssued: 5400, CO2OffsetTons: 5238.0, Standard: 'Gold Standard', MarketValueUSD: 130950.0 },
      { CreditID: 'CRD02', FacilityID: 'FAC02', IssuanceDate: '2026-09-01', CreditsIssued: 3800, CO2OffsetTons: 3686.0, Standard: 'Verra VCS', MarketValueUSD: 92150.0 },
      { CreditID: 'CRD03', FacilityID: 'FAC03', IssuanceDate: '2026-09-01', CreditsIssued: 2900, CO2OffsetTons: 2813.0, Standard: 'Gold Standard', MarketValueUSD: 70325.0 },
      { CreditID: 'CRD04', FacilityID: 'FAC04', IssuanceDate: '2026-09-01', CreditsIssued: 1200, CO2OffsetTons: 1164.0, Standard: 'Clean Development Mechanism', MarketValueUSD: 29100.0 },
    ]
  }
];

export const INITIAL_RELATIONS: TableRelation[] = [
  { id: 'rel-1', sourceTable: 'GENERATION_UNIT', sourceColumn: 'FacilityID', targetTable: 'POWER_FACILITY', targetColumn: 'FacilityID', type: 'many-to-one', label: 'belongs to facility' },
  { id: 'rel-2', sourceTable: 'ENVIRONMENTAL_TELEMETRY', sourceColumn: 'FacilityID', targetTable: 'POWER_FACILITY', targetColumn: 'FacilityID', type: 'many-to-one', label: 'facility weather stream' },
  { id: 'rel-3', sourceTable: 'ENERGY_PRODUCTION_TIMESERIES', sourceColumn: 'UnitID', targetTable: 'GENERATION_UNIT', targetColumn: 'UnitID', type: 'many-to-one', label: 'generated by unit' },
  { id: 'rel-4', sourceTable: 'IOT_SENSOR_REGISTRY', sourceColumn: 'UnitID', targetTable: 'GENERATION_UNIT', targetColumn: 'UnitID', type: 'many-to-one', label: 'monitors unit' },
  { id: 'rel-5', sourceTable: 'IOT_TELEMETRY_LOG', sourceColumn: 'SensorID', targetTable: 'IOT_SENSOR_REGISTRY', targetColumn: 'SensorID', type: 'many-to-one', label: 'logged from sensor' },
  { id: 'rel-6', sourceTable: 'BATTERY_STORAGE_TELEMETRY', sourceColumn: 'FacilityID', targetTable: 'POWER_FACILITY', targetColumn: 'FacilityID', type: 'many-to-one', label: 'BESS telemetry' },
  { id: 'rel-7', sourceTable: 'EQUIPMENT_MAINTENANCE_LOG', sourceColumn: 'UnitID', targetTable: 'GENERATION_UNIT', targetColumn: 'UnitID', type: 'many-to-one', label: 'serviced unit' },
  { id: 'rel-8', sourceTable: 'EQUIPMENT_MAINTENANCE_LOG', sourceColumn: 'EngineerID', targetTable: 'MAINTENANCE_ENGINEER', targetColumn: 'EngineerID', type: 'many-to-one', label: 'performed by engineer' },
  { id: 'rel-9', sourceTable: 'SUPPLY_AGREEMENT', sourceColumn: 'FacilityID', targetTable: 'POWER_FACILITY', targetColumn: 'FacilityID', type: 'many-to-one', label: 'originates from' },
  { id: 'rel-10', sourceTable: 'SUPPLY_AGREEMENT', sourceColumn: 'CompanyID', targetTable: 'DISTRIBUTION_COMPANY', targetColumn: 'CompanyID', type: 'many-to-one', label: 'contracted with utility' },
  { id: 'rel-11', sourceTable: 'ELECTRICITY_DISTRIBUTION', sourceColumn: 'AgreementID', targetTable: 'SUPPLY_AGREEMENT', targetColumn: 'AgreementID', type: 'many-to-one', label: 'dispatched under PPA' },
  { id: 'rel-12', sourceTable: 'COMPLIANCE_INSPECTION', sourceColumn: 'FacilityID', targetTable: 'POWER_FACILITY', targetColumn: 'FacilityID', type: 'many-to-one', label: 'facility audited' },
  { id: 'rel-13', sourceTable: 'COMPLIANCE_INSPECTION', sourceColumn: 'AgencyID', targetTable: 'REGULATORY_AGENCY', targetColumn: 'AgencyID', type: 'many-to-one', label: 'inspected by agency' },
  { id: 'rel-14', sourceTable: 'CARBON_CREDIT_LEDGER', sourceColumn: 'FacilityID', targetTable: 'POWER_FACILITY', targetColumn: 'FacilityID', type: 'many-to-one', label: 'offsets generated by' },
];

export interface SQLBenchmarkQuery {
  id: string;
  name: string;
  featureTag: string;
  description: string;
  sql: string;
  sampleColumns: string[];
  sampleRows: any[][];
  executionTimeMs: number;
}

export const BENCHMARK_QUERIES: SQLBenchmarkQuery[] = [
  {
    id: 'Q01',
    name: 'Vectorized ASOF Temporal Alignment',
    featureTag: 'ASOF JOIN',
    description: 'Fuzzy timestamp alignment matching continuous IoT sensor readings to nearest weather condition in O(N log M) time.',
    sql: `SELECT 
    t.TelemetryID, t.SensorID, r.SensorCategory,
    t.ReadingTimestamp AS SensorTime,
    ROUND(t.MetricPayload.reading_value, 2) AS SensorVal,
    e.LogTimestamp AS NearestEnvTime,
    e.SolarIrradiance, e.WindSpeed, e.Temperature
FROM IOT_TELEMETRY_LOG t
JOIN IOT_SENSOR_REGISTRY r ON t.SensorID = r.SensorID
JOIN GENERATION_UNIT u ON r.UnitID = u.UnitID
ASOF JOIN ENVIRONMENTAL_TELEMETRY e 
    ON u.FacilityID = e.FacilityID 
    AND t.ReadingTimestamp >= e.LogTimestamp
ORDER BY t.ReadingTimestamp;`,
    sampleColumns: ['TelemetryID', 'SensorID', 'Category', 'SensorTime', 'SensorVal', 'EnvTime', 'SolarIrr', 'WindSpd', 'TempC'],
    sampleRows: [
      ['TEL01', 'SEN01', 'Pyranometer', '09:59:58', 950.45, '09:00:00', 820.00, 2.10, 31.5],
      ['TEL05', 'SEN05', 'Hydrosonic Flowmeter', '10:00:00', 180.50, '10:00:00', 100.00, 1.20, 21.0],
      ['TEL04', 'SEN04', 'Vibration Accelerometer', '10:00:01', 1.85, '10:00:00', 210.00, 14.80, 27.0],
      ['TEL02', 'SEN02', 'Inverter Temp Probe', '10:00:02', 48.20, '10:00:00', 950.50, 2.50, 34.5],
      ['TEL06', 'SEN06', 'Battery Cell Temp', '10:00:04', 28.50, '10:00:00', 890.00, 4.50, 33.0],
      ['TEL03', 'SEN03', 'Ultrasonic Anemometer', '10:00:05', 14.82, '10:00:00', 210.00, 14.80, 27.0],
      ['TEL07', 'SEN01', 'Pyranometer', '10:59:55', 1021.10, '10:00:00', 950.50, 2.50, 34.5],
      ['TEL08', 'SEN03', 'Ultrasonic Anemometer', '10:59:58', 15.65, '10:00:00', 210.00, 14.80, 27.0],
    ],
    executionTimeMs: 1.4
  },
  {
    id: 'Q02',
    name: 'Time-Series Downsampling & Bucketing',
    featureTag: 'time_bucket',
    description: 'Downsamples streaming production data into 1-hour analytical dispatch windows with peak, average, and total generation.',
    sql: `SELECT 
    time_bucket(INTERVAL '1 hour', ProductionTimestamp) AS TimeWindow,
    u.FacilityID, COUNT(ProductionID) AS ReadingCount,
    ROUND(SUM(EnergyGeneratedKWh), 2) AS TotalEnergyKWh,
    ROUND(AVG(CapacityFactorPct), 2) AS AvgCapacityFactorPct
FROM ENERGY_PRODUCTION_TIMESERIES p
JOIN GENERATION_UNIT u ON p.UnitID = u.UnitID
GROUP BY TimeWindow, u.FacilityID
ORDER BY TimeWindow, u.FacilityID;`,
    sampleColumns: ['TimeWindow', 'FacilityID', 'Readings', 'TotalEnergyKWh', 'AvgCapacityFactorPct'],
    sampleRows: [
      ['2026-09-10 09:00:00', 'FAC01', 2, 815.00, 81.50],
      ['2026-09-10 09:00:00', 'FAC02', 1, 260.00, 86.67],
      ['2026-09-10 10:00:00', 'FAC01', 2, 955.50, 95.55],
      ['2026-09-10 10:00:00', 'FAC02', 2, 585.00, 97.50],
      ['2026-09-10 10:00:00', 'FAC03', 2, 975.00, 97.50],
      ['2026-09-10 10:00:00', 'FAC04', 1, 240.00, 96.00],
      ['2026-09-10 11:00:00', 'FAC01', 2, 980.00, 98.00],
      ['2026-09-10 11:00:00', 'FAC02', 1, 298.00, 99.33],
      ['2026-09-10 12:00:00', 'FAC01', 1, 495.00, 99.00],
    ],
    executionTimeMs: 1.8
  },
  {
    id: 'Q03',
    name: 'Window Moving Average & Anomaly Flagging',
    featureTag: 'WINDOW FRAMES',
    description: 'Computes a 3-period rolling average per turbine and flags anomalies where output deviates by more than 10%.',
    sql: `SELECT 
    ProductionID, UnitID, ProductionTimestamp, EnergyGeneratedKWh,
    ROUND(AVG(EnergyGeneratedKWh) OVER (
        PARTITION BY UnitID ORDER BY ProductionTimestamp 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS RollingAvg3PeriodKWh,
    CASE 
        WHEN EnergyGeneratedKWh < 0.90 * AVG(EnergyGeneratedKWh) OVER (
            PARTITION BY UnitID ORDER BY ProductionTimestamp 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) THEN 'UNDERPERFORMING'
        ELSE 'NORMAL'
    END AS PerformanceFlag
FROM ENERGY_PRODUCTION_TIMESERIES
ORDER BY UnitID, ProductionTimestamp;`,
    sampleColumns: ['ProductionID', 'UnitID', 'Timestamp', 'EnergyKWh', 'RollingAvg', 'StatusFlag'],
    sampleRows: [
      ['PRD01', 'U101', '09:00:00', 410.00, 410.00, 'NORMAL'],
      ['PRD02', 'U101', '10:00:00', 480.00, 445.00, 'NORMAL'],
      ['PRD03', 'U101', '11:00:00', 492.00, 460.67, 'NORMAL'],
      ['PRD04', 'U101', '12:00:00', 495.00, 489.00, 'NORMAL'],
      ['PRD08', 'U201', '09:00:00', 260.00, 260.00, 'NORMAL'],
      ['PRD09', 'U201', '10:00:00', 290.00, 275.00, 'NORMAL'],
      ['PRD10', 'U201', '11:00:00', 298.00, 282.67, 'NORMAL'],
    ],
    executionTimeMs: 1.1
  },
  {
    id: 'Q04',
    name: 'Dynamic Cross-Tabulation (PIVOT)',
    featureTag: 'NATIVE PIVOT',
    description: 'Reshapes disparate IoT sensor telemetry metrics into dedicated tabular columns without manual CASE aggregation.',
    sql: `PIVOT (
    SELECT 
        t.ReadingTimestamp,
        t.MetricPayload.metric_name AS Metric,
        t.MetricPayload.reading_value AS Value
    FROM IOT_TELEMETRY_LOG t
)
ON Metric
USING FIRST(Value);`,
    sampleColumns: ['Timestamp', 'Solar Irradiance', 'Inverter Core Temp', 'Wind Velocity', 'Vibration', 'Penstock Flow', 'Battery Temp'],
    sampleRows: [
      ['2026-09-10 09:59:58', 950.45, null, null, null, null, null],
      ['2026-09-10 10:00:00', null, null, null, null, 180.50, null],
      ['2026-09-10 10:00:01', null, null, null, 1.85, null, null],
      ['2026-09-10 10:00:02', null, 48.20, null, null, null, null],
      ['2026-09-10 10:00:04', null, null, null, null, null, 28.50],
      ['2026-09-10 10:00:05', null, null, 14.82, null, null, null],
      ['2026-09-10 10:59:55', 1021.10, null, null, null, null, null],
      ['2026-09-10 10:59:58', null, null, 15.65, null, null, null],
    ],
    executionTimeMs: 1.9
  },
  {
    id: 'Q05',
    name: 'Multi-Dimensional Hierarchical Rollup',
    featureTag: 'ROLLUP',
    description: 'Generates executive aggregations across Region and Facility Type with automatic intermediate and grand totals.',
    sql: `SELECT 
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
ORDER BY f.Region NULLS LAST, f.FacilityType NULLS LAST;`,
    sampleColumns: ['Region', 'FacilityType', 'FacilityCount', 'TotalUnits', 'RatedKW', 'TotalGeneratedKWh'],
    sampleRows: [
      ['Gujarat', 'Battery Storage', 1, 2, 500.00, 240.00],
      ['Gujarat', '--> ALL TYPES', 1, 2, 500.00, 240.00],
      ['Rajasthan', 'Solar Farm', 1, 3, 1450.00, 2845.50],
      ['Rajasthan', '--> ALL TYPES', 1, 3, 1450.00, 2845.50],
      ['Tamil Nadu', 'Wind Farm', 1, 3, 900.00, 1143.00],
      ['Tamil Nadu', '--> ALL TYPES', 1, 3, 900.00, 1143.00],
      ['Uttarakhand', 'Hydroelectric Station', 1, 2, 1000.00, 975.00],
      ['Uttarakhand', '--> ALL TYPES', 1, 2, 1000.00, 975.00],
      ['--> ALL REGIONS', '--> ALL TYPES', 4, 10, 3850.00, 5203.50],
    ],
    executionTimeMs: 1.3
  },
  {
    id: 'Q06',
    name: 'BESS Battery Storage & Degradation Analytics',
    featureTag: 'BESS ANALYTICS',
    description: 'Analyzes battery charging/discharging state, thermal stability, and State of Health (SoH) on Khavda Substation.',
    sql: `SELECT 
    b.BESSLogID, f.FacilityName, b.LogTimestamp,
    b.StateOfChargePct, b.CellTemperatureC, b.ChargeDischargeRateKW,
    CASE 
        WHEN b.ChargeDischargeRateKW < 0 THEN 'DISCHARGING'
        WHEN b.ChargeDischargeRateKW > 0 THEN 'CHARGING'
        ELSE 'IDLE'
    END AS OperationalMode,
    b.CycleCount,
    ROUND(100.0 - (b.CycleCount * 0.015), 2) AS EstimatedStateOfHealthPct
FROM BATTERY_STORAGE_TELEMETRY b
JOIN POWER_FACILITY f ON b.FacilityID = f.FacilityID
ORDER BY b.LogTimestamp;`,
    sampleColumns: ['LogID', 'FacilityName', 'Timestamp', 'SoC %', 'CellTemp °C', 'Flow kW', 'Mode', 'Cycles', 'SoH %'],
    sampleRows: [
      ['BESS01', 'Khavda BESS Substation', '08:00:00', 98.00, 26.20, -50.00, 'DISCHARGING', 214, 96.79],
      ['BESS02', 'Khavda BESS Substation', '10:00:00', 92.50, 28.50, -120.00, 'DISCHARGING', 214, 96.79],
      ['BESS03', 'Khavda BESS Substation', '14:00:00', 78.00, 31.00, -180.00, 'DISCHARGING', 214, 96.79],
      ['BESS04', 'Khavda BESS Substation', '18:00:00', 65.00, 29.80, -220.00, 'DISCHARGING', 215, 96.78],
      ['BESS05', 'Khavda BESS Substation', '22:00:00', 88.00, 27.40, 150.00, 'CHARGING', 215, 96.78],
    ],
    executionTimeMs: 0.9
  },
  {
    id: 'Q07',
    name: 'Vectorized Execution Profiling (EXPLAIN ANALYZE)',
    featureTag: 'EXPLAIN ANALYZE',
    description: 'Inspects physical vectorized operator execution pipeline, hash join build/probe phases, and CPU timings.',
    sql: `EXPLAIN ANALYZE
SELECT 
    f.FacilityName, u.UnitType,
    ROUND(SUM(p.EnergyGeneratedKWh), 2) AS TotalEnergy
FROM POWER_FACILITY f
JOIN GENERATION_UNIT u ON f.FacilityID = u.FacilityID
JOIN ENERGY_PRODUCTION_TIMESERIES p ON u.UnitID = p.UnitID
WHERE p.CapacityFactorPct >= 90.00
GROUP BY f.FacilityName, u.UnitType;`,
    sampleColumns: ['Operator', 'Execution Time', 'Rows Processed', 'Vector Pipeline State'],
    sampleRows: [
      ['HASH_GROUP_BY', '0.0001s', '7 rows', 'Vectorized Parallel Morsel Aggregation'],
      ['PROJECTION', '0.0000s', '11 rows', 'Direct Column Expression Evaluation'],
      ['HASH_JOIN (FacilityID)', '0.0001s', '11 rows', 'SIMD Hash Probe & Filter'],
      ['TABLE_SCAN (POWER_FACILITY)', '0.0000s', '4 rows', 'Sequential Columnar Chunk Scan'],
      ['TABLE_SCAN (ENERGY_PRODUCTION)', '0.0001s', '11 rows', 'Pushed down Filter: CapacityFactor >= 90.0'],
    ],
    executionTimeMs: 0.6
  }
];
