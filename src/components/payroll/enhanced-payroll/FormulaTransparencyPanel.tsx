
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Eye, Code, AlertCircle } from 'lucide-react';

interface FormulaTransparencyPanelProps {
  payrollData: any[];
}

export const FormulaTransparencyPanel: React.FC<FormulaTransparencyPanelProps> = ({ 
  payrollData 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const getTransparencyColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getOvertimeSourceIcon = (source: string) => {
    switch (source) {
      case 'employee_specific':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'formula_based':
        return <Code className="h-4 w-4 text-green-600" />;
      case 'system_default':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Formula Transparency & Calculation Details
        </CardTitle>
        <CardDescription>
          Detailed breakdown of how each salary component was calculated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>View Calculation Details</span>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              {payrollData.map((employee) => (
                <Card key={employee.employee_id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{employee.employee_name}</CardTitle>
                        <CardDescription>ID: {employee.employee_id}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTransparencyColor(employee.transparency_score)}>
                          {employee.transparency_score}% Transparency
                        </Badge>
                        {getOvertimeSourceIcon(employee.overtime_rate_source)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Salary Breakdown */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Salary Breakdown
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Base Salary:</span>
                            <span className="font-medium">{formatCurrency(employee.base_salary)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overtime Amount:</span>
                            <span className="font-medium">{formatCurrency(employee.overtime_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gross Salary:</span>
                            <span className="font-medium">{formatCurrency(employee.gross_salary)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-semibold">Net Salary:</span>
                            <span className="font-semibold">{formatCurrency(employee.net_salary)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Details */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Calculation Details
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Base Calculation</div>
                            <div className="text-sm bg-gray-50 p-2 rounded">
                              {employee.calculation_breakdown.base_calculation}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Overtime Calculation</div>
                            <div className="text-sm bg-gray-50 p-2 rounded">
                              {employee.calculation_breakdown.overtime_calculation}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Deductions</div>
                            <div className="text-sm bg-gray-50 p-2 rounded">
                              {employee.calculation_breakdown.deductions_calculation}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Formula Usage */}
                      {employee.calculation_breakdown.formulas_used?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Formulas Used
                          </h4>
                          <div className="space-y-2">
                            {employee.calculation_breakdown.formulas_used.map((formula: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {formula}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Variables */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Variables Used
                        </h4>
                        <div className="space-y-1 text-sm">
                          {Object.entries(employee.calculation_breakdown.variables_used || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Leave Impact */}
                    {employee.reconciled_leave_data && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <h4 className="font-semibold mb-2 text-blue-800">Leave Reconciliation</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Casual Leave Taken:</span>
                            <span className="ml-2 font-medium">{employee.reconciled_leave_data.casual_leave_taken}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">Earned Leave Taken:</span>
                            <span className="ml-2 font-medium">{employee.reconciled_leave_data.earned_leave_taken}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">Unpaid Leave Days:</span>
                            <span className="ml-2 font-medium">{employee.reconciled_leave_data.unpaid_leave_days}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">Leave Impact:</span>
                            <span className="ml-2 font-medium text-red-600">
                              -{formatCurrency(employee.leave_impact_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {employee.reconciliation_warning && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Warning</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          {employee.reconciliation_warning}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
