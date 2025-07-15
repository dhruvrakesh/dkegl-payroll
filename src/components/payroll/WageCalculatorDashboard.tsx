import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Save, Calculator, Users, Building2, AlertTriangle, Info, CheckCircle } from 'lucide-react';
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

interface TestResults {
  totalRecordsFetched: number;
  uniqueEmployees: number;
  recordsProcessed: number;
  calculationErrors: number;
  validationWarnings: string[];
  performanceMetrics: {
    fetchTime: number;
    calculationTime: number;
    totalTime: number;
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
    from: new Date(2025, 5, 1), // June 2025 for testing
    to: new Date(2025, 5, 30)
  });
  const [salaryResults, setSalaryResults] = useState<SalaryResult[]>([]);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<any>(null);
  const [testMode, setTestMode] = useState(false);

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

  const runJune2025Test = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit first');
      return;
    }

    setTestMode(true);
    const startTime = Date.now();
    
    try {
      console.log('🧪 STARTING JUNE 2025 DATA TEST');
      
      // Verify date range is set to June 2025
      const testDateRange = {
        from: new Date(2025, 5, 1),
        to: new Date(2025, 5, 30)
      };
      setDateRange(testDateRange);

      // First, let's verify the total records available
      const { count: totalRecords, error: countError } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('attendance_date', '2025-06-01')
        .lte('attendance_date', '2025-06-30');

      if (countError) throw countError;

      console.log(`📊 Total June 2025 records in database: ${totalRecords}`);
      
      if (totalRecords !== 1350) {
        toast.error(`Expected 1,350 records, but found ${totalRecords} records in June 2025`);
        return;
      }

      const fetchStartTime = Date.now();
      
      // Run the salary calculation with test mode
      await calculateSalaries(true);
      
      const fetchEndTime = Date.now();
      const calculationTime = fetchEndTime - fetchStartTime;
      const totalTime = fetchEndTime - startTime;

      console.log(`⏱️ Performance Metrics:
        - Fetch Time: ${fetchStartTime - startTime}ms
        - Calculation Time: ${calculationTime}ms
        - Total Time: ${totalTime}ms`);

      toast.success(`June 2025 Test Completed! Processed ${totalRecords} records in ${totalTime}ms`);

    } catch (error) {
      console.error('Error running June 2025 test:', error);
      toast.error('Failed to run June 2025 test');
    } finally {
      setTestMode(false);
    }
  };

  const calculateSalaries = async (isTestMode = false) => {
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
    const startTime = Date.now();
    
    try {
      const fetchStartTime = Date.now();
      
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

      // ENHANCED FETCH WITH DETAILED LOGGING FOR TESTING
      console.log(`📅 Fetching attendance data for period: ${startDate} to ${endDate}`);
      
      let allAttendanceRecords: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        console.log(`📦 Fetching batch: offset=${offset}, limit=${batchSize}`);
        
        const { data: attendanceBatch, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .in('employee_id', employeeIds)
          .gte('attendance_date', startDate)
          .lte('attendance_date', endDate)
          .range(offset, offset + batchSize - 1)
          .order('attendance_date', { ascending: false });

        if (attError) throw attError;
        
        const records = attendanceBatch || [];
        console.log(`✅ Fetched ${records.length} records in this batch`);
        
        allAttendanceRecords.push(...records);
        hasMore = records.length === batchSize;
        offset += batchSize;

        if (offset > 50000) {
          console.warn('⚠️ Breaking pagination loop at 50k records for safety');
          break;
        }
      }

      const fetchEndTime = Date.now();
      const fetchTime = fetchEndTime - fetchStartTime;

      console.log(`🎯 FETCH COMPLETE: ${allAttendanceRecords.length} total records fetched in ${fetchTime}ms`);

      // Verify we got the expected 1,350 records for June 2025 test
      if (isTestMode && allAttendanceRecords.length !== 1350) {
        warnings.push(`Expected 1,350 records but fetched ${allAttendanceRecords.length} records`);
      }

      // Get total calendar days in the month
      const totalDaysInMonth = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1, 0).getDate();

      console.log(`📊 SALARY CALCULATION - TOTAL PAID DAYS METHOD:`, {
        totalDaysInMonth,
        dateRange: { from: startDate, to: endDate },
        totalRecords: allAttendanceRecords.length,
        uniqueEmployees: new Set(allAttendanceRecords.map(r => r.employee_id)).size
      });

      const calculationStartTime = Date.now();

      // Calculate salaries using "Total Paid Days" method
      const results = await Promise.all(employees.map(async (employee) => {
        const employeeAttendance = allAttendanceRecords.filter(att => att.employee_id === employee.id) || [];
        
        // Calculate different types of attendance with enhanced logging
        const daysPresent = employeeAttendance.filter(att => att.status === 'PRESENT').length;
        const paidWeeklyOffs = employeeAttendance.filter(att => att.status === 'WEEKLY_OFF').length;
        const casualLeaves = employeeAttendance.filter(att => att.status === 'CASUAL_LEAVE').length;
        const earnedLeaves = employeeAttendance.filter(att => att.status === 'EARNED_LEAVE').length;
        const unpaidLeaves = employeeAttendance.filter(att => att.status === 'UNPAID_LEAVE').length;
        
        // TOTAL PAID DAYS CALCULATION
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

        if (isTestMode) {
          console.log(`🧮 TEST CALCULATION FOR ${employee.name}:`, {
            attendanceRecords: employeeAttendance.length,
            daysPresent,
            paidWeeklyOffs,
            paidLeaves,
            unpaidLeaves,
            totalPaidDays,
            paidPercentage: paidPercentage.toFixed(1) + '%',
            proRatedBaseSalary: proRatedBaseSalary.toFixed(2),
            grossSalary: grossSalary.toFixed(2),
            lwfDeduction: lwfDeduction.toFixed(2),
            netSalary: netSalary.toFixed(2)
          });
        }

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

      const calculationEndTime = Date.now();
      const calculationTime = calculationEndTime - calculationStartTime;
      const totalTime = calculationEndTime - startTime;

      // Set test results if in test mode
      if (isTestMode) {
        const testResults: TestResults = {
          totalRecordsFetched: allAttendanceRecords.length,
          uniqueEmployees: new Set(allAttendanceRecords.map(r => r.employee_id)).size,
          recordsProcessed: results.length,
          calculationErrors: 0,
          validationWarnings: warnings,
          performanceMetrics: {
            fetchTime,
            calculationTime,
            totalTime
          }
        };
        setTestResults(testResults);
      }

      setSalaryResults(results);
      setValidationWarnings(warnings);
      
      const zeroSalaryEmployees = results.filter(r => r.net_salary === 0).length;
      const proRatedEmployees = results.filter(r => r.attendance_validation.paid_percentage < 100 && r.attendance_validation.paid_percentage > 0).length;
      
      const message = isTestMode 
        ? `June 2025 Test Complete: ${allAttendanceRecords.length} records processed in ${totalTime}ms`
        : `Calculated salaries using Total Paid Days method for ${results.length} employees`;
      
      toast.success(message, {
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

    const filename = `salary_data_june_2025_test_${selectedUnitInfo?.unit_code || 'unit'}_${format(dateRange?.from || new Date(), 'yyyy-MM')}.xlsx`;
    const ws = XLSX.utils.json_to_sheet(salaryResults);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Data');
    XLSX.writeFile(wb, filename);
    
    toast.success(`Exported ${salaryResults.length} records to ${filename}`);
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
          {/* June 2025 Test Section */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-blue-900">June 2025 Test Mode</h3>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Test the system with June 2025 data to verify all 1,350 records are processed correctly.
            </p>
            <Button 
              onClick={runJune2025Test}
              disabled={isLoading || !selectedUnit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Running Test...' : 'Run June 2025 Test (1,350 Records)'}
            </Button>
          </div>

          {/* Test Results Display */}
          {testResults && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-green-900">Test Results</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Records Fetched:</p>
                  <p className="font-medium text-green-900">{testResults.totalRecordsFetched}</p>
                </div>
                <div>
                  <p className="text-green-700">Unique Employees:</p>
                  <p className="font-medium text-green-900">{testResults.uniqueEmployees}</p>
                </div>
                <div>
                  <p className="text-green-700">Fetch Time:</p>
                  <p className="font-medium text-green-900">{testResults.performanceMetrics.fetchTime}ms</p>
                </div>
                <div>
                  <p className="text-green-700">Calculation Time:</p>
                  <p className="font-medium text-green-900">{testResults.performanceMetrics.calculationTime}ms</p>
                </div>
              </div>
              {testResults.totalRecordsFetched === 1350 && (
                <div className="mt-2 text-green-700 font-medium">
                  ✅ Successfully processed all 1,350 June 2025 records!
                </div>
              )}
            </div>
          )}

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
              onClick={() => calculateSalaries(false)} 
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
                      Present / W-Off / Leave
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-1">
                          <span className="bg-green-100 text-green-800 px-1 rounded text-xs">{result.days_present}</span>
                          <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs">{result.paid_weekly_offs}</span>
                          <span className="bg-purple-100 text-purple-800 px-1 rounded text-xs">{result.paid_leaves}</span>
                        </div>
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
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                          ₹{result.lwf_deduction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
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
