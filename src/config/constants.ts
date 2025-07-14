
// Filter Constants
export const FILTER_VALUES = {
  ALL_UNITS: 'all-units',
  ALL_EMPLOYEES: 'all-employees',
} as const;

// Chart Configuration
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar', 
  STACKED: 'stacked',
  COMPARISON: 'comparison',
} as const;

export const TIME_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly', 
  MONTHLY: 'monthly',
} as const;

export const BATCH_PERIODS = {
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

// Status Constants
export const BATCH_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed', 
  FAILED: 'failed',
} as const;

export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export const TRANSFER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

// Variable Types (from Supabase)
export const VARIABLE_TYPES = {
  FIXED: 'fixed',
  CALCULATED: 'calculated',
  EMPLOYEE_SPECIFIC: 'employee_specific',
  SYSTEM: 'system',
} as const;

// UI Message Constants
export const MESSAGE_TYPES = {
  SUCCESS: 'Success',
  ERROR: 'Error',
  WARNING: 'Warning',
  INFO: 'Info',
} as const;

// Date Format Constants
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  DISPLAY_DATE: 'DD/MM/YYYY',
  MONTH_YEAR: 'MMMM YYYY',
} as const;

// Quick Date Range Constants
export const QUICK_DATE_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  JUNE_2025: 'june2025',
} as const;
