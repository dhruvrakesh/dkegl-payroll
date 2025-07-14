
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
