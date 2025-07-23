
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Code, Eye } from 'lucide-react';

interface FormulaTransparencyPanelProps {
  payrollData: any[];
}

export const FormulaTransparencyPanel: React.FC<FormulaTransparencyPanelProps> = ({ payrollData }) => {
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  const toggleEmployee = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const getTransparencyColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Formula Transparency
        </CardTitle>
        <CardDescription>
          View detailed calculation breakdowns and formula usage for each employee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {payrollData.map((employee) => (
          <Collapsible key={employee.employee_id}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => toggleEmployee(employee.employee_id)}
              >
                <div className="flex items-center gap-3">
                  {expandedEmployees.has(employee.employee_id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">{employee.employee_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.employee_id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTransparencyColor(employee.transparency_score)}>
                    {employee.transparency_score}% Transparency
                  </Badge>
                  <Badge variant="outline">
                    {employee.overtime_rate_source.replace('_', ' ')}
                  </Badge>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-4 border-l-2 border-gray-200 pl-4">
                {/* Calculation Breakdown */}
                {employee.calculation_breakdown && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Calculation Breakdown</h4>
                    
                    {employee.calculation_breakdown.base_calculation && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm font-medium mb-1">Base Salary Calculation</div>
                        <div className="text-sm text-gray-600">
                          {employee.calculation_breakdown.base_calculation}
                        </div>
                      </div>
                    )}

                    {employee.calculation_breakdown.overtime_calculation && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <div className="text-sm font-medium mb-1">Overtime Calculation</div>
                        <div className="text-sm text-gray-600">
                          {employee.calculation_breakdown.overtime_calculation}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Method: {employee.overtime_calculation_method}
                        </div>
                      </div>
                    )}

                    {employee.calculation_breakdown.deductions_calculation && (
                      <div className="bg-red-50 p-3 rounded-md">
                        <div className="text-sm font-medium mb-1">Deductions Calculation</div>
                        <div className="text-sm text-gray-600">
                          {employee.calculation_breakdown.deductions_calculation}
                        </div>
                      </div>
                    )}

                    {/* Formulas Used */}
                    {employee.calculation_breakdown.formulas_used && employee.calculation_breakdown.formulas_used.length > 0 && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <div className="text-sm font-medium mb-2">Formulas Used</div>
                        <div className="space-y-1">
                          {employee.calculation_breakdown.formulas_used.map((formula: string, index: number) => (
                            <div key={index} className="text-xs text-green-700 font-mono bg-white p-2 rounded">
                              {formula}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Variables Used */}
                    {employee.calculation_breakdown.variables_used && Object.keys(employee.calculation_breakdown.variables_used).length > 0 && (
                      <div className="bg-purple-50 p-3 rounded-md">
                        <div className="text-sm font-medium mb-2">Variables Used</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(employee.calculation_breakdown.variables_used).map(([key, value]) => (
                            <div key={key} className="bg-white p-2 rounded">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Leave Reconciliation Data */}
                {employee.reconciled_leave_data && (
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <div className="text-sm font-medium mb-2">Leave Reconciliation</div>
                    <div className="text-xs space-y-1">
                      <div>Casual Leave: {employee.reconciled_leave_data.casual_leave_taken} taken, {employee.reconciled_leave_data.casual_leave_balance} balance</div>
                      <div>Earned Leave: {employee.reconciled_leave_data.earned_leave_taken} taken, {employee.reconciled_leave_data.earned_leave_balance} balance</div>
                      <div>Unpaid Leave: {employee.reconciled_leave_data.unpaid_leave_days} days</div>
                      {employee.leave_impact_amount > 0 && (
                        <div className="text-red-600">
                          Impact: ₹{employee.leave_impact_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {employee.reconciliation_warning && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
                    <div className="text-sm font-medium text-orange-800 mb-1">Warning</div>
                    <div className="text-sm text-orange-700">
                      {employee.reconciliation_warning}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};
