export type UserRole = "admin" | "manager" | "viewer";

export type DeviceType = "TROUGH" | "DRYER";

export type DeviceStatus =
  | "NORMAL"
  | "WARNING"
  | "CRITICAL"
  | "OFFLINE"
  | "SENSOR_FAULT";

export interface TroughDevice {
  id: string;
  device_code: string;
  name: string;
  type: "TROUGH";
  factory_id: string;
  gateway_id: string;
  temp_dry: number;
  temp_wet: number;
  delta: number;
  status: DeviceStatus;
  status_message?: string;
  last_seen_at: string;
  sensor_dry_code?: string;
  sensor_wet_code?: string;
}

export interface DryerDevice {
  id: string;
  device_code: string;
  name: string;
  type: "DRYER";
  factory_id: string;
  gateway_id: string;
  temperature: number;
  target_temperature: number;
  status: DeviceStatus;
  status_message?: string;
  last_seen_at: string;
  sensor_code?: string;
  // NOTE: temp_wet and delta must NEVER exist on a Dryer
}

export type Device = TroughDevice | DryerDevice;

export interface Alert {
  id: string;
  factory_name: string;
  device_code: string;
  device_name: string;
  device_type: DeviceType;
  message: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "snoozed" | "resolved";
  triggered_at: string;
  acknowledged_at?: string;
  snoozed_until?: string;
  resolved_at?: string;
  trigger_value: number;
  resolved_by?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  factory_id?: string;
  factory_name?: string;
  status: "active" | "deactivated";
  created_at: string;
}

export interface ParameterThresholds {
  min_depression: number;
  max_depression: number;
  ambient_dry_min: number;
  ambient_dry_max: number;
  ambient_wet_min: number;
  ambient_wet_max: number;
  dryer_temp_min: number;
  dryer_temp_max: number;
  reading_interval_seconds: number;
  delivery_status: "saved" | "pending" | "applied" | "failed";
  last_updated_at: string;
  last_updated_by: string;
  version: string;
}

export interface TelemetryPoint {
  time: string;
  temp_dry?: number;
  temp_wet?: number;
  delta?: number;
  temperature?: number;
  target?: number;
}

