import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Save, Calculator, Users, Building2, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { DateRange } from 'react-day-picker';

interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  location: string;
}

interface SalaryResult {
  employee_id: string;
  employee_name: string;
  uan_number: string;
  total_paid_days: number;
  days_present: number;
  paid_weekly_offs: number;
  paid_leaves: number;
  unpaid_leaves: number;
  total_hours_worked: number;
  base_salary: number;
  hra_amount: number;
  other_conv_amount: number;
  overtime_amount: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  lwf_deduction: number;
  advances_deduction: number;
  net_salary: number;
  month: string;
  attendance_validation: {
    has_attendance: boolean;
    total_paid_days: number;
    total_days_in_month: number;
    paid_percentage: number;
    leave_balance_used: {
      casual_leave: number;
      earned_leave: number;
    };
  };
}

interface WageCalculatorDashboardProps {
  selectedBatchId?: string;
  onSalaryGenerated?: (salaryData: any[], batchId?: string) => void;
}

export function WageCalculatorDashboard({ selectedBatchId, onSalaryGenerated }: WageCalculatorDashboardProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
  const [selectedUnitInfo, setSelectedUnitInfo] = useState<Unit | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [salaryResults, setSalaryResults] = useState<SalaryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<any>(null);

  useEffect(() => {
    fetchUnits();
    fetchPayrollSettings();
  }, []);

  useEffect(() => {
    if (selectedUnit && units.length > 0) {
      const unitInfo = units.find(u => u.unit_id === selectedUnit);
      setSelectedUnitInfo(unitInfo || null);
      if (unitInfo) {
        fetchEmployeeCount(selectedUnit);
      }
    }
  }, [selectedUnit, units]);

  useEffect(() => {
    if (selectedBatchId) {
      console.log('WageCalculatorDashboard received batch ID:', selectedBatchId);
    }
  }, [selectedBatchId]);

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

  const fetchPayrollSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPayrollSettings(data);
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
    }
  };

  const fetchEmployeeCount = async (unitId: string) => {
    try {
      const { count, error } = await supabase
        .from('payroll_employees')
        .select('*', { count: 'exact', head: true })
        .eq('unit_id', unitId)
        .eq('active', true);

      if (error) throw error;
      setEmployeeCount(count || 0);
    } catch (error) {
      console.error('Error fetching employee count:', error);
      setEmployeeCount(0);
    }
  };

  const calculateSalaries = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select a valid date range');
      return;
    }

    setIsLoading(true);
    const warnings: string[] = [];
    
    try {
      // Get employees for the selected unit
      const { data: employees, error: empError } = await supabase
        .from('payroll_employees')
        .select('*')
        .eq('unit_id', selectedUnit)
        .eq('active', true);

      if (empError) throw empError;

      if (!employees || employees.length === 0) {
        toast.error('No active employees found for the selected unit');
        setSalaryResults([]);
        setIsLoading(false);
        return;
      }

      console.log(`Found ${employees.length} employees for unit ${selectedUnitInfo?.unit_name}`);

      const employeeIds = employees.map(emp => emp.id);
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];

      // Get attendance data with status information
      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .in('employee_id', employeeIds)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (attError) throw attError;

      console.log(`Found ${attendanceData?.length || 0} attendance records for the period`);

      // Get total calendar days in the month
      const totalDaysInMonth = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1, 0).getDate();

      console.log(`📊 NEW SALARY CALCULATION - TOTAL PAID DAYS METHOD:`, {
        totalDaysInMonth,
        dateRange: { from: startDate, to: endDate }
      });

      // Calculate salaries using "Total Paid Days" method
      const results = await Promise.all(employees.map(async (employee) => {
        const employeeAttendance = attendanceData?.filter(att => att.employee_id === employee.id) || [];
        
        // Calculate different types of attendance
        const daysPresent = employeeAttendance.filter(att => att.status === 'PRESENT').length;
        const paidWeeklyOffs = employeeAttendance.filter(att => att.status === 'WEEKLY_OFF').length;
        const casualLeaves = employeeAttendance.filter(att => att.status === 'CASUAL_LEAVE').length;
        const earnedLeaves = employeeAttendance.filter(att => att.status === 'EARNED_LEAVE').length;
        const unpaidLeaves = employeeAttendance.filter(att => att.status === 'UNPAID_LEAVE').length;
        
        // NEW CALCULATION: Total Paid Days
        const totalPaidDays = daysPresent + paidWeeklyOffs + casualLeaves + earnedLeaves;
        const paidLeaves = casualLeaves + earnedLeaves;
        
        // Calculate total hours (only from PRESENT days)
        const totalHours = employeeAttendance
          .filter(att => att.status === 'PRESENT')
          .reduce((sum, att) => sum + (att.hours_worked || 0), 0);
        const overtimeHours = employeeAttendance
          .filter(att => att.status === 'PRESENT')
          .reduce((sum, att) => sum + (att.overtime_hours || 0), 0);

        // ATTENDANCE VALIDATION
        const hasAttendance = employeeAttendance.length > 0;
        const paidPercentage = totalDaysInMonth > 0 ? (totalPaidDays / totalDaysInMonth) * 100 : 0;
        
        const attendanceValidation = {
          has_attendance: hasAttendance,
          total_paid_days: totalPaidDays,
          total_days_in_month: totalDaysInMonth,
          paid_percentage: paidPercentage,
          leave_balance_used: {
            casual_leave: casualLeaves,
            earned_leave: earnedLeaves
          }
        };

        // SALARY CALCULATION BASED ON TOTAL PAID DAYS
        const baseSalary = employee.base_salary || 0;
        const hraAmount = employee.hra_amount || 0;
        const otherConvAmount = employee.other_conv_amount || 0;

        // PRO-RATED SALARY CALCULATION using Total Paid Days
        let proRatedBaseSalary = baseSalary;
        let proRatedHra = hraAmount;
        let proRatedOtherConv = otherConvAmount;

        if (totalPaidDays === 0) {
          // No paid days = no salary
          proRatedBaseSalary = 0;
          proRatedHra = 0;
          proRatedOtherConv = 0;
          warnings.push(`${employee.name}: 0 paid days - Salary set to ₹0`);
        } else if (totalPaidDays < totalDaysInMonth) {
          // Pro-rate based on paid days
          const paidRatio = totalPaidDays / totalDaysInMonth;
          proRatedBaseSalary = baseSalary * paidRatio;
          proRatedHra = hraAmount * paidRatio;
          proRatedOtherConv = otherConvAmount * paidRatio;
          warnings.push(`${employee.name}: ${totalPaidDays}/${totalDaysInMonth} paid days - Pro-rated salary`);
        }

        // Overtime calculation (only if employee worked)
        const overtimeAmount = totalPaidDays > 0 ? (baseSalary / totalDaysInMonth / 8) * overtimeHours * 1.5 : 0;

        // Gross salary calculation
        const grossSalary = proRatedBaseSalary + proRatedHra + proRatedOtherConv + overtimeAmount;

        // ENHANCED DEDUCTIONS with LWF
        let pfDeduction = 0;
        let esiDeduction = 0;
        let lwfDeduction = 0;

        if (totalPaidDays > 0) {
          // EPF calculated on pro-rated Basic Salary
          const pfRate = payrollSettings?.pf_rate || 12;
          pfDeduction = Math.min(proRatedBaseSalary * (pfRate / 100), 1800);

          // ESIC calculated on pro-rated Gross Salary (if applicable)
          const esiRate = payrollSettings?.esi_rate || 0.75;
          if (grossSalary <= 21000) {
            esiDeduction = grossSalary * (esiRate / 100);
          }

          // LWF as fixed amount
          lwfDeduction = payrollSettings?.lwf_amount || 0;
        }

        // Get advances for this employee in the date range
        const { data: advances } = await supabase
          .from('advances')
          .select('advance_amount')
          .eq('employee_id', employee.id)
          .gte('advance_date', startDate)
          .lte('advance_date', endDate);

        const advancesDeduction = advances?.reduce((sum, adv) => sum + adv.advance_amount, 0) || 0;
        const netSalary = grossSalary - pfDeduction - esiDeduction - lwfDeduction - advancesDeduction;

        console.log(`💰 NEW CALCULATION FOR ${employee.name}:`, {
          daysPresent,
          paidWeeklyOffs,
          paidLeaves: paidLeaves,
          unpaidLeaves,
          totalPaidDays,
          totalDaysInMonth,
          paidPercentage: paidPercentage.toFixed(1) + '%',
          proRatedBaseSalary: proRatedBaseSalary.toFixed(2),
          grossSalary: grossSalary.toFixed(2),
          pfDeduction: pfDeduction.toFixed(2),
          esiDeduction: esiDeduction.toFixed(2),
          lwfDeduction: lwfDeduction.toFixed(2),
          netSalary: netSalary.toFixed(2)
        });

        return {
          employee_id: employee.id,
          employee_name: employee.name,
          uan_number: employee.uan_number || 'N/A',
          total_paid_days: totalPaidDays,
          days_present: daysPresent,
          paid_weekly_offs: paidWeeklyOffs,
          paid_leaves: paidLeaves,
          unpaid_leaves: unpaidLeaves,
          total_hours_worked: totalHours,
          base_salary: proRatedBaseSalary,
          hra_amount: proRatedHra,
          other_conv_amount: proRatedOtherConv,
          overtime_amount: overtimeAmount,
          gross_salary: grossSalary,
          pf_deduction: pfDeduction,
          esi_deduction: esiDeduction,
          lwf_deduction: lwfDeduction,
          advances_deduction: advancesDeduction,
          net_salary: netSalary,
          month: format(dateRange.from || new Date(), 'yyyy-MM'),
          attendance_validation: attendanceValidation
        };
      }));

      setSalaryResults(results);
      setValidationWarnings(warnings);
      
      const zeroSalaryEmployees = results.filter(r => r.net_salary === 0).length;
      const proRatedEmployees = results.filter(r => r.attendance_validation.paid_percentage < 100 && r.attendance_validation.paid_percentage > 0).length;
      
      toast.success(`Calculated salaries using Total Paid Days method for ${results.length} employees`, {
        description: `${zeroSalaryEmployees} with ₹0 salary, ${proRatedEmployees} pro-rated`
      });
      
    } catch (error) {
      console.error('Error calculating salaries:', error);
      toast.error('Failed to calculate salaries. Please check the console for details.');
    }
    setIsLoading(false);
  };

  const saveSalaries = async () => {
    if (salaryResults.length === 0) {
      toast.error('No salary data to save');
      return;
    }

    setIsSaving(true);
    try {
      const salariesToSave = salaryResults.map(result => ({
        employee_id: result.employee_id,
        month: result.month,
        total_days_present: result.total_paid_days,
        total_hours_worked: result.total_hours_worked,
        base_salary: result.base_salary,
        hra_amount: result.hra_amount,
        other_conv_amount: result.other_conv_amount,
        overtime_amount: result.overtime_amount,
        gross_salary: result.gross_salary,
        pf_deduction: result.pf_deduction,
        esi_deduction: result.esi_deduction,
        advances_deduction: result.advances_deduction,
        net_salary: result.net_salary,
        batch_id: selectedBatchId || null
      }));

      const { error } = await supabase
        .from('salary_disbursement')
        .upsert(salariesToSave, {
          onConflict: 'employee_id,month'
        });

      if (error) throw error;

      toast.success('Salaries saved successfully');
      
      if (onSalaryGenerated) {
        onSalaryGenerated(salaryResults, selectedBatchId);
      }
    } catch (error) {
      console.error('Error saving salaries:', error);
      toast.error('Failed to save salaries');
    }
    setIsSaving(false);
  };

  const exportToCSV = () => {
    if (salaryResults.length === 0) {
      toast.error('No data to export');
      return;
    }

    const filename = `salary_data_total_paid_days_${selectedUnitInfo?.unit_code || 'unit'}_${format(dateRange?.from || new Date(), 'yyyy-MM')}.xlsx`;
    const ws = XLSX.utils.json_to_sheet(salaryResults);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Data');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Enhanced Wage Calculator - Total Paid Days Method
            {selectedBatchId && (
              <span className="text-sm font-normal text-muted-foreground">
                (Batch Mode)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-blue-900">New Calculation Method</h3>
            </div>
            <p className="text-sm text-blue-700">
              <strong>Total Paid Days = Days Present + Paid Weekly Offs + Paid Leave (CL/EL)</strong><br/>
              Pro-rated Salary = (Component Salary ÷ Total Calendar Days) × Total Paid Days
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Select Unit</Label>
              <Select onValueChange={setSelectedUnit} disabled={isLoadingUnits}>
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
            </div>

            <div>
              <Label>Select Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[240px] justify-start text-left font-normal',
                      !dateRange?.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(
                          dateRange.to,
                          'MMM dd, yyyy'
                        )}`
                      ) : (
                        format(dateRange.from, 'MMM dd, yyyy')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedUnitInfo && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedUnitInfo.unit_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUnitInfo.unit_code} • {selectedUnitInfo.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{employeeCount} Active Employees</p>
                  <p className="text-xs text-muted-foreground">In selected unit</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button 
              onClick={calculateSalaries} 
              disabled={isLoading || !dateRange?.from || !dateRange?.to || !selectedUnit}
              className="flex-1"
            >
              {isLoading ? 'Calculating...' : 'Calculate Salaries (Total Paid Days)'}
            </Button>
            
            {salaryResults.length > 0 && (
              <>
                <Button 
                  onClick={saveSalaries}
                  disabled={isSaving}
                  variant="default"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save to Database'}
                </Button>
                
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </>
            )}
          </div>

          {validationWarnings.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <h3 className="font-medium text-yellow-900">Salary Calculation Warnings</h3>
              </div>
              <div className="space-y-1 text-sm text-yellow-700">
                {validationWarnings.map((warning, index) => (
                  <p key={index}>• {warning}</p>
                ))}
              </div>
            </div>
          )}

          {salaryResults.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Total Paid Days Calculation Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Employees Processed:</p>
                  <p className="font-medium text-green-900">{salaryResults.length}</p>
                </div>
                <div>
                  <p className="text-green-700">Zero Salary Count:</p>
                  <p className="font-medium text-green-900">
                    {salaryResults.filter(r => r.net_salary === 0).length}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Total Gross Amount:</p>
                  <p className="font-medium text-green-900">
                    ₹{salaryResults.reduce((sum, r) => sum + r.gross_salary, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Total Net Amount:</p>
                  <p className="font-medium text-green-900">
                    ₹{salaryResults.reduce((sum, r) => sum + r.net_salary, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {salaryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Salary Calculation Results - Total Paid Days Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UAN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Paid Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weekly Off
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Leave
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ESI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LWF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaryResults.map((result) => (
                    <tr key={result.employee_id} className={result.net_salary === 0 ? 'bg-red-50' : result.attendance_validation.paid_percentage < 100 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.employee_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.uan_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={result.total_paid_days === 0 ? 'text-red-600 font-medium' : result.total_paid_days < result.attendance_validation.total_days_in_month ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'}>
                          {result.total_paid_days}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.days_present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.paid_weekly_offs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.paid_leaves}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={result.attendance_validation.paid_percentage < 50 ? 'text-red-600' : result.attendance_validation.paid_percentage < 100 ? 'text-yellow-600' : 'text-green-600'}>
                          {result.attendance_validation.paid_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.gross_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.pf_deduction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.esi_deduction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.lwf_deduction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.advances_deduction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={result.net_salary === 0 ? 'text-red-600 font-medium' : 'text-green-600 font-bold'}>
                          ₹{result.net_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
