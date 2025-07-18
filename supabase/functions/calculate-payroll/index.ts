
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

    console.log('🔍 PAYROLL CALCULATION REQUEST:', {
      employee_id: employee_id.slice(0, 8),
      month,
      days_present,
      overtime_hours
    })

    // Get employee details with new salary components
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
      other_conv_amount: employee.other_conv_amount
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

    console.log('📊 ATTENDANCE DATA:', {
      totalRecords: attendanceData?.length || 0,
      dateRange: { start: monthStart, end: monthEnd }
    })

    // Calculate ACTUAL days worked and hours
    const actualDaysWorked = attendanceData?.filter(record => record.hours_worked > 0).length || 0
    const totalHoursWorked = attendanceData?.reduce((sum, record) => sum + record.hours_worked, 0) || 0
    const totalOvertimeHours = attendanceData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || overtime_hours

    // Use actual attendance data instead of passed days_present
    const validatedDaysPresent = days_present !== undefined ? days_present : actualDaysWorked
    
    console.log('✅ ATTENDANCE VALIDATION:', {
      passedDaysPresent: days_present,
      actualDaysWorked,
      validatedDaysPresent,
      totalHoursWorked,
      totalOvertimeHours
    })

    // SALARY CALCULATION LOGIC
    const baseSalary = employee.base_salary || 0
    const hraAmount = employee.hra_amount || 0
    const otherConvAmount = employee.other_conv_amount || 0
    
    // Calculate working days in the month (approximate)
    const totalDaysInMonth = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0).getDate()
    const workingDaysInMonth = Math.floor(totalDaysInMonth * (6/7)) // Exclude Sundays
    
    // PRO-RATED SALARY CALCULATION
    let proRatedBaseSalary = baseSalary
    let proRatedHra = hraAmount
    let proRatedOtherConv = otherConvAmount
    
    // If employee has 0 days worked, salary should be 0
    if (validatedDaysPresent === 0) {
      proRatedBaseSalary = 0
      proRatedHra = 0
      proRatedOtherConv = 0
      console.log('⚠️ ZERO DAYS WORKED - Salary set to 0')
    } else if (validatedDaysPresent < workingDaysInMonth) {
      // Pro-rate salary based on actual days worked
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
    
    // Overtime calculation based on basic salary only
    const dailyBasicRate = baseSalary / 30
    const hourlyBasicRate = dailyBasicRate / 8
    const overtimeAmount = validatedDaysPresent > 0 ? totalOvertimeHours * hourlyBasicRate * 1.5 : 0
    
    // Gross salary = Pro-rated Base + Pro-rated HRA + Pro-rated Other/Conv + Overtime
    const grossSalary = proRatedBaseSalary + proRatedHra + proRatedOtherConv + overtimeAmount

    // Get payroll settings (PF/ESI rates)
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

    // Enhanced deduction calculations
    const pfDeduction = validatedDaysPresent > 0 ? Math.min((proRatedBaseSalary * (settings?.pf_rate || 12)) / 100, 1800) : 0
    const esiThreshold = 21000
    const esiDeduction = (validatedDaysPresent > 0 && grossSalary <= esiThreshold) ? 
      (grossSalary * (settings?.esi_rate || 0.75)) / 100 : 0
    
    const totalDeductions = pfDeduction + esiDeduction + totalAdvances
    const netSalary = grossSalary - totalDeductions

    console.log('💰 FINAL SALARY CALCULATION:', {
      validatedDaysPresent,
      workingDaysInMonth,
      proRatedBaseSalary: proRatedBaseSalary.toFixed(2),
      proRatedHra: proRatedHra.toFixed(2),
      proRatedOtherConv: proRatedOtherConv.toFixed(2),
      overtimeAmount: overtimeAmount.toFixed(2),
      grossSalary: grossSalary.toFixed(2),
      pfDeduction: pfDeduction.toFixed(2),
      esiDeduction: esiDeduction.toFixed(2),
      totalAdvances: totalAdvances.toFixed(2),
      netSalary: netSalary.toFixed(2)
    })

    const finalResults = {
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
      total_hours_worked: totalHoursWorked,
      overtime_amount: overtimeAmount,
      gross_salary: grossSalary,
      pf_deduction: pfDeduction,
      esi_deduction: esiDeduction,
      esi_exempt: grossSalary > esiThreshold,
      advances_deduction: totalAdvances,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      attendance_validation: {
        has_attendance: (attendanceData?.length || 0) > 0,
        attendance_records_count: attendanceData?.length || 0,
        total_hours_worked: totalHoursWorked,
        work_percentage: workingDaysInMonth > 0 ? (validatedDaysPresent / workingDaysInMonth) * 100 : 0
      }
    }

    console.log('✅ ENHANCED PAYROLL CALCULATION COMPLETED:', {
      employee: employee.name,
      month,
      netSalary: netSalary.toFixed(2)
    })

    return new Response(JSON.stringify(finalResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ PAYROLL CALCULATION ERROR:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
