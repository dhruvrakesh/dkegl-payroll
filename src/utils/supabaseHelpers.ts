
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type for valid RPC function names
type RpcFunctionName = keyof Database['public']['Functions'];

/**
 * Helper function to safely call Supabase RPC functions with proper error handling
 */
export async function safeSupabaseRpc<T>(
  functionName: RpcFunctionName,
  params?: Record<string, any>,
  typeGuard?: (data: any) => data is T
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc(functionName as any, params);
    
    if (error) {
      console.error(`RPC Error in ${functionName}:`, error);
      return { data: null, error: new Error(error.message) };
    }

    // Type validation if provided
    if (typeGuard && !typeGuard(data)) {
      console.error(`Type validation failed for ${functionName}:`, data);
      return { data: null, error: new Error('Invalid response format from server') };
    }

    return { data: data as T, error: null };
  } catch (err) {
    console.error(`Unexpected error in ${functionName}:`, err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('An unexpected error occurred') 
    };
  }
}

/**
 * Helper function to safely call Supabase functions with proper error handling
 */
export async function safeSupabaseFunction<T>(
  functionName: string,
  params?: Record<string, any>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: params
    });
    
    if (error) {
      console.error(`Function Error in ${functionName}:`, error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T, error: null };
  } catch (err) {
    console.error(`Unexpected error in ${functionName}:`, err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('An unexpected error occurred') 
    };
  }
}

// Specific type-safe helpers for CSV operations
export interface CsvUploadResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    rowNumber: number;
    data: any;
    reason: string;
    category: string;
    originalCode?: string;
    resolvedCode?: string;
  }>;
}

export interface BulkUpdateResult extends CsvUploadResult {
  batchId: string;
}

/**
 * Type-safe helper for attendance CSV upload
 */
export async function uploadAttendanceCsv(rows: any[]): Promise<{ data: CsvUploadResult | null; error: Error | null }> {
  return safeSupabaseRpc<CsvUploadResult>(
    'insert_attendance_from_csv_enhanced' as RpcFunctionName,
    { rows },
    (data): data is CsvUploadResult => 
      data && 
      typeof data.successCount === 'number' &&
      typeof data.errorCount === 'number' &&
      Array.isArray(data.errors)
  );
}

/**
 * Type-safe helper for attendance bulk update
 */
export async function updateAttendanceBulk(rows: any[], updateReason: string): Promise<{ data: BulkUpdateResult | null; error: Error | null }> {
  return safeSupabaseRpc<BulkUpdateResult>(
    'update_attendance_from_csv' as RpcFunctionName,
    { rows, update_reason: updateReason },
    (data): data is BulkUpdateResult => 
      data && 
      typeof data.successCount === 'number' &&
      typeof data.errorCount === 'number' &&
      Array.isArray(data.errors) &&
      typeof data.batchId === 'string'
  );
}

/**
 * Type-safe helper for leave balance CSV upload
 */
export async function uploadLeaveBalancesCsv(rows: any[]): Promise<{ data: CsvUploadResult | null; error: Error | null }> {
  return safeSupabaseRpc<CsvUploadResult>(
    'upsert_leave_balances_from_csv' as RpcFunctionName,
    { rows },
    (data): data is CsvUploadResult => 
      data && 
      typeof data.successCount === 'number' &&
      typeof data.errorCount === 'number' &&
      Array.isArray(data.errors)
  );
}
