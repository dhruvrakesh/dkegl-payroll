
import { 
  CHART_TYPES, 
  TIME_PERIODS, 
  BATCH_STATUS, 
  JOB_STATUS, 
  TRANSFER_STATUS,
  EMAIL_STATUS,
  VARIABLE_TYPES,
  MESSAGE_TYPES,
  FILTER_VALUES,
  BATCH_PERIODS,
  QUICK_DATE_RANGES
} from './constants';

export type ChartType = typeof CHART_TYPES[keyof typeof CHART_TYPES];
export type TimePeriod = typeof TIME_PERIODS[keyof typeof TIME_PERIODS];
export type BatchStatus = typeof BATCH_STATUS[keyof typeof BATCH_STATUS];
export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];
export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];
export type TransferStatus = typeof TRANSFER_STATUS[keyof typeof TRANSFER_STATUS];
export type VariableType = typeof VARIABLE_TYPES[keyof typeof VARIABLE_TYPES];
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type FilterValue = typeof FILTER_VALUES[keyof typeof FILTER_VALUES];
export type BatchPeriod = typeof BATCH_PERIODS[keyof typeof BATCH_PERIODS];
export type QuickDateRange = typeof QUICK_DATE_RANGES[keyof typeof QUICK_DATE_RANGES];

// Attendance Status type
export type AttendanceStatus = 'PRESENT' | 'WEEKLY_OFF' | 'CASUAL_LEAVE' | 'EARNED_LEAVE' | 'UNPAID_LEAVE';

// Unified Attendance interface - SINGLE SOURCE OF TRUTH
export interface Attendance {
  attendance_id: string;
  employee_id: string;
  attendance_date: string;
  hours_worked: number;
  overtime_hours?: number; // Made optional to match database schema
  status: AttendanceStatus;
  payroll_employees?: { name: string };
  units?: { unit_name: string };
}

// Attendance-related types
export interface AttendanceFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  employeeIds: string[];
  unitIds: string[];
}

export interface Employee {
  id: string;
  name: string;
  unit_id?: string;
  active: boolean;
}

// Unified Upload Error interface
export interface UploadError {
  rowNumber: number;
  data: any;
  reason: string;
  category: 'validation' | 'duplicate' | 'missing_data' | 'database_error' | 'not_found';
  originalCode?: string;
  resolvedCode?: string;
}

// Unified Upload Result interface
export interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: UploadError[];
  batchId?: string;
}

// Bulk Update Result interface (extends UploadResult for consistency)
export interface BulkUpdateResult extends UploadResult {
  batchId: string; // Required for bulk updates
}
