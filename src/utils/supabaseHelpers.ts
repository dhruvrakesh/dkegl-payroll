
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to safely call Supabase RPC functions with proper error handling
 */
export async function safeSupabaseRpc<T>(
  functionName: string,
  params?: Record<string, any>,
  typeGuard?: (data: any) => data is T
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
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
