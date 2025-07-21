
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Calculator, Download, Users, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReconciledPayrollCalculation } from '@/hooks/useReconciledPayrollCalculation';
import * as XLSX from 'xlsx';

interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  location: string;
}

interface ReconciledPayrollCalculatorProps {
  selectedBatchId?: string;
}

export function ReconciledPayrollCalculator({ selectedBatchId }: ReconciledPayrollCalculatorProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [employeeCount, setEmployeeCount] = useState<number>(0);

  const {
    payrollData,
    isLoading,
    reconciliationStatus,
    calculateReconciledPayroll,
    checkReconciliationStatus
  } = useReconciledPayrollCalculation({
    month: selectedMonth,
    unit_id: selectedUnit
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      fetchEmployeeCount();
    }
  }, [selectedUnit]);

  const fetchUnits = async () => {
    try {
      setIsLoadingUnits(true);
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name, unit_code, location')
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units');
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const fetchEmployeeCount = async () => {
    if (!selectedUnit) return;

    try {
      const { count, error } = await supabase
        .from('payroll_employees')
        .select('*', { count: 'exact', head: true })
        .eq('unit_id', selectedUnit)
        .eq('active', true);

      if (error) throw error;
      setEmployeeCount(count || 0);
    } catch (error) {
      console.error('Error fetching employee count:', error);
      setEmployeeCount(0);
    }
  };

  const exportToExcel = () => {
    if (payrollData.length === 0) {
      toast.error('No payroll data to export');
      return;
    }

    const exportData = payrollData.map(result => ({
      'Employee Name': result.employee_name,
      'Base Salary': result.base_salary,
      'Gross Salary': result.gross_salary,
      'Net Salary': result.net_salary,
      'Leave Impact Amount': result.leave_impact_amount,
      'Reconciliation Applied': result.reconciled_leave_data?.leave_adjustment_applied ? 'Yes' : 'No',
      'Casual Leave Taken': result.reconciled_leave_data?.casual_leave_taken || 0,
      'Earned Leave Taken': result.reconciled_leave_data?.earned_leave_taken || 0,
      'Unpaid Leave Days': result.reconciled_leave_data?.unpaid_leave_days || 0,
      'Warning': result.reconciliation_warning || 'None'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reconciled Payroll');
    
    const unitName = units.find(u => u.unit_id === selectedUnit)?.unit_name || 'All Units';
    const fileName = `Reconciled_Payroll_${unitName}_${selectedMonth}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Payroll data exported successfully');
  };

  const getSummaryStats = () => {
    if (payrollData.length === 0) return null;

    const totalGross = payrollData.reduce((sum, r) => sum + r.gross_salary, 0);
    const totalNet = payrollData.reduce((sum, r) => sum + r.net_salary, 0);
    const totalLeaveImpact = payrollData.reduce((sum, r) => sum + r.leave_impact_amount, 0);
    const reconciledCount = payrollData.filter(r => r.reconciled_leave_data?.leave_adjustment_applied).length;

    return {
      totalEmployees: payrollData.length,
      totalGross: totalGross.toFixed(2),
      totalNet: totalNet.toFixed(2),
      totalLeaveImpact: totalLeaveImpact.toFixed(2),
      reconciledCount,
      reconciledPercentage: ((reconciledCount / payrollData.length) * 100).toFixed(1)
    };
  };

  const summary = getSummaryStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Reconciled Payroll Calculator
            {selectedBatchId && (
              <Badge variant="secondary">Batch Mode</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reconciliation Status Alert */}
          <Alert className={reconciliationStatus.completed ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
            {reconciliationStatus.completed ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
            <AlertDescription className={reconciliationStatus.completed ? 'text-green-800' : 'text-orange-800'}>
              <strong>Reconciliation Status:</strong> {reconciliationStatus.completed ? 'Completed' : 'Not Completed'}
              {reconciliationStatus.warning && (
                <div className="mt-1 text-sm">{reconciliationStatus.warning}</div>
              )}
            </AlertDescription>
          </Alert>

          {/* Enhanced Info Card */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-blue-900">Reconciled Payroll Method</h3>
            </div>
            <p className="text-sm text-blue-700">
              This calculator uses reconciled leave balances to ensure accurate payroll calculations. 
              When reconciliation is complete, excess leave is automatically converted to unpaid leave, 
              and salary is pro-rated accordingly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Unit</label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={isLoadingUnits}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUnits ? "Loading units..." : "Select a unit"} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{unit.unit_code} - {unit.unit_name}</span>
                        {unit.location && (
                          <span className="text-xs text-muted-foreground">{unit.location}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUnit && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Users className="h-4 w-4 inline mr-1" />
                  {employeeCount} active employees
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={calculateReconciledPayroll}
                disabled={!selectedUnit || !selectedMonth || isLoading}
                className="w-full"
              >
                {isLoading ? 'Calculating...' : 'Calculate Reconciled Payroll'}
              </Button>
            </div>
          </div>

          {payrollData.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={checkReconciliationStatus} variant="outline">
                Refresh Status
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Reconciled Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">₹{summary.totalGross}</p>
                <p className="text-sm text-muted-foreground">Total Gross</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">₹{summary.totalNet}</p>
                <p className="text-sm text-muted-foreground">Total Net</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">₹{summary.totalLeaveImpact}</p>
                <p className="text-sm text-muted-foreground">Leave Impact</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{summary.reconciledCount}</p>
                <p className="text-sm text-muted-foreground">Reconciled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{summary.reconciledPercentage}%</p>
                <p className="text-sm text-muted-foreground">Reconciled %</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payroll Results Table */}
      {payrollData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reconciled Payroll Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Leave Impact</TableHead>
                    <TableHead>Leave Details</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((result) => (
                    <TableRow key={result.employee_id}>
                      <TableCell className="font-medium">{result.employee_name}</TableCell>
                      <TableCell>₹{result.base_salary.toFixed(2)}</TableCell>
                      <TableCell>₹{result.gross_salary.toFixed(2)}</TableCell>
                      <TableCell className="font-bold">₹{result.net_salary.toFixed(2)}</TableCell>
                      <TableCell className="text-red-600">₹{result.leave_impact_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {result.reconciled_leave_data ? (
                          <div className="text-sm">
                            <p>CL: {result.reconciled_leave_data.casual_leave_taken}</p>
                            <p>EL: {result.reconciled_leave_data.earned_leave_taken}</p>
                            <p>Unpaid: {result.reconciled_leave_data.unpaid_leave_days}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.reconciled_leave_data?.leave_adjustment_applied ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reconciled
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Raw Data
                          </Badge>
                        )}
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
}
