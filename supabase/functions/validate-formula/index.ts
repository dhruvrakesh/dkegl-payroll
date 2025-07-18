
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  expression: string
  formula_type: string
  test_variables?: Record<string, number>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { expression, formula_type, test_variables = {} }: ValidationRequest = await req.json()

    console.log('Validating formula:', expression, 'type:', formula_type)

    // Default test variables
    const defaultTestVars = {
      base_salary: 50000,
      days_present: 26,
      overtime_hours: 10,
      working_days_per_month: 26,
      hours_per_day: 8,
      overtime_multiplier: 2.0,
      pf_rate: 12,
      esi_rate: 0.75,
      advances: 5000,
      gross_salary: 55000,
      total_deductions: 12000,
      basic_allowance: 1000,
      transport_allowance: 2000,
      meal_allowance: 1500,
      other_deductions: 0,
      hra_amount: 8000,
      other_conv_amount: 3000
    }

    const testContext = { ...defaultTestVars, ...test_variables }

    // Validate syntax and evaluate with test data
    const result = evaluateFormula(expression, testContext)
    
    // Additional validations based on formula type
    const validationRules = {
      gross_salary: (val: number) => val >= 0 && val <= 1000000,
      deductions: (val: number) => val >= 0 && val <= 100000,
      net_salary: (val: number) => val >= 0 && val <= 1000000,
      allowances: (val: number) => val >= 0 && val <= 100000
    }

    const isValid = validationRules[formula_type as keyof typeof validationRules]?.(result) ?? true

    const response = {
      valid: isValid,
      test_result: result,
      test_variables: testContext,
      warnings: [],
      suggestions: []
    }

    // Add warnings for potential issues
    if (result < 0) {
      response.warnings.push('Formula produces negative result')
    }
    
    if (result > 1000000) {
      response.warnings.push('Formula produces unusually high result')
    }

    // Add suggestions
    if (formula_type === 'gross_salary' && !expression.includes('base_salary')) {
      response.suggestions.push('Consider including base_salary in gross salary calculation')
    }

    if (formula_type === 'net_salary' && !expression.includes('gross_salary')) {
      response.suggestions.push('Net salary calculation should typically start with gross_salary')
    }

    console.log('Validation result:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message,
        test_result: 0
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function evaluateFormula(expression: string, variables: Record<string, number>): number {
  try {
    let processedExpression = expression
    
    const sortedVariables = Object.keys(variables).sort((a, b) => b.length - a.length)
    
    for (const variable of sortedVariables) {
      const regex = new RegExp(`\\b${variable}\\b`, 'g')
      processedExpression = processedExpression.replace(regex, variables[variable].toString())
    }
    
    if (!/^[0-9+\-*/.() ]+$/.test(processedExpression)) {
      throw new Error('Invalid characters in formula expression')
    }
    
    const result = Function(`"use strict"; return (${processedExpression})`)()
    
    return isNaN(result) ? 0 : Number(result.toFixed(2))
  } catch (error) {
    throw new Error(`Formula evaluation failed: ${error.message}`)
  }
}
