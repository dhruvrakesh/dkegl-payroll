
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedPayrollCalculation } from '@/hooks/useEnhancedPayrollCalculation';
import { useUnitsData } from '@/hooks/useUnitsData';
import { Calculator, Eye, TrendingUp, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { format } from 'date-fns';

export const EnhancedPayrollCalculator = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  
  const { units } = useUnitsData();
  const { payrollData, isLoading, formulaMetrics, calculateEnhancedPayroll } = useEnhancedPayrollCalculation({
    month: selectedMonth,
    unit_id: selectedUnit || undefined
  });

  const getOvertimeRateSourceColor = (source: string) => {
    switch (source) {
      case 'employee_specific': return 'bg-green-100 text-green-800';
      case 'formula_based': return 'bg-blue-100 text-blue-800';
      case 'system_default': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOvertimeRateSourceIcon = (source: string) => {
    switch (source) {
      case 'employee_specific': return <CheckCircle className="w-4 h-4" />;
      case 'formula_based': return <Calculator className="w-4 h-4" />;
      case 'system_default': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTransparencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Enhanced Payroll Calculator</h2>
            <p className="text-muted-foreground">
              Formula-driven calculations with full transparency and audit trails
            </p>
          </div>
        </div>
      </div>

      {/* Calculation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Parameters</CardTitle>
          <CardDescription>
            Configure payroll calculation with enhanced formula system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                placeholder="Select month"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit (Optional)</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="All units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All units</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name} ({unit.unit_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={calculateEnhancedPayroll}
                disabled={!selectedMonth || isLoading}
                className="w-full"
              >
                {isLoading ? 'Calculating...' : 'Calculate Payroll'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula Metrics Dashboard */}
      {payrollData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formulaMetrics.employeesWithSpecificRates}
                  </div>
                  <div className="text-sm text-muted-foreground">Employee-Specific Rates</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formulaMetrics.employeesWithFormulaRates}
                  </div>
                  <div className="text-sm text-muted-foreground">Formula-Based Rates</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formulaMetrics.employeesWithSystemDefaults}
                  </div>
                  <div className="text-sm text-muted-foreground">System Defaults</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {((formulaMetrics.employeesWithSpecificRates + formulaMetrics.employeesWithFormulaRates) / formulaMetrics.totalFormulaExecutions * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Formula Coverage</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Payroll Results */}
      {payrollData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Payroll Results</CardTitle>
            <CardDescription>
              Calculated using formula-driven system with full transparency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Rate Source</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Transparency</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell>
                        <div className="font-medium">{employee.employee_name}</div>
                        {employee.reconciliation_warning && (
                          <div className="text-xs text-yellow-600">
                            {employee.reconciliation_warning}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>₹{employee.base_salary.toLocaleString()}</TableCell>
                      <TableCell>
                        <div>₹{employee.overtime_amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.overtime_calculation_method}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getOvertimeRateSourceColor(employee.overtime_rate_source)}>
                          <div className="flex items-center gap-1">
                            {getOvertimeRateSourceIcon(employee.overtime_rate_source)}
                            <span>{employee.overtime_rate_source.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>₹{employee.gross_salary.toLocaleString()}</TableCell>
                      <TableCell>₹{employee.net_salary.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={employee.transparency_score} className="w-12" />
                          <span className={`text-sm font-medium ${getTransparencyColor(employee.transparency_score)}`}>
                            {employee.transparency_score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Calculation Details - {employee.employee_name}</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="breakdown" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="breakdown">Calculation Breakdown</TabsTrigger>
                                <TabsTrigger value="formulas">Formula Usage</TabsTrigger>
                                <TabsTrigger value="leave">Leave Impact</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="breakdown" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Base Calculation</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm font-mono">
                                        {employee.calculation_breakdown.base_calculation}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Overtime Calculation</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm font-mono">
                                        {employee.calculation_breakdown.overtime_calculation}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Deductions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm font-mono">
                                        {employee.calculation_breakdown.deductions_calculation}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Final Result</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm font-mono">
                                        Net Salary: ₹{employee.net_salary.toLocaleString()}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="formulas" className="space-y-4">
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-sm font-medium">Formulas Used</Label>
                                    <div className="mt-1">
                                      {employee.calculation_breakdown.formulas_used.length > 0 ? (
                                        employee.calculation_breakdown.formulas_used.map((formula, index) => (
                                          <Badge key={index} variant="outline" className="mr-2">
                                            {formula}
                                          </Badge>
                                        ))
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No custom formulas used</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium">Variables Used</Label>
                                    <div className="mt-1 space-y-1">
                                      {Object.entries(employee.calculation_breakdown.variables_used).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                          <span className="font-mono">{key}:</span>
                                          <span className="font-mono">{value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="leave" className="space-y-4">
                                {employee.reconciled_leave_data ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Leave Balance</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span>Casual Leave:</span>
                                            <span>{employee.reconciled_leave_data.casual_leave_balance}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Earned Leave:</span>
                                            <span>{employee.reconciled_leave_data.earned_leave_balance}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Leave Impact</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span>Unpaid Days:</span>
                                            <span>{employee.reconciled_leave_data.unpaid_leave_days}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Impact Amount:</span>
                                            <span>₹{employee.leave_impact_amount.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No leave reconciliation data available
                                  </p>
                                )}
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
