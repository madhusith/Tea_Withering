export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "manager" | "viewer";
export type DeviceType = "TROUGH" | "DRYER";
export type OperationalStatus = "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE" | "SENSOR_FAULT";
export type AlarmEventType = "TRIGGERED" | "ACKNOWLEDGED" | "SNOOZED" | "UNSNOOZED" | "CLEARED";
export type ConfigurationStatus = "SAVED" | "PENDING" | "APPLIED" | "FAILED";
export type RemoteCommandStatus = "PENDING" | "SENT" | "ACKNOWLEDGED" | "FAILED" | "EXPIRED";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      factories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string | null;
          location: string | null;
          timezone: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code?: string | null;
          location?: string | null;
          timezone?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          code?: string | null;
          location?: string | null;
          timezone?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
          created_at?: string;
          updated_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          factory_id: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          factory_id?: string | null;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          factory_id?: string | null;
          role?: UserRole;
          created_at?: string;
        };
      };
      gateways: {
        Row: {
          id: string;
          factory_id: string;
          serial_number: string;
          firmware_version: string;
          ip_address: string | null;
          last_seen_at: string | null;
          status: OperationalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          factory_id: string;
          serial_number: string;
          firmware_version?: string;
          ip_address?: string | null;
          last_seen_at?: string | null;
          status?: OperationalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          factory_id?: string;
          serial_number?: string;
          firmware_version?: string;
          ip_address?: string | null;
          last_seen_at?: string | null;
          status?: OperationalStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          factory_id: string;
          gateway_id: string | null;
          device_code: string;
          name: string;
          type: DeviceType;
          lora_address: string | null;
          hardware_serial: string | null;
          firmware_version: string | null;
          active: boolean;
          installed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          factory_id: string;
          gateway_id?: string | null;
          device_code: string;
          name: string;
          type: DeviceType;
          lora_address?: string | null;
          hardware_serial?: string | null;
          firmware_version?: string | null;
          active?: boolean;
          installed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          factory_id?: string;
          gateway_id?: string | null;
          device_code?: string;
          name?: string;
          type?: DeviceType;
          lora_address?: string | null;
          hardware_serial?: string | null;
          firmware_version?: string | null;
          active?: boolean;
          installed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      readings: {
        Row: {
          id: string;
          device_id: string;
          gateway_id: string | null;
          captured_at: string;
          received_at: string;
          temp_dry: number | null;
          temp_wet: number | null;
          delta: number | null;
          temperature: number | null;
          sequence_no: number;
          boot_id: string;
          sensor_fault_code: string | null;
          rssi: number | null;
          snr: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          gateway_id?: string | null;
          captured_at: string;
          received_at?: string;
          temp_dry?: number | null;
          temp_wet?: number | null;
          delta?: number | null;
          temperature?: number | null;
          sequence_no: number;
          boot_id: string;
          sensor_fault_code?: string | null;
          rssi?: number | null;
          snr?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          gateway_id?: string | null;
          captured_at?: string;
          received_at?: string;
          temp_dry?: number | null;
          temp_wet?: number | null;
          delta?: number | null;
          temperature?: number | null;
          sequence_no?: number;
          boot_id?: string;
          sensor_fault_code?: string | null;
          rssi?: number | null;
          snr?: number | null;
          created_at?: string;
        };
      };
      alarm_rules: {
        Row: {
          id: string;
          factory_id: string;
          device_id: string | null;
          device_type: DeviceType;
          metric: string;
          min_value: number | null;
          max_value: number | null;
          duration_seconds: number;
          hysteresis: number;
          severity: "INFO" | "WARNING" | "CRITICAL";
          enabled: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          factory_id: string;
          device_id?: string | null;
          device_type: DeviceType;
          metric: string;
          min_value?: number | null;
          max_value?: number | null;
          duration_seconds?: number;
          hysteresis?: number;
          severity?: "INFO" | "WARNING" | "CRITICAL";
          enabled?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          factory_id?: string;
          device_id?: string | null;
          device_type?: DeviceType;
          metric?: string;
          min_value?: number | null;
          max_value?: number | null;
          duration_seconds?: number;
          hysteresis?: number;
          severity?: "INFO" | "WARNING" | "CRITICAL";
          enabled?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      alarms: {
        Row: {
          id: string;
          device_id: string;
          rule_id: string;
          state: "ACTIVE" | "ACKNOWLEDGED" | "SNOOZED" | "CLEARED";
          triggered_at: string;
          trigger_value: number;
          acknowledged_at: string | null;
          snoozed_until: string | null;
          cleared_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          rule_id: string;
          state?: "ACTIVE" | "ACKNOWLEDGED" | "SNOOZED" | "CLEARED";
          triggered_at?: string;
          trigger_value: number;
          acknowledged_at?: string | null;
          snoozed_until?: string | null;
          cleared_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          rule_id?: string;
          state?: "ACTIVE" | "ACKNOWLEDGED" | "SNOOZED" | "CLEARED";
          triggered_at?: string;
          trigger_value?: number;
          acknowledged_at?: string | null;
          snoozed_until?: string | null;
          cleared_at?: string | null;
          created_at?: string;
        };
      };
      alarm_events: {
        Row: {
          id: string;
          alarm_id: string;
          event_type: AlarmEventType;
          event_at: string;
          actor_user_id: string | null;
          source: string;
          details: Json | null;
        };
        Insert: {
          id?: string;
          alarm_id: string;
          event_type: AlarmEventType;
          event_at?: string;
          actor_user_id?: string | null;
          source?: string;
          details?: Json | null;
        };
        Update: {
          id?: string;
          alarm_id?: string;
          event_type?: AlarmEventType;
          event_at?: string;
          actor_user_id?: string | null;
          source?: string;
          details?: Json | null;
        };
      };
      device_status: {
        Row: {
          device_id: string;
          gateway_id: string | null;
          last_seen_at: string;
          status: OperationalStatus;
          last_sequence_no: number | null;
          battery_level: number | null;
          updated_at: string;
        };
        Insert: {
          device_id: string;
          gateway_id?: string | null;
          last_seen_at: string;
          status?: OperationalStatus;
          last_sequence_no?: number | null;
          battery_level?: number | null;
          updated_at?: string;
        };
        Update: {
          device_id?: string;
          gateway_id?: string | null;
          last_seen_at?: string;
          status?: OperationalStatus;
          last_sequence_no?: number | null;
          battery_level?: number | null;
          updated_at?: string;
        };
      };
    };
  };
}

