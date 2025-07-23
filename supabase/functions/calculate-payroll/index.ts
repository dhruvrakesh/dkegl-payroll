
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalculationRequest {
  employee_id: string
  month: string
  days_present?: number
  overtime_hours?: number
  custom_variables?: Record<string, number>
}

interface CalculationBreakdown {
  employee_id: string
  employee_name: string
  month: string
  base_salary: number
  hra_amount: number
  other_conv_amount: number
  days_present: number
  actual_days_worked: number
  working_days_in_month: number
  overtime_hours: number
  overtime_amount: number
  overtime_rate_source: 'employee_specific' | 'formula_based' | 'system_default'
  overtime_calculation_method: string
  gross_salary: number
  pf_deduction: number
  esi_deduction: number
  esi_exempt: boolean
  advances_deduction: number
  total_deductions: number
  net_salary: number
  calculation_breakdown: {
    base_calculation: string
    overtime_calculation: string
    deductions_calculation: string
    formulas_used: string[]
    variables_used: Record<string, any>
  }
  attendance_validation: {
    has_attendance: boolean
    attendance_records_count: number
    total_hours_worked: number
    work_percentage: number
  }
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

    console.log('🔍 ENHANCED PAYROLL CALCULATION REQUEST:', {
      employee_id: employee_id.slice(0, 8),
      month,
      days_present,
      overtime_hours
    })

    const startTime = Date.now()

    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('payroll_employees')
      .select('*')
      .eq('id', employee_id)
      .single()

    if (empError || !employee) {
      throw new Error('Employee not found')
    }

    console.log('👤 EMPLOYEE DATA:', {
      name: employee.name,
      base_salary: employee.base_salary,
      hra_amount: employee.hra_amount,
      other_conv_amount: employee.other_conv_amount,
      overtime_rate_per_hour: employee.overtime_rate_per_hour
    })

    // Get attendance data for the month
    const monthStart = `${month}-01`
    const monthEnd = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('hours_worked, overtime_hours, attendance_date, status')
      .eq('employee_id', employee_id)
      .gte('attendance_date', monthStart)
      .lte('attendance_date', monthEnd)

    // Calculate attendance metrics
    const actualDaysWorked = attendanceData?.filter(record => record.hours_worked > 0).length || 0
    const totalHoursWorked = attendanceData?.reduce((sum, record) => sum + record.hours_worked, 0) || 0
    const totalOvertimeHours = attendanceData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || overtime_hours

    const validatedDaysPresent = days_present !== undefined ? days_present : actualDaysWorked
    
    console.log('📊 ATTENDANCE VALIDATION:', {
      passedDaysPresent: days_present,
      actualDaysWorked,
      validatedDaysPresent,
      totalHoursWorked,
      totalOvertimeHours
    })

