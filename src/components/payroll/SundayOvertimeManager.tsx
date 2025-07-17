import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Coffee, Clock, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { format, isSunday, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface SundayWork {
  attendance_id: string;
  employee_id: string;
  employee_name: string;
  unit_name: string;
  attendance_date: string;
  hours_worked: number;
  overtime_hours: number;
  current_status: string;
  is_sunday: boolean;
  needs_correction: boolean;
  overtime_amount: number;
  sunday_premium: number;
}

interface OvertimeSettings {
  regular_overtime_multiplier: number;
  sunday_overtime_multiplier: number;
}

export const SundayOvertimeManager = () => {
  const [sundayWork, setSundayWork] = useState<SundayWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [overtimeSettings, setOvertimeSettings] = useState<OvertimeSettings>({
    regular_overtime_multiplier: 1.5,
    sunday_overtime_multiplier: 2.0
  });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSundayWork();
    fetchOvertimeSettings();
  }, [dateRange]);

  const fetchOvertimeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('sunday_overtime_multiplier')
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setOvertimeSettings(prev => ({
          ...prev,
          sunday_overtime_multiplier: data.sunday_overtime_multiplier || 2.0
        }));
      }
    } catch (error) {
      console.error('Error fetching overtime settings:', error);
    }
  };

  const fetchSundayWork = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    try {
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];

      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          attendance_id,
          employee_id,
          attendance_date,
          hours_worked,
          overtime_hours,
          status,
          payroll_employees (
            name,
            base_salary,
            unit_id,
            units (unit_name)
          )
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false });

      if (error) throw error;

      const sundayWorkData: SundayWork[] = [];

      for (const record of attendanceData || []) {
        const workDate = new Date(record.attendance_date);
        const isSundayWork = isSunday(workDate);
        
        // Only include records for Sundays or records that need correction
        if (isSundayWork || (record.status === 'PRESENT' && record.hours_worked > 0)) {
          const employee = record.payroll_employees;
          const baseSalary = employee?.base_salary || 0;
          const hoursWorked = record.hours_worked || 0;
          const overtimeHours = record.overtime_hours || 0;
          
          // Calculate overtime amounts
          const dailyRate = baseSalary / 30; // Assuming 30 days per month
          const hourlyRate = dailyRate / 8; // Assuming 8 hours per day
          
          let overtimeAmount = 0;
          let sundayPremium = 0;
          let needsCorrection = false;

          if (isSundayWork && record.status === 'PRESENT' && hoursWorked > 0) {
            // Sunday work - all hours should be overtime at Sunday rate
            if (overtimeHours !== hoursWorked) {
              needsCorrection = true;
            }
            overtimeAmount = hourlyRate * overtimeHours * overtimeSettings.regular_overtime_multiplier;
            sundayPremium = hourlyRate * hoursWorked * overtimeSettings.sunday_overtime_multiplier;
          } else if (!isSundayWork && overtimeHours > 0) {
            // Regular overtime
            overtimeAmount = hourlyRate * overtimeHours * overtimeSettings.regular_overtime_multiplier;
          }

          sundayWorkData.push({
            attendance_id: record.attendance_id,
            employee_id: record.employee_id,
            employee_name: employee?.name || 'Unknown',
            unit_name: employee?.units?.unit_name || 'N/A',
            attendance_date: record.attendance_date,
            hours_worked: hoursWorked,
            overtime_hours: overtimeHours,
            current_status: record.status || 'PRESENT',
            is_sunday: isSundayWork,
            needs_correction: needsCorrection,
            overtime_amount: overtimeAmount,
            sunday_premium: sundayPremium
          });
        }
      }

      setSundayWork(sundayWorkData);
    } catch (error) {
      console.error('Error fetching Sunday work data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Sunday work data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const correctSundayOvertimeRecord = async (record: SundayWork) => {
    try {
      // For Sunday work, set overtime_hours = hours_worked
      const { error } = await supabase
        .from('attendance')
        .update({
          overtime_hours: record.hours_worked,
          updated_at: new Date().toISOString()
        })
        .eq('attendance_id', record.attendance_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Corrected Sunday overtime for ${record.employee_name}`,
      });

      fetchSundayWork(); // Refresh data
    } catch (error) {
      console.error('Error correcting Sunday overtime:', error);
      toast({
        title: "Error",
        description: "Failed to correct Sunday overtime",
        variant: "destructive",
      });
    }
  };

  const bulkCorrectSundayOvertimes = async () => {
    const recordsToCorrect = sundayWork.filter(record => 
      record.is_sunday && record.needs_correction
    );

    if (recordsToCorrect.length === 0) {
      toast({
        title: "Info",
        description: "No Sunday overtime records need correction",
      });
      return;
    }

    try {
      for (const record of recordsToCorrect) {
        await correctSundayOvertimeRecord(record);
      }

      toast({
        title: "Success",
        description: `Corrected ${recordsToCorrect.length} Sunday overtime records`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to bulk correct Sunday overtime records",
        variant: "destructive",
      });
    }
  };

  const updateOvertimeSettings = async () => {
    setIsUpdatingSettings(true);
    try {
      // Get the latest payroll settings record
      const { data: settingsData, error: fetchError } = await supabase
        .from('payroll_settings')
        .select('*')
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (settingsData) {
        // Update existing record
        const { error } = await supabase
          .from('payroll_settings')
          .update({
            sunday_overtime_multiplier: overtimeSettings.sunday_overtime_multiplier
          })
          .eq('effective_from', settingsData.effective_from);

        if (error) throw error;
      } else {
        // Create new record if none exists
        const { error } = await supabase
          .from('payroll_settings')
          .insert([{
            pf_rate: 12,
            esi_rate: 0.75,
            lwf_amount: 10,
            sunday_overtime_multiplier: overtimeSettings.sunday_overtime_multiplier,
            effective_from: new Date().toISOString().split('T')[0]
          }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Overtime settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating overtime settings:', error);
      toast({
        title: "Error",
        description: "Failed to update overtime settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const getStatusBadge = (record: SundayWork) => {
    if (record.is_sunday && record.needs_correction) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Needs Correction
        </Badge>
      );
    } else if (record.is_sunday) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Coffee className="w-3 h-3 mr-1" />
          Sunday Work
        </Badge>
      );
    } else {
      return (
        <Badge variant="default">
          <Clock className="w-3 h-3 mr-1" />
          Regular Overtime
        </Badge>
      );
    }
  };

  if (loading) {
    return <div>Loading Sunday overtime data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Overtime Settings
          </CardTitle>
          <CardDescription>
            Configure overtime multipliers for regular and Sunday work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="regular_ot">Regular Overtime Multiplier</Label>
              <Input
                id="regular_ot"
                type="number"
                step="0.1"
                min="1"
                max="3"
                value={overtimeSettings.regular_overtime_multiplier}
                onChange={(e) => setOvertimeSettings(prev => ({
                  ...prev,
                  regular_overtime_multiplier: parseFloat(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label htmlFor="sunday_ot">Sunday Overtime Multiplier</Label>
              <Input
                id="sunday_ot"
                type="number"
                step="0.1"
                min="1"
                max="3"
                value={overtimeSettings.sunday_overtime_multiplier}
                onChange={(e) => setOvertimeSettings(prev => ({
                  ...prev,
                  sunday_overtime_multiplier: parseFloat(e.target.value)
                }))}
              />
            </div>
            <Button 
              onClick={updateOvertimeSettings}
              disabled={isUpdatingSettings}
            >
              Update Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                Sunday Overtime Management
              </CardTitle>
              <CardDescription>
                Manage Sunday work and overtime corrections
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={bulkCorrectSundayOvertimes}>
                Bulk Correct Sundays
              </Button>
              <Button onClick={fetchSundayWork} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="grid gap-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Overtime Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Premium Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sundayWork.map((record) => (
                <TableRow 
                  key={record.attendance_id}
                  className={record.needs_correction ? 'bg-yellow-50 border-yellow-200' : ''}
                >
                  <TableCell className="font-medium">
                    {record.employee_name}
                  </TableCell>
                  <TableCell>{record.unit_name}</TableCell>
                  <TableCell>
                    {format(new Date(record.attendance_date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    {record.is_sunday ? (
                      <Badge className="bg-blue-100 text-blue-800">Sunday</Badge>
                    ) : (
                      <span>{format(new Date(record.attendance_date), 'EEEE')}</span>
                    )}
                  </TableCell>
                  <TableCell>{record.hours_worked}</TableCell>
                  <TableCell className={record.needs_correction ? 'text-red-600 font-bold' : ''}>
                    {record.overtime_hours}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {record.is_sunday ? (
                        <>
                          <div>₹{record.sunday_premium.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            (2x rate)
                          </div>
                        </>
                      ) : (
                        <>
                          <div>₹{record.overtime_amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            (1.5x rate)
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.is_sunday && record.needs_correction && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => correctSundayOvertimeRecord(record)}
                      >
                        Correct
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};