
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReconciliationData {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  unit_id: string;
  current_casual_balance: number;
  current_earned_balance: number;
  month_consumption: {
    casual_leave_taken: number;
    earned_leave_taken: number;
    unpaid_leave_taken: number;
    total_leave_days: number;
  };
  suggested_adjustment: {
    casual_adjustment: number;
    earned_adjustment: number;
  };
}

interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
}

export const LeaveReconciliation = () => {
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name, unit_code')
        .eq('active', true)
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Error",
        description: "Failed to fetch units",
        variant: "destructive",
      });
    }
  };

  const handleReconcile = async () => {
    if (!adjustmentReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reconciliation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await supabase.rpc('reconcile_monthly_leaves' as any, {
        p_month: selectedMonth,
        p_year: selectedYear,
        p_unit_id: selectedUnit || null
      });
      const { data, error } = result;

      if (error) throw error;
      
      setReconciliationData(data?.employee_data || []);
      toast({
        title: "Success",
        description: `Reconciliation completed for ${data?.total_employees || 0} employees`,
      });
    } catch (error) {
      console.error('Error during reconciliation:', error);
      toast({
        title: "Error",
        description: "Failed to perform reconciliation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAdjustments = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one employee for adjustment",
        variant: "destructive",
      });
      return;
    }

    const adjustmentsToApply = reconciliationData
      .filter(emp => selectedEmployees.includes(emp.employee_id))
      .map(emp => ({
        employee_id: emp.employee_id,
        current_casual_balance: emp.current_casual_balance,
        current_earned_balance: emp.current_earned_balance,
        casual_adjustment: emp.suggested_adjustment.casual_adjustment,
        earned_adjustment: emp.suggested_adjustment.earned_adjustment
      }));

    setLoading(true);
    try {
      const result = await supabase.rpc('apply_leave_adjustments' as any, {
        p_adjustments: adjustmentsToApply,
        p_reason: adjustmentReason,
        p_month: selectedMonth,
        p_year: selectedYear
      });
      const { data, error } = result;

      if (error) throw error;

      toast({
        title: "Success",
        description: `Applied adjustments for ${data?.successCount || 0} employees`,
      });

      if ((data?.errorCount || 0) > 0) {
        console.error('Some adjustments failed:', data?.errors);
      }

      // Clear selections and refresh data
      setSelectedEmployees([]);
      handleReconcile();
    } catch (error) {
      console.error('Error applying adjustments:', error);
      toast({
        title: "Error",
        description: "Failed to apply adjustments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const selectAll = () => {
    setSelectedEmployees(reconciliationData.map(emp => emp.employee_id));
  };

  const clearAll = () => {
    setSelectedEmployees([]);
  };

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Monthly Leave Reconciliation
          </CardTitle>
          <CardDescription>
            Reconcile leave balances with actual attendance records for a specific month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit">Unit (Optional)</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="All units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Units</SelectItem>
                  {units.map(unit => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleReconcile} disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Calculate Reconciliation'}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Adjustment Reason</Label>
            <Input
              id="reason"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="Enter reason for leave balance adjustments"
            />
          </div>
        </CardContent>
      </Card>

      {reconciliationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reconciliation Results
              <Badge variant="secondary">{reconciliationData.length} employees</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={selectAll} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={clearAll} variant="outline" size="sm">
                Clear All
              </Button>
              <Button 
                onClick={handleApplyAdjustments} 
                disabled={selectedEmployees.length === 0 || loading}
                className="ml-auto"
              >
                Apply Selected Adjustments ({selectedEmployees.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Current CL</TableHead>
                    <TableHead>Current EL</TableHead>
                    <TableHead>CL Taken</TableHead>
                    <TableHead>EL Taken</TableHead>
                    <TableHead>Unpaid Leave</TableHead>
                    <TableHead>CL Adjustment</TableHead>
                    <TableHead>EL Adjustment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationData.map((emp) => {
                    const needsAdjustment = emp.suggested_adjustment.casual_adjustment !== 0 || 
                                          emp.suggested_adjustment.earned_adjustment !== 0;
                    
                    return (
                      <TableRow key={emp.employee_id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.employee_id)}
                            onChange={() => toggleEmployeeSelection(emp.employee_id)}
                            disabled={!needsAdjustment}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{emp.employee_name}</div>
                            <div className="text-sm text-muted-foreground">{emp.employee_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>{emp.current_casual_balance}</TableCell>
                        <TableCell>{emp.current_earned_balance}</TableCell>
                        <TableCell>{emp.month_consumption.casual_leave_taken}</TableCell>
                        <TableCell>{emp.month_consumption.earned_leave_taken}</TableCell>
                        <TableCell>{emp.month_consumption.unpaid_leave_taken}</TableCell>
                        <TableCell>
                          <span className={emp.suggested_adjustment.casual_adjustment < 0 ? 'text-red-600' : 'text-green-600'}>
                            {emp.suggested_adjustment.casual_adjustment > 0 ? '+' : ''}{emp.suggested_adjustment.casual_adjustment}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={emp.suggested_adjustment.earned_adjustment < 0 ? 'text-red-600' : 'text-green-600'}>
                            {emp.suggested_adjustment.earned_adjustment > 0 ? '+' : ''}{emp.suggested_adjustment.earned_adjustment}
                          </span>
                        </TableCell>
                        <TableCell>
                          {needsAdjustment ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Needs Adjustment
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              In Sync
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
