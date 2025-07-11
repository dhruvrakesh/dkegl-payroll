
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Attendance {
  attendance_id: string;
  employee_id: string;
  attendance_date: string;
  hours_worked: number;
  overtime_hours: number;
  payroll_employees?: { name: string };
  units?: { unit_name: string };
}

interface Employee {
  id: string;
  name: string;
}

interface AttendanceFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  employeeIds: string[];
  unitIds: string[];
}

interface AggregatedData {
  totalEmployees: number;
  totalHours: number;
  totalOvertimeHours: number;
  averageHoursPerDay: number;
  attendanceRate: number;
  dailyStats: Array<{
    date: string;
    totalHours: number;
    employeeCount: number;
  }>;
  employeeStats: Array<{
    employeeId: string;
    employeeName: string;
    totalHours: number;
    totalDays: number;
    averageHours: number;
  }>;
}

export const useAttendanceData = (filters: AttendanceFilters) => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData>({
    totalEmployees: 0,
    totalHours: 0,
    totalOvertimeHours: 0,
    averageHoursPerDay: 0,
    attendanceRate: 0,
    dailyStats: [],
    employeeStats: []
  });
  const { toast } = useToast();

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('attendance')
        .select(`
          *,
          payroll_employees (
            name
          ),
          units (
            unit_name
          )
        `);

      // Apply filters
      if (filters.dateRange.from) {
        query = query.gte('attendance_date', filters.dateRange.from.toISOString().split('T')[0]);
      }
      if (filters.dateRange.to) {
        query = query.lte('attendance_date', filters.dateRange.to.toISOString().split('T')[0]);
      }
      if (filters.employeeIds.length > 0) {
        query = query.in('employee_id', filters.employeeIds);
      }

      const { data, error } = await query.order('attendance_date', { ascending: false });

      if (error) throw error;
      
      const records = data || [];
      setAttendanceRecords(records);
      
      // Calculate aggregated data
      calculateAggregatedData(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const calculateAggregatedData = (records: Attendance[]) => {
    if (records.length === 0) {
      setAggregatedData({
        totalEmployees: 0,
        totalHours: 0,
        totalOvertimeHours: 0,
        averageHoursPerDay: 0,
        attendanceRate: 0,
        dailyStats: [],
        employeeStats: []
      });
      return;
    }

    const uniqueEmployees = new Set(records.map(r => r.employee_id));
    const totalEmployees = uniqueEmployees.size;
    const totalHours = records.reduce((sum, r) => sum + r.hours_worked, 0);
    const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
    
    // Calculate daily stats
    const dailyMap = new Map();
    records.forEach(record => {
      const date = record.attendance_date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { totalHours: 0, employeeCount: 0, employees: new Set() });
      }
      const dayData = dailyMap.get(date);
      dayData.totalHours += record.hours_worked;
      dayData.employees.add(record.employee_id);
      dayData.employeeCount = dayData.employees.size;
    });

    const dailyStats = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      totalHours: data.totalHours,
      employeeCount: data.employeeCount
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate employee stats
    const employeeMap = new Map();
    records.forEach(record => {
      const empId = record.employee_id;
      const empName = record.payroll_employees?.name || 'Unknown';
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, { 
          employeeId: empId, 
          employeeName: empName, 
          totalHours: 0, 
          totalDays: 0 
        });
      }
      const empData = employeeMap.get(empId);
      empData.totalHours += record.hours_worked;
      empData.totalDays += 1;
    });

    const employeeStats = Array.from(employeeMap.values()).map(emp => ({
      ...emp,
      averageHours: emp.totalDays > 0 ? emp.totalHours / emp.totalDays : 0
    }));

    const averageHoursPerDay = dailyStats.length > 0 
      ? dailyStats.reduce((sum, day) => sum + day.totalHours, 0) / dailyStats.length 
      : 0;

    setAggregatedData({
      totalEmployees,
      totalHours,
      totalOvertimeHours,
      averageHoursPerDay,
      attendanceRate: 0, // This would need more complex calculation based on expected vs actual attendance
      dailyStats,
      employeeStats
    });
  };

  const refreshAttendance = () => {
    fetchAttendanceRecords();
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [filters]);

  return {
    attendanceRecords,
    employees,
    loading,
    refreshAttendance,
    aggregatedData
  };
};