    // Calculate working days in month
    const totalDaysInMonth = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0).getDate()
    const workingDaysInMonth = Math.floor(totalDaysInMonth * (6/7))

    // FORMULA-DRIVEN SALARY CALCULATION
    const baseSalary = employee.base_salary || 0
    const hraAmount = employee.hra_amount || 0
    const otherConvAmount = employee.other_conv_amount || 0
    
    // Pro-rated salary calculation
    let proRatedBaseSalary = baseSalary
    let proRatedHra = hraAmount
    let proRatedOtherConv = otherConvAmount
    
    if (validatedDaysPresent === 0) {
      proRatedBaseSalary = 0
      proRatedHra = 0
      proRatedOtherConv = 0
      console.log('⚠️ ZERO DAYS WORKED - Salary set to 0')
    } else if (validatedDaysPresent < workingDaysInMonth) {
      const workRatio = validatedDaysPresent / workingDaysInMonth
      proRatedBaseSalary = baseSalary * workRatio
      proRatedHra = hraAmount * workRatio
      proRatedOtherConv = otherConvAmount * workRatio
      console.log('📊 PRO-RATED SALARY:', {
        workRatio: workRatio.toFixed(3),
        originalBase: baseSalary,
        proRatedBase: proRatedBaseSalary.toFixed(2)
      })
    }

    // ENHANCED OVERTIME CALCULATION with Formula System
    let overtimeAmount = 0
    let overtimeRateSource: 'employee_specific' | 'formula_based' | 'system_default' = 'system_default'
    let overtimeCalculationMethod = 'No overtime'

    if (totalOvertimeHours > 0 && validatedDaysPresent > 0) {
      console.log('🔄 EVALUATING OVERTIME FORMULA...')
      
      // Try to use formula system for overtime calculation
      try {
        const monthDate = new Date(monthStart)
        const formulaVariables = {
          ...custom_variables,
          base_salary: baseSalary,
          hra_amount: hraAmount,
          other_conv_amount: otherConvAmount,
          working_days_per_month: workingDaysInMonth,
          hours_per_day: 8,
          overtime_hours: totalOvertimeHours
        }

        const { data: formulaResult, error: formulaError } = await supabase
          .rpc('evaluate_payroll_formula', {
            p_employee_id: employee_id,
            p_formula_type: 'overtime_calculation',
            p_month: monthDate.toISOString().split('T')[0],
            p_custom_variables: formulaVariables
          })

        if (formulaResult && !formulaError) {
          console.log('✅ FORMULA EVALUATION SUCCESS:', formulaResult)
          
          // Priority 1: Employee-specific overtime rate
          if (employee.overtime_rate_per_hour && employee.overtime_rate_per_hour > 0) {
            overtimeAmount = totalOvertimeHours * employee.overtime_rate_per_hour
            overtimeRateSource = 'employee_specific'
            overtimeCalculationMethod = `${totalOvertimeHours} hours × ₹${employee.overtime_rate_per_hour}/hour (Employee-specific rate)`
            console.log('🎯 EMPLOYEE-SPECIFIC RATE USED:', {
              rate: employee.overtime_rate_per_hour,
              hours: totalOvertimeHours,
              amount: overtimeAmount
            })
          }
          // Priority 2: Formula-based calculation
          else {
            const variables = formulaResult.variables || {}
            const overtimeMultiplier = variables.overtime_multiplier || 1.5
            const dailyBasicRate = baseSalary / 30
            const hourlyBasicRate = dailyBasicRate / 8
            overtimeAmount = totalOvertimeHours * hourlyBasicRate * overtimeMultiplier
            overtimeRateSource = 'formula_based'
            overtimeCalculationMethod = `${totalOvertimeHours} hours × ₹${hourlyBasicRate.toFixed(2)}/hour × ${overtimeMultiplier} multiplier (Formula-based)`
            console.log('📊 FORMULA-BASED CALCULATION:', {
              dailyRate: dailyBasicRate,
              hourlyRate: hourlyBasicRate,
              multiplier: overtimeMultiplier,
              amount: overtimeAmount
            })
          }

          // Log formula execution for audit
          await supabase.from('formula_execution_audit').insert({
            employee_id,
            formula_type: 'overtime_calculation',
            formula_expression: formulaResult.expression || 'employee_specific_rate',
            variables_used: formulaResult.variables || {},
            calculated_result: overtimeAmount,
            execution_time_ms: Date.now() - startTime,
            executed_by: null,
            month_year: monthDate.toISOString().split('T')[0]
          })
        } else {
          throw new Error('Formula evaluation failed')
        }
      } catch (formulaError) {
        console.log('⚠️ FORMULA FALLBACK - Using hardcoded calculation:', formulaError)
        
        // Priority 1: Employee-specific rate (fallback)
        if (employee.overtime_rate_per_hour && employee.overtime_rate_per_hour > 0) {
          overtimeAmount = totalOvertimeHours * employee.overtime_rate_per_hour
          overtimeRateSource = 'employee_specific'
          overtimeCalculationMethod = `${totalOvertimeHours} hours × ₹${employee.overtime_rate_per_hour}/hour (Employee-specific rate - fallback)`
        }
        // Priority 3: System default (1.5x multiplier)
        else {
          const dailyBasicRate = baseSalary / 30
          const hourlyBasicRate = dailyBasicRate / 8
          overtimeAmount = totalOvertimeHours * hourlyBasicRate * 1.5
          overtimeRateSource = 'system_default'
          overtimeCalculationMethod = `${totalOvertimeHours} hours × ₹${hourlyBasicRate.toFixed(2)}/hour × 1.5 multiplier (System default)`
        }
      }
    }

    // Gross salary calculation
    const grossSalary = proRatedBaseSalary + proRatedHra + proRatedOtherConv + overtimeAmount

    // Get payroll settings for deductions
    const { data: settings } = await supabase
      .from('payroll_settings')
      .select('*')
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    // Get advances for the month
    const { data: advancesData } = await supabase
      .from('advances')
      .select('advance_amount')
      .eq('employee_id', employee_id)
      .gte('advance_date', monthStart)
      .lte('advance_date', monthEnd)

    const totalAdvances = advancesData?.reduce((sum, record) => sum + record.advance_amount, 0) || 0

    // Calculate deductions
    const pfDeduction = validatedDaysPresent > 0 ? Math.min((proRatedBaseSalary * (settings?.pf_rate || 12)) / 100, 1800) : 0
    const esiThreshold = 21000
    const esiDeduction = (validatedDaysPresent > 0 && grossSalary <= esiThreshold) ? 
      (grossSalary * (settings?.esi_rate || 0.75)) / 100 : 0
    
    const totalDeductions = pfDeduction + esiDeduction + totalAdvances
    const netSalary = grossSalary - totalDeductions

    // Create detailed calculation breakdown
    const calculationBreakdown = {
      base_calculation: `Base: ₹${baseSalary} × ${validatedDaysPresent}/${workingDaysInMonth} days = ₹${proRatedBaseSalary.toFixed(2)}`,
      overtime_calculation: overtimeCalculationMethod,
      deductions_calculation: `PF: ₹${pfDeduction.toFixed(2)} + ESI: ₹${esiDeduction.toFixed(2)} + Advances: ₹${totalAdvances.toFixed(2)}`,
      formulas_used: overtimeRateSource === 'formula_based' ? ['overtime_calculation'] : [],
      variables_used: {
        base_salary: baseSalary,
        working_days_per_month: workingDaysInMonth,
        days_present: validatedDaysPresent,
        overtime_hours: totalOvertimeHours,
        overtime_rate_per_hour: employee.overtime_rate_per_hour
      }
    }

    console.log('💰 ENHANCED SALARY CALCULATION:', {
      validatedDaysPresent,
      workingDaysInMonth,
      proRatedBaseSalary: proRatedBaseSalary.toFixed(2),
      overtimeAmount: overtimeAmount.toFixed(2),
      overtimeRateSource,
      grossSalary: grossSalary.toFixed(2),
      netSalary: netSalary.toFixed(2)
    })

    const finalResults: CalculationBreakdown = {
      employee_id,
      employee_name: employee.name,
      month,
      base_salary: proRatedBaseSalary,
      hra_amount: proRatedHra,
      other_conv_amount: proRatedOtherConv,
      days_present: validatedDaysPresent,
      actual_days_worked: validatedDaysPresent,
      working_days_in_month: workingDaysInMonth,
      overtime_hours: totalOvertimeHours,
      overtime_amount: overtimeAmount,
      overtime_rate_source: overtimeRateSource,
      overtime_calculation_method: overtimeCalculationMethod,
      gross_salary: grossSalary,
      pf_deduction: pfDeduction,
      esi_deduction: esiDeduction,
      esi_exempt: grossSalary > esiThreshold,
      advances_deduction: totalAdvances,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      calculation_breakdown: calculationBreakdown,
      attendance_validation: {
        has_attendance: (attendanceData?.length || 0) > 0,
        attendance_records_count: attendanceData?.length || 0,
        total_hours_worked: totalHoursWorked,
        work_percentage: workingDaysInMonth > 0 ? (validatedDaysPresent / workingDaysInMonth) * 100 : 0
      }
    }

    console.log('✅ FORMULA-DRIVEN PAYROLL CALCULATION COMPLETED:', {
      employee: employee.name,
      month,
      netSalary: netSalary.toFixed(2),
      overtimeSource: overtimeRateSource,
      executionTime: `${Date.now() - startTime}ms`
    })

    return new Response(JSON.stringify(finalResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ ENHANCED PAYROLL CALCULATION ERROR:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
