
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useEnhancedPayrollCalculation } from '@/hooks/useEnhancedPayrollCalculation';
import { useUnitsData } from '@/hooks/useUnitsData';
import { EnhancedPayrollTable } from './enhanced-payroll/EnhancedPayrollTable';
import { PayrollMetrics } from './enhanced-payroll/PayrollMetrics';
import { FormulaTransparencyPanel } from './enhanced-payroll/FormulaTransparencyPanel';

export const EnhancedPayrollCalculator = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedUnit, setSelectedUnit] = useState('all_units');
  
  const { units, loading: unitsLoading } = useUnitsData();
  const { 
    payrollData, 
    isLoading, 
    formulaMetrics, 
    calculateEnhancedPayroll 
  } = useEnhancedPayrollCalculation({
    month: selectedMonth,
    unit_id: selectedUnit === 'all_units' ? undefined : selectedUnit
  });

  const handleUnitChange = (value: string) => {
    setSelectedUnit(value);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Enhanced Payroll Calculator
          </CardTitle>
          <CardDescription>
            Advanced payroll calculation with formula transparency and leave reconciliation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={selectedUnit} onValueChange={handleUnitChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_units">All Units</SelectItem>
                  {units.map(unit => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={calculateEnhancedPayroll}
                disabled={isLoading || unitsLoading}
                className="w-full"
              >
                {isLoading ? 'Calculating...' : 'Calculate Payroll'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula Metrics */}
      {payrollData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Formula Usage Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formulaMetrics.employeesWithSpecificRates}
                </div>
                <div className="text-sm text-muted-foreground">Employee Specific Rates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formulaMetrics.employeesWithFormulaRates}
                </div>
                <div className="text-sm text-muted-foreground">Formula-Based Rates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formulaMetrics.employeesWithSystemDefaults}
                </div>
                <div className="text-sm text-muted-foreground">System Defaults</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formulaMetrics.totalFormulaExecutions}
                </div>
                <div className="text-sm text-muted-foreground">Total Calculations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payroll Results */}
      {payrollData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payroll Results
              <Badge variant="secondary">{payrollData.length} employees</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedPayrollTable payrollData={payrollData} />
          </CardContent>
        </Card>
      )}

      {/* Summary Metrics */}
      {payrollData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PayrollMetrics payrollData={payrollData} />
          </CardContent>
        </Card>
      )}

      {/* Formula Transparency */}
      {payrollData.length > 0 && (
        <FormulaTransparencyPanel payrollData={payrollData} />
      )}
    </div>
  );
};
