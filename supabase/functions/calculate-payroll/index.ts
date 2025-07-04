
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalculationRequest {
  employee_id: string
  month: string
  days_present: number
  overtime_hours?: number
  custom_variables?: Record<string, number>
}

interface FormulaVariable {
  name: string
  display_name: string
  variable_type: string
  default_value: number
  calculation_expression?: string
}

interface PayrollFormula {
  id: string
  name: string
  formula_type: string
  expression: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { employee_id, month, days_present, overtime_hours = 0, custom_variables = {} }: CalculationRequest = await req.json()

    console.log('Starting payroll calculation for employee:', employee_id, 'month:', month)

    // Get employee details with new salary components
    const { data: employee, error: empError } = await supabase
      .from('payroll_employees')
      .select('*')
      .eq('id', employee_id)
      .single()

    if (empError || !employee) {
      throw new Error('Employee not found')
    }

    // Get active formulas
    const { data: formulas, error: formulaError } = await supabase
      .from('payroll_formulas')
      .select('*')
      .eq('active', true)
      .lte('effective_from', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    if (formulaError) {
      throw new Error('Failed to fetch formulas')
    }

    // Get active variables including new ones
    const { data: variables, error: variableError } = await supabase
      .from('formula_variables')
      .select('*')
      .eq('active', true)

    if (variableError) {
      throw new Error('Failed to fetch variables')
    }

    // Get employee-specific overrides
    const { data: overrides } = await supabase
      .from('employee_variable_overrides')
      .select('*')
      .eq('employee_id', employee_id)
      .lte('effective_from', new Date().toISOString().split('T')[0])
      .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`)

    // Get payroll settings (PF/ESI rates)
    const { data: settings } = await supabase
      .from('payroll_settings')
      .select('*')
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    // Get attendance data for the month
    const monthStart = `${month}-01`
    const monthEnd = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('hours_worked, overtime_hours')
      .eq('employee_id', employee_id)
      .gte('attendance_date', monthStart)
      .lte('attendance_date', monthEnd)

    // Get advances for the month
    const { data: advancesData } = await supabase
      .from('advances')
      .select('advance_amount')
      .eq('employee_id', employee_id)
      .gte('advance_date', monthStart)
      .lte('advance_date', monthEnd)

    // Calculate totals from attendance and advances
    const totalHoursWorked = attendanceData?.reduce((sum, record) => sum + record.hours_worked, 0) || 0
    const totalOvertimeHours = attendanceData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || overtime_hours
    const totalAdvances = advancesData?.reduce((sum, record) => sum + record.advance_amount, 0) || 0

    // Enhanced salary calculations with new components
    const baseSalary = employee.base_salary || 0
    const hraAmount = employee.hra_amount || 0
    const otherConvAmount = employee.other_conv_amount || 0
    
    // Overtime calculation based on basic salary only (per day rate = basic/30, per hour = basic/30/8)
    const dailyBasicRate = baseSalary / 30
    const hourlyBasicRate = dailyBasicRate / 8
    const overtimeAmount = totalOvertimeHours * hourlyBasicRate * 2 // Double rate for overtime
    
    // Gross salary = Base + HRA + Other/Conv + Overtime
    const grossSalary = baseSalary + hraAmount + otherConvAmount + overtimeAmount

    // Build variable context with new variables
    const variableContext: Record<string, number> = {
      // Base employee data with new components
      base_salary: baseSalary,
      hra_amount: hraAmount,
      other_conv_amount: otherConvAmount,
      days_present,
      overtime_hours: totalOvertimeHours,
      total_hours_worked: totalHoursWorked,
      advances: totalAdvances,
      gross_salary: grossSalary,
      
      // System variables
      ...variables?.reduce((acc, variable) => {
        acc[variable.name] = variable.default_value || 0
        return acc
      }, {} as Record<string, number>),
      
      // Employee overrides
      ...overrides?.reduce((acc, override) => {
        const variable = variables?.find(v => v.id === override.variable_id)
        if (variable) {
          acc[variable.name] = override.override_value
        }
        return acc
      }, {} as Record<string, number>),
      
      // Custom variables from request
      ...custom_variables,
      
      // Payroll settings
      pf_rate: settings?.pf_rate || 12,
      esi_rate: settings?.esi_rate || 0.75,
      esi_threshold: 21000, // ESI threshold amount
    }

    console.log('Variable context:', variableContext)

    // Enhanced deduction calculations
    // PF is calculated on basic salary only
    const pfDeduction = (baseSalary * variableContext.pf_rate) / 100
    
    // ESI is calculated on gross salary but only if gross <= 21,000
    const esiDeduction = grossSalary <= variableContext.esi_threshold ? 
      (grossSalary * variableContext.esi_rate) / 100 : 0
    
    const totalDeductions = pfDeduction + esiDeduction + totalAdvances
    const netSalary = grossSalary - totalDeductions

    // Calculate step by step results
    const calculationResults: Record<string, number> = {
      base_salary: baseSalary,
      hra_amount: hraAmount,
      other_conv_amount: otherConvAmount,
      overtime_amount: overtimeAmount,
      gross_salary: grossSalary,
      pf_deduction: pfDeduction,
      esi_deduction: esiDeduction,
      advances_deduction: totalAdvances,
      total_deductions: totalDeductions,
      net_salary: netSalary
    }

    const finalResults = {
      employee_id,
      employee_name: employee.name,
      month,
      base_salary: baseSalary,
      hra_amount: hraAmount,
      other_conv_amount: otherConvAmount,
      days_present,
      overtime_hours: totalOvertimeHours,
      total_hours_worked: totalHoursWorked,
      overtime_amount: overtimeAmount,
      gross_salary: grossSalary,
      pf_deduction: pfDeduction,
      esi_deduction: esiDeduction,
      esi_exempt: grossSalary > variableContext.esi_threshold,
      advances_deduction: totalAdvances,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      variable_context: variableContext,
      calculation_breakdown: calculationResults,
      formulas_used: formulas?.map(f => ({ id: f.id, name: f.name, type: f.formula_type }))
    }

    // Save audit trail
    await supabase
      .from('payroll_calculation_audit')
      .insert({
        employee_id,
        month: monthStart,
        formula_snapshot: formulas,
        calculation_details: finalResults
      })

    console.log('Enhanced calculation completed successfully')

    return new Response(JSON.stringify(finalResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Calculation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Simple formula evaluator (for basic mathematical expressions)
function evaluateFormula(expression: string, variables: Record<string, number>): number {
  try {
    // Replace variable names with their values
    let processedExpression = expression
    
    // Sort variables by length (longest first) to avoid partial replacements
    const sortedVariables = Object.keys(variables).sort((a, b) => b.length - a.length)
    
    for (const variable of sortedVariables) {
      const regex = new RegExp(`\\b${variable}\\b`, 'g')
      processedExpression = processedExpression.replace(regex, variables[variable].toString())
    }
    
    // Basic safety check - only allow mathematical expressions
    if (!/^[0-9+\-*/.() ]+$/.test(processedExpression)) {
      throw new Error('Invalid formula expression')
    }
    
    // Evaluate the expression
    const result = Function(`"use strict"; return (${processedExpression})`)()
    
    return isNaN(result) ? 0 : Number(result.toFixed(2))
  } catch (error) {
    console.error('Formula evaluation error:', error)
    return 0
  }
}
